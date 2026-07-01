import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { readFileSync } from "fs";
import { join } from "path";
import type { DiggingContext } from "@/types";

// 전체 기본 모델 (ID 틀리면 여기 한 줄만 고치면 됨)
const SONNET = "claude-sonnet-5";
// 완성본은 gpt-4o(한국어 문장 매끄러움), 소제목·면접다듬기 등 보조는 mini(비용). 디깅은 Sonnet.
const GPT_MINI = "gpt-4o-mini";
const GPT_4O = "gpt-4o";

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function prompt(name: string) {
  return readFileSync(join(process.cwd(), "src", "prompts", `${name}.txt`), "utf-8");
}

function buildCtx(ctx: DiggingContext): string {
  return (
    `\n\n## 세션 정보\n` +
    `직무: ${ctx.jobTitle}\n` +
    `문항: ${ctx.question}\n` +
    `경험:\n${ctx.experiences.map((e, i) => `  ${i + 1}. [${e.type}] ${e.text}`).join("\n")}`
  );
}

type MsgParam = Anthropic.MessageParam;
type SystemParam = string | Anthropic.Messages.TextBlockParam[];

async function stream(system: SystemParam, messages: MsgParam[], maxTokens = 2048, model = SONNET) {
  const enc = new TextEncoder();
  const client = getClient();
  let s: ReturnType<typeof client.messages.stream>;
  try {
    s = await client.messages.stream({
      model,
      max_tokens: maxTokens,
      system,
      messages,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "API 연결 오류";
    return new Response(enc.encode(`오류가 발생했어요. 다시 시도해주세요.\n(${msg})`), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  return new Response(
    new ReadableStream({
      async start(ctrl) {
        try {
          for await (const chunk of s) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              ctrl.enqueue(enc.encode(chunk.delta.text));
            }
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : "스트리밍 오류";
          try { ctrl.enqueue(enc.encode(`\n오류가 발생했어요. 다시 시도해주세요.\n(${msg})`)); } catch { /* 무시 */ }
        } finally {
          try { ctrl.close(); } catch { /* 이미 닫힌 경우 무시 */ }
        }
      },
      cancel() {
        try { s.abort(); } catch { /* 무시 */ }
      },
    }),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
}

// Anthropic 메시지 → OpenAI 텍스트 (이미지 블록은 텍스트만 추출)
function toOpenAIText(content: MsgParam["content"]): string {
  if (typeof content === "string") return content;
  return content.map((b) => (b.type === "text" ? b.text : "")).join("\n").trim();
}

async function streamOpenAI(system: SystemParam, messages: MsgParam[], maxTokens = 2048, model = GPT_MINI) {
  const enc = new TextEncoder();
  const client = getOpenAI();
  const sysText = typeof system === "string" ? system : system.map((s) => s.text).join("\n\n");
  const oaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: sysText },
    ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: toOpenAIText(m.content) })),
  ];
  let s: Awaited<ReturnType<typeof client.chat.completions.create>>;
  try {
    s = await client.chat.completions.create({ model, max_tokens: maxTokens, messages: oaiMessages, stream: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "API 연결 오류";
    return new Response(enc.encode(`오류가 발생했어요. 다시 시도해주세요.\n(${msg})`), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
  return new Response(
    new ReadableStream({
      async start(ctrl) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          for await (const chunk of s as any) {
            const delta = chunk.choices?.[0]?.delta?.content;
            if (delta) ctrl.enqueue(enc.encode(delta));
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : "스트리밍 오류";
          try { ctrl.enqueue(enc.encode(`\n오류가 발생했어요. 다시 시도해주세요.\n(${msg})`)); } catch { /* 무시 */ }
        } finally {
          try { ctrl.close(); } catch { /* 이미 닫힌 경우 무시 */ }
        }
      },
    }),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } }
  );
}

async function generateOpenAI(system: string, messages: MsgParam[], model = GPT_MINI) {
  const client = getOpenAI();
  const oaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: system },
    ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: toOpenAIText(m.content) })),
  ];
  const res = await client.chat.completions.create({ model, max_tokens: 2048, messages: oaiMessages });
  const text = res.choices[0]?.message?.content ?? "";
  const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  try {
    return Response.json(match ? JSON.parse(match[0]) : { raw: text });
  } catch {
    return Response.json({ raw: text });
  }
}

// GPT mini 비스트리밍 텍스트 생성 (2단계 1차용)
async function generateOpenAIText(system: SystemParam, messages: MsgParam[], maxTokens = 2048, model = GPT_MINI): Promise<string> {
  const client = getOpenAI();
  const sysText = typeof system === "string" ? system : system.map((s) => s.text).join("\n\n");
  const oaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: sysText },
    ...messages.map((m) => ({ role: m.role as "user" | "assistant", content: toOpenAIText(m.content) })),
  ];
  const res = await client.chat.completions.create({ model, max_tokens: maxTokens, messages: oaiMessages });
  return res.choices[0]?.message?.content ?? "";
}

// 완성본 2단계 생성: 1차 초안 → 2차 검토·교정(추상성·1문단↔본문 일관·연결·분량) → 최종본만 스트리밍.
// 지원동기는 해석이 들어가 추상적으로 흐르기 쉬워서, 초안을 그대로 내지 않고 반드시 검토·교정 한 번 더 태운다.
async function streamCompletion2Stage(sys: SystemParam, msgs: MsgParam[], label: "지원동기" | "수정본", draftText: string) {
  // 1차: 초안 생성 (gpt-4o)
  let draftFull = "";
  try {
    draftFull = await generateOpenAIText(sys, msgs, 2048, GPT_4O);
  } catch {
    return streamOpenAI(sys, msgs, 2048, GPT_4O); // 1차 실패 시 단일 패스 폴백
  }
  const bodyM = draftFull.match(new RegExp(`\\[${label}\\]([\\s\\S]*?)\\[\\/${label}\\]`));
  const draftBody = bodyM ? bodyM[1].trim() : draftFull.trim();
  const changeM = draftFull.match(/\[변경사항\]([\s\S]*?)\[\/변경사항\]/);
  const draftChanges = changeM ? changeM[1].trim() : "";
  const targetLen = (draftText || "").length;
  // 2차: 검토·교정
  const reviewSys =
    "당신은 자소서 편집자다. 아래 완성본 초안을 검토해 문제가 있으면 고친 '최종본'을 낸다.\n" +
    "검토 기준(걸리면 고친다):\n" +
    "- 추상적 표현으로 때웠는가 → 구체적 행동·판단·사실로 바꾼다. (해석이 들어가 추상적으로 흐르기 쉬우니 본문은 특히 팩트·행동 중심으로.)\n" +
    "- ★1문단 첫 문장 테스트: '회사가 구체적으로 무엇을 만들고 다루는지(확인 가능한 사실)'인가, 아니면 '추상적 자기소개'인가? '~하는 기업/회사/컴퍼니입니다' 정체성 정의, 또는 '철학·가치·감성·혁신·창의성·크리에이티브·독창적·감각적으로 전달' 같은 홈페이지 자기소개 수식이면 → 무조건 고친다. 이런 건 어느 회사에나 붙는 뜬구름이라 지원자가 실제로 뭘 아는지 0이다. 회사가 실제로 뭘 하는지 손에 잡히는 사실로 바꾸고, '회사가 실제로 하는 일 → 그게 이 직무에서 갖는 의미 → 내 경험과 연결' 순서로 다시 쓴다.\n" +
    "- 1문단이 선언한 방향을 본문이 실제로 증명하는가 → 겉돌면 1문단을 본문 핵심에 맞춰 고친다. 1문단·본문·포부가 하나의 흐름이어야 한다.\n" +
    "- 각 문단 첫 문장이 앞 문단을 받아 여는가(토막나지 않는가) → 안 이어지면 잇는다.\n" +
    (targetLen ? `- 학생 초안 분량(약 ${targetLen}자)과 비슷한가 → 크게 벗어나면 맞춘다.\n` : "") +
    "- ★분량 배분: 1문단(서론)과 마지막 문단(포부)이 각 2~4문장으로 짧은가 → 길면 회사 설명·수식·반복 다짐을 덜어 줄이고, 그 분량을 본문(경험)에 준다. 지원동기 설득력은 경험에서 나오니 본문(구체적 행동·판단·상황)이 가장 두꺼워야 한다. 앞뒤가 길어 본문이 얇으면 반드시 앞뒤를 줄이고 본문을 두껍게 고친다.\n" +
    "- 구어체·감정 토로('당황했다·막막했다·힘들었다·설레었다' 류)를 쓰지 않았는가 → 그 상황이 객관적으로 어땠는지와 내 판단으로 바꾼다.\n" +
    "- 자기 감상·평가어를 근거 없이 홀로 쓰지 않았는가. 전체가 합니다체인가.\n" +
    "규칙: 초안에 있는 사실·경험은 그대로 살린다(새 사실 지어내기 금지). 표현·구조·연결만 다듬는다. 문제가 없으면 거의 그대로 둔다.\n" +
    `출력: 최종본 본문만 아래 형식으로, 다른 말 없이(변경사항은 출력하지 마라).\n[${label}]\n(최종 완성본 본문)\n[/${label}]`;
  const reviewUser =
    `[완성본 초안]\n${draftBody}` +
    (draftChanges ? `\n\n[초안 변경사항 메모]\n${draftChanges}` : "") +
    `\n\n위 초안을 검토·교정해 최종본만 출력하라.`;
  return streamOpenAI(reviewSys, [{ role: "user", content: reviewUser }], 2048, GPT_4O);
}

async function generate(system: string, messages: MsgParam[], model = SONNET) {
  const client = getClient();
  const res = await client.messages.create({
    model,
    max_tokens: 2048,
    system,
    messages,
  });
  const text = res.content[0].type === "text" ? res.content[0].text : "";
  const match = text.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
  try {
    return Response.json(match ? JSON.parse(match[0]) : { raw: text });
  } catch {
    return Response.json({ raw: text });
  }
}

async function fetchUrlText(url: string): Promise<string> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" },
    });
    clearTimeout(timer);
    if (!res.ok) return "";
    const html = await res.text();
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 3000);
  } catch {
    return "";
  }
}

export async function POST(req: Request) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  switch (body.type) {
    case "digging": {
      const sys = prompt("digging") + buildCtx(body.context);
      const msgs: MsgParam[] =
        body.messages?.length > 0
          ? body.messages
          : [{ role: "user", content: "첫 번째 질문을 시작해줘." }];
      return stream(sys, msgs);
    }

    case "bridge": {
      const sys = prompt("bridge") + buildCtx(body.context);
      const history: MsgParam[] = body.history ?? [];
      const msgs: MsgParam[] = [
        ...history,
        { role: "user", content: "위 대화를 바탕으로 브릿지 분석 JSON을 출력해줘." },
      ];
      return generate(sys, msgs);
    }

    case "cover-letter": {
      const sys = prompt("cover-letter-gen") + buildCtx(body.context);
      const history: MsgParam[] = body.history ?? [];
      const msgs: MsgParam[] = [
        ...history,
        { role: "user", content: "위 대화에서 나온 경험을 바탕으로 자소서 초안을 작성해줘." },
      ];
      return stream(sys, msgs);
    }

    case "interview-risk": {
      const sys = prompt("interview-risk");
      const history: MsgParam[] = body.history ?? [];
      const msgs: MsgParam[] = [
        ...history,
        {
          role: "user",
          content: `완성된 자소서:\n${body.coverLetter}\n\n이 자소서를 바탕으로 면접 준비 노트 JSON을 출력해줘.`,
        },
      ];
      return generate(sys, msgs);
    }

    case "personality": {
      const sys: Anthropic.Messages.TextBlockParam[] = [
        { type: "text", text: prompt("common") + "\n\n" + prompt("personality_v2"), cache_control: { type: "ephemeral" } },
        { type: "text", text: `## 세션 정보\n직무: ${body.jobTitle || "미입력"}\n회사: ${body.companyInfo || "미입력"}\n글자 수 제한: ${body.charLimit ? `${body.charLimit}자 (수정본 작성 시 이 글자 수에 맞춰야 함)` : "미입력"}${body.jobPostText ? `\n\n## 채용공고(JD)\n${body.jobPostText}` : ""}\n\n## 자소서 초안\n${body.draft}`, cache_control: { type: "ephemeral" } },
      ];
      const baseMsgs: MsgParam[] = body.messages?.length > 0
        ? body.messages
        : [{ role: "user", content: "초안을 분석하고 첫 질문을 시작해줘." }];
      let msgs: MsgParam[] = baseMsgs;
      if (body.jobPostImage && baseMsgs.length === 1 && typeof baseMsgs[0].content === "string") {
        const m = (body.jobPostImage as string).match(/^data:([^;]+);base64,(.+)$/);
        if (m) {
          const mediaType = m[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
          msgs = [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: m[2] } },
              { type: "text", text: `위 이미지는 이 직무의 채용공고입니다. 직무 이해의 근거로 참고해주세요.\n\n${baseMsgs[0].content as string}` },
            ],
          }];
        }
      }
      // 완성본(수정본) 작성 단계만 Haiku로 (디깅은 Sonnet). 트리거: 마지막 user 메시지 "완성본을 작성해줘."
      const lastMsgP = body.messages?.[body.messages.length - 1];
      const isCompletionP = typeof lastMsgP?.content === "string" && lastMsgP.content.includes("완성본을 작성해줘");
      return isCompletionP ? streamOpenAI(sys, msgs) : stream(sys, msgs);
    }

    case "motivation": {
      const sys: Anthropic.Messages.TextBlockParam[] = [
        { type: "text", text: prompt("common") + "\n\n" + prompt("motivation_v2"), cache_control: { type: "ephemeral" } },
        { type: "text", text: `## 세션 정보\n직무: ${body.jobTitle}\n회사: ${body.companyInfo || "미입력"}\n글자 수 제한: ${body.charLimit ? `${body.charLimit}자 (완성본 작성 시 이 글자 수에 맞춰야 함)` : "미입력"}${body.jobPostText ? `\n\n## 채용공고(JD)\n${body.jobPostText}` : ""}\n\n## 자소서 초안\n${body.draft}`, cache_control: { type: "ephemeral" } },
      ];
      const baseMsgs: MsgParam[] = body.messages?.length > 0
        ? body.messages
        : [{ role: "user", content: "초안을 분석하고 첫 질문을 시작해줘." }];
      let msgs: MsgParam[] = baseMsgs;
      if (body.jobPostImage && baseMsgs.length === 1 && typeof baseMsgs[0].content === "string") {
        const m = (body.jobPostImage as string).match(/^data:([^;]+);base64,(.+)$/);
        if (m) {
          const mediaType = m[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
          msgs = [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: m[2] } },
              { type: "text", text: `위 이미지는 이 직무의 채용공고입니다. 회사·직무 이해의 근거로 참고해주세요.\n\n${baseMsgs[0].content as string}` },
            ],
          }];
        }
      }
      // 완성본 작성 단계만 모델 분기 (디깅은 Sonnet 유지). 완성본은 마지막 user 메시지가 "완성본을 작성해줘."일 때 생성됨.
      const lastMsg = body.messages?.[body.messages.length - 1];
      const isCompletion = typeof lastMsg?.content === "string" && lastMsg.content.includes("완성본을 작성해줘");
      // 완성본은 gpt-4o 2단계(초안 → 자기 검토·교정), 디깅은 Sonnet
      return isCompletion ? streamCompletion2Stage(sys, msgs, "지원동기", body.draft as string) : stream(sys, msgs);
    }

    case "analyze": {
      const sys: Anthropic.Messages.TextBlockParam[] = [
        { type: "text", text: prompt("analyze_v4"), cache_control: { type: "ephemeral" } },
        { type: "text", text: `## 세션 정보\n직무: ${body.jobTitle}\n회사: ${body.companyInfo || "미입력"}\n문항: ${body.question || "미입력"}\n글자 수 제한: ${body.charLimit ? `${body.charLimit}자 (수정본 작성 시 이 글자 수에 맞춰야 함)` : "미입력"}${body.jobPostText ? `\n\n## 채용공고(JD)\n${body.jobPostText}` : ""}\n\n## 자소서 초안\n${body.draft}`, cache_control: { type: "ephemeral" } },
      ];
      const baseMsgs: MsgParam[] = body.messages?.length > 0
        ? body.messages
        : [{ role: "user", content: "자소서 초안을 분석하고 첫 질문을 시작해줘." }];
      // 첫 호출에 채용공고 이미지가 있으면 첫 메시지에 붙여 직무 이해 근거로 활용
      let msgs: MsgParam[] = baseMsgs;
      if (body.jobPostImage && baseMsgs.length === 1 && typeof baseMsgs[0].content === "string") {
        const m = (body.jobPostImage as string).match(/^data:([^;]+);base64,(.+)$/);
        if (m) {
          const mediaType = m[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
          msgs = [{
            role: "user",
            content: [
              { type: "image", source: { type: "base64", media_type: mediaType, data: m[2] } },
              { type: "text", text: `위 이미지는 이 직무의 채용공고입니다. 직무 이해의 근거로 참고해주세요.\n\n${baseMsgs[0].content as string}` },
            ],
          }];
        }
      }
      // 수정본(완성본) 작성 단계만 Opus로 (디깅은 Sonnet). 트리거: 마지막 user 메시지 "완성본을 작성해줘."
      const lastMsgA = body.messages?.[body.messages.length - 1];
      const isCompletionA = typeof lastMsgA?.content === "string" && lastMsgA.content.includes("완성본을 작성해줘");
      return isCompletionA ? streamOpenAI(sys, msgs) : stream(sys, msgs);
    }

    case "interview-questions": {
      if (body.chatMode === "motivation") {
        const sys =
          "당신은 이 회사의 면접관입니다. 지원자의 지원동기 자소서를 보고, 실제 면접에서 던질 법한 날카로운 예상 질문 4개를 만드세요.\n" +
          "원론적 질문(왜 지원했나요 / 입사 후 무엇을 하고 싶나요)은 금지입니다 — 이미 준비된 답만 나옵니다. 자소서가 주장한 내용을 압박하고 검증하는 질문이어야 합니다.\n" +
          "아래 네 각도로 하나씩, 반드시 이 회사·이 자소서의 구체적 내용에 근거해 만드세요:\n" +
          "1. 회사 이해 압박 — 자소서가 보인 회사·직무 이해를 한 단계 더 깊이 파고들거나 경쟁사 대비 차별점을 묻는다. 동기가 진짜 이해인지 검증.\n" +
          "2. 접합점 간극 — 지원자의 경험과 이 직무가 실제로 요구하는 것 사이의 차이를 짚어, 그 간극을 어떻게 메울지 묻는다.\n" +
          "3. 포부 현실성 — 자소서의 입사 후 포부를 현업 관점에서 찌른다. 그렇게 단순하지 않은 지점을 묻는다.\n" +
          "4. 동기 택일 — 같은 일을 하는 다른 회사가 아니라 왜 하필 이 회사인지를 날카롭게 묻는다(합격 시 택일 상황 포함).\n" +
          "각 질문은 이 회사·자소서 맥락에 구체적이어야 하며 일반론이면 안 됩니다. 질문 문장에 쉼표(,)를 쓰지 마세요.\n" +
          "반드시 JSON 배열만 출력하세요. 다른 텍스트 없이: [\"질문1\",\"질문2\",\"질문3\",\"질문4\"]";
        const jd = body.jobPostText ? `채용공고(JD):\n${body.jobPostText}\n\n` : "";
        const messages: MsgParam[] = [
          {
            role: "user",
            content:
              `회사: ${body.companyInfo || "미입력"}\n직무: ${body.jobTitle || "미입력"}\n자소서 문항: ${body.question || "미입력"}\n\n${jd}지원동기 자소서:\n${body.coverLetter}\n\n` +
              "위 네 각도로 예상 질문 4개를 JSON 배열로만 출력해줘.",
          },
        ];
        return generate(sys, messages);
      }
      if (body.chatMode === "analyze") {
        const sys =
          "당신은 이 회사의 면접관입니다. 지원자의 직무역량 자소서를 보고, 실제 면접에서 던질 법한 날카로운 예상 질문 4개를 만드세요.\n" +
          "원론적 질문(뻔한 자기소개·장단점)은 금지입니다. 자소서가 주장한 역량·경험을 압박하고 검증하는 질문이어야 합니다.\n" +
          "아래 네 각도로 하나씩, 반드시 이 자소서의 구체적 경험·역량에 근거해 만드세요:\n" +
          "1. 판단 근거 압박 — 자소서 속 핵심 판단·선택에 대해 왜 그렇게 했는지, 다른 선택지는 왜 아니었는지 캐묻는다.\n" +
          "2. 재현성 검증 — 그 성과가 운·상황이 아니라 본인 역량임을, 비슷한 상황에서 또 해낼 수 있음을 어떻게 보장하는지 묻는다.\n" +
          "3. 직무 적용 — 그 역량을 이 직무가 실제로 하는 업무에 어떻게 적용할지 구체적으로 묻는다.\n" +
          "4. 깊이·한계 압박 — 그 경험에서 아쉬웠던 점·한계, 또는 한 단계 더 깊은 전문성을 이 직무·도메인 맥락에서 찌른다.\n" +
          "각 질문은 이 자소서·직무 맥락에 구체적이어야 하며 일반론이면 안 됩니다. 질문 문장에 쉼표(,)를 쓰지 마세요.\n" +
          "반드시 JSON 배열만 출력하세요. 다른 텍스트 없이: [\"질문1\",\"질문2\",\"질문3\",\"질문4\"]";
        const jd = body.jobPostText ? `채용공고(JD):\n${body.jobPostText}\n\n` : "";
        const messages: MsgParam[] = [
          { role: "user", content: `회사: ${body.companyInfo || "미입력"}\n직무: ${body.jobTitle || "미입력"}\n자소서 문항: ${body.question || "미입력"}\n\n${jd}자소서:\n${body.coverLetter}\n\n위 네 각도로 예상 질문 4개를 JSON 배열로만 출력해줘.` },
        ];
        return generate(sys, messages);
      }
      if (body.chatMode === "personality") {
        const sys =
          "당신은 이 회사의 면접관입니다. 지원자의 성향(성격·가치관) 자소서를 보고, 실제 면접에서 던질 법한 날카로운 예상 질문 4개를 만드세요.\n" +
          "원론적 질문(장단점이 뭔가요 같은 뻔한 것)은 금지입니다. 자소서가 주장한 성향이 진짜이고 일관되는지 검증하는 질문이어야 합니다.\n" +
          "아래 네 각도로 하나씩, 반드시 이 자소서의 구체적 일화·성향에 근거해 만드세요:\n" +
          "1. 일관성 검증 — 그 성향이 드러난 다른 사례를 묻는다. 한 번의 일화인지 반복되는 패턴인지 확인한다.\n" +
          "2. 반대 상황 — 그 성향이 약점으로 작용했거나 통하지 않았던 상황을 묻는다.\n" +
          "3. 직무·조직 적합성 — 그 성향이 이 직무·조직 환경에서 실제로 어떻게 작동할지 묻는다.\n" +
          "4. 자기 인식 깊이 — 그 성향의 근원이나 그것을 다루는 방식을 찌른다.\n" +
          "각 질문은 이 자소서 맥락에 구체적이어야 하며 일반론이면 안 됩니다. 질문 문장에 쉼표(,)를 쓰지 마세요.\n" +
          "반드시 JSON 배열만 출력하세요. 다른 텍스트 없이: [\"질문1\",\"질문2\",\"질문3\",\"질문4\"]";
        const jd = body.jobPostText ? `채용공고(JD):\n${body.jobPostText}\n\n` : "";
        const messages: MsgParam[] = [
          { role: "user", content: `회사: ${body.companyInfo || "미입력"}\n직무: ${body.jobTitle || "미입력"}\n자소서 문항: ${body.question || "미입력"}\n\n${jd}자소서:\n${body.coverLetter}\n\n위 네 각도로 예상 질문 4개를 JSON 배열로만 출력해줘.` },
        ];
        return generate(sys, messages);
      }
      const sys =
        "당신은 면접 전문가입니다. 자소서를 분석하여 면접관이 실제로 물어볼 법한 예상 질문 4개를 생성하세요. " +
        "질문 문장에 쉼표(,)를 사용하지 마세요. " +
        "반드시 JSON 배열만 출력하세요. 다른 텍스트 없이: [\"질문1\",\"질문2\",\"질문3\",\"질문4\"]";
      const messages: MsgParam[] = [
        {
          role: "user",
          content:
            `직무: ${body.jobTitle || "미입력"}\n자소서 문항: ${body.question || "미입력"}\n\n자소서:\n${body.coverLetter}\n\n` +
            "이 자소서를 바탕으로 면접관이 실제로 물어볼 법한 예상 질문 4개를 JSON 배열로만 출력해줘.",
        },
      ];
      return generate(sys, messages);
    }

    case "interview-feedback": {
      const sys =
        `면접 코치. 직무: ${body.jobTitle || "미입력"}. 자소서 문항: ${body.question || "미입력"}.\n` +
        `면접 질문: "${body.interviewQuestion}".\n` +
        "학생 답변에 피드백을 줘라. 잘한 점과 보완할 점을 구체적으로 짚어줘. 답변 길이·글자수는 지적하지 마라(50초 안내는 입력창에서 이미 주고 있다). \"~요\" 체로 따뜻하게. 4~5문장 이내. 마크다운 볼드(**) 절대 금지. 쉼표(,) 남발 금지. 명사·항목 나열 외에는 쓰지 마라.";
      const messages: MsgParam[] = [{ role: "user", content: body.answer }];
      return stream(sys, messages);
    }

    case "interview-polish": {
      const sys =
        `면접 코치. 직무: ${body.jobTitle || "미입력"}. 면접 질문: "${body.interviewQuestion}".\n` +
        "학생이 앞선 피드백을 반영해 다시 쓴 답변이다. 새로 피드백하거나 평가하지 마라. 이 답변의 '문장만' 다듬어, 면접에서 말하기 좋은 정돈된 답변으로 만들어줘라.\n" +
        "- 내용·논점·구조는 학생 것 그대로 둬라. 없는 내용을 더하거나 성과·규모를 부풀리지 마라.\n" +
        "- 구어체·군더더기를 정리하고 문장을 매끄럽게. 면접에서 말하듯 자연스럽게(합니다체 중심).\n" +
        "- 면접에서 말하기 자연스러운 길이로. 지나치게 길면 핵심만 남겨 줄여도 좋다(글자수에 집착하진 마라). 짧으면 억지로 늘리지 마라.\n" +
        "- 다듬은 답변 본문만 출력해라. 말머리·설명·따옴표 없이. 마크다운 볼드(**) 금지.";
      const messages: MsgParam[] = [{ role: "user", content: body.answer }];
      return streamOpenAI(sys, messages, 2048, GPT_4O);
    }

    case "trim": {
      const lim = parseInt(String(body.charLimit || 0), 10) || 0;
      const sys =
        `다음 자소서가 글자수 제한(${lim}자)을 약간 넘었다. 딱 초과한 만큼만 최소로 줄여라.\n` +
        "- ★문단이나 문장, 내용을 통째로 빼지 마라. 모든 문단과 핵심 내용·구조·순서는 그대로 유지한다.\n" +
        "- 군더더기 수식어·중복되는 말·늘어지는 어구만 다듬어 문장을 조금씩 압축해 줄인다. 줄인 티가 거의 안 나야 한다.\n" +
        `- 목표 분량은 ${Math.round(lim * 0.93)}~${lim}자다. 이보다 더 줄이지 마라(너무 짧아지면 안 된다). 단 ${lim}자는 넘기지 마라.\n` +
        "- 새 내용 추가·표현 변경 금지. 합니다체 유지. 줄인 본문만 출력(설명·마커·따옴표·제목 없이).";
      return streamOpenAI(sys, [{ role: "user", content: body.content as string }]);
    }

    case "subtitle": {
      const sys = `# 소제목 생성 원칙
소제목은 사례를 요약하거나 핵심 키워드를 나열하는 게 아니다. 지원자의 사고방식과 일하는 방식을 한 문장으로 압축하는 것이 목적이다. 기준 질문: "이 지원자를 한 문장으로 표현하면?"

## 생성 순서 (1~2단계는 내부 추론, 출력하지 않는다)
1단계. 핵심 판단 찾기: 이 사례에서 지원자가 가장 먼저 내린 판단이 무엇인지 찾는다.
2단계. 차이 찾기: 대부분의 사람이라면 어떻게 했을까? 지원자는 왜 다른 선택을 했나? 그 선택에서 드러난 사고방식은 무엇인가? (소제목은 대부분 여기서 나온다.)
3단계. 사람을 표현: 사건·결과를 제목으로 만들지 말고, 그 사례로 드러난 '일하는 방식'을 판단·행동이 담긴 동사형으로 표현한다.
4단계. 압축: 10~18자 내외의 자연스러운 문장으로. 책의 챕터 제목처럼 읽혀야 하고, 자소서 키워드처럼 보이면 안 된다.

# 반드시 지킬 원칙
- 사례를 요약하지도, 결과를 설명하지도 않는다. 지원자의 사고방식·판단 기준을 표현한다.
- '무엇을 했는가'보다 '어떻게 판단하는 사람인가'가 드러나야 한다.
- 추상적 단어 대신 이 사례에서만 나올 수 있는 표현을 쓴다. 사례를 읽기 전에도 어떤 사람인지 상상되어야 한다.
- 3개는 서로 다른 각도 + 같은 문장 구조를 반복하지 않는다.

# 절대 쓰지 않는 형태
'OO의 리더십·OO 역량·OO 능력·OO 태도·OO 접근법·OO 감각·OO 정신·OO하기·문제 해결·협업·실행력·성장·도전·적극성·책임감·소통 능력·위기 속의 OO·성공을 위한 OO' 처럼 대부분의 지원자에게 그대로 붙는 추상 표현. ('협상 경험'·'문제 해결 능력'·'실행력'·'예측과 조율의 리더십'이 그 나쁜 예다.)

# 최종 검증 (통과한 것만 출력)
1. 이 소제목을 다른 사례에도 그대로 붙일 수 있나? → YES면 다시 작성.
2. 사례의 결과를 제목으로 만든 건 아닌가? → 판단·사고방식이 드러나게 수정.
3. 사례를 안 읽어도 어떤 사람인지 떠오르나? → 아니면 다시 작성.
4. 이 사례에서만 나올 수 있는 표현인가? → 아니면 더 구체적인 사고방식으로 수정.

# 출력
위 4가지를 모두 통과한 소제목 3개만 JSON 배열로 출력한다. 따옴표·마침표·이모지·쉼표 없이, 형식 ["...", "...", "..."], 점 자리에 진짜 소제목을 넣고 자리표시자는 출력하지 않는다.`;
      const messages: MsgParam[] = [
        { role: "user", content: `직무: ${body.jobTitle || "미입력"}\n자소서 문항: ${body.question || "미입력"}\n\n완성된 자소서:\n${body.coverLetter}\n\n위 글에 어울리는 소제목 3개를 JSON 배열로만 추천해줘.` },
      ];
      return generateOpenAI(sys, messages);
    }

    case "update-message": {
      const { createClient } = await import("@supabase/supabase-js");
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { error } = await adminClient
        .from("messages")
        .update({ content: body.content })
        .eq("id", body.message_id);
      if (error) {
        console.error("[DB] messages update error:", error);
        return Response.json({ error: error.message }, { status: 500 });
      }
      return Response.json({ ok: true });
    }

    case "save-revision": {
      const { createClient } = await import("@supabase/supabase-js");
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const id = crypto.randomUUID();
      const changes = (body.changesText as string)
        .split("\n")
        .map((l: string) => l.replace(/^[-·•]\s*/, "").trim())
        .filter(Boolean);
      const { error: revErr } = await adminClient.from("revisions").insert({
        id,
        cover_item_id: body.cover_item_id,
        content: body.content,
        changes,
      });
      if (revErr) {
        console.error("[DB] revisions insert error:", revErr);
        return Response.json({ error: revErr.message }, { status: 500 });
      }
      await adminClient
        .from("cover_items")
        .update({ status: "done", updated_at: new Date().toISOString() })
        .eq("id", body.cover_item_id);
      return Response.json({ id });
    }

    case "company-analysis": {
      if (process.env.NODE_ENV === "development") {
        return new Response("", { status: 200 });
      }
      const hasCompany = !!(body.companyName?.trim() || body.companyWebsite?.trim());

      const COMMON_PRINCIPLES = `작성 원칙:
- 단순 나열이 아닌 이해를 기반으로 특징을 분석해서 써라. "이것은 무엇입니다"가 아니라 "이것이 왜 이런 특징을 갖는가, 무엇이 이 제품·직무를 특별하게 만드는가"를 중심으로 써라. 외부 자료를 그대로 옮기지 말고 그 자료를 이해하고 재해석한 결과를 써라.
- 각 항목은 키워드 나열이 아닌 완성된 문장으로 서술한다.
- 줄임말·약어 사용 금지. 모든 용어는 풀어서 서술한다.
- 확인된 사실은 단정적으로. "추측됩니다" "판단됩니다" "보입니다" 같은 불확실 표현 사용 금지.
- 확인할 수 없는 항목은 내용을 지어내지 말고 해당 항목에 "공개된 자료에서 확인할 수 없습니다"라고 명시한다.
- 마크다운 볼드(**) 사용 금지. 섹션 제목에만 ## 사용`;

      const sys = hasCompany
        ? `당신은 취업 전략 컨설턴트입니다. 지원자가 자소서와 면접을 준비할 수 있도록, 기업과 직무를 심층 분석한 전문 보고서를 작성합니다.

${COMMON_PRINCIPLES}

분석 우선순위:
- 회사 정보: 회사 사이트 링크(1순위) → 회사명 기반 공개 정보(2순위)
- 직무 정보: 채용공고 링크·이미지·텍스트(1순위) → 직무명 기반 추정(2순위)

반드시 아래 5개 섹션을 순서대로 작성하세요.

## 🏢 1. 회사 개요
- 산업 및 시장: 이 기업이 속한 산업군과 시장 내 위치를 구체적으로 서술한다.
- 기업의 비전 및 방향성: 공식 미션·비전·슬로건을 바탕으로 기업이 지향하는 장기적 방향성을 설명한다.
- 현재 시장 내 위치: 국내외 경쟁사 대비 이 기업의 위상과 차별화 포인트를 서술한다.

## 🧭 2. 인재상 · 조직 문화
이 섹션은 공개된 자료에서 확인된 내용만 작성한다. 확인이 불가한 항목은 "공개된 자료에서 확인할 수 없습니다"라고 명시하고 내용을 지어내지 않는다.
- 공식 인재상 및 핵심 가치: 이 기업이 공식적으로 제시하는 인재상과 핵심 가치를 구체적으로 서술한다.

## 📈 3. 주력 사업 및 성장 방향
- 주요 제품 및 서비스: 이 기업의 핵심 사업 영역과 대표 제품·서비스를 구체적으로 서술한다.
- 핵심 고객층: 이 기업의 주된 고객 또는 파트너가 누구인지 설명한다.
- 최근 사업 전략 및 성장 방향: 최근 공시·뉴스·채용 동향을 바탕으로 기업이 현재 집중하는 전략적 방향을 서술한다.

## 🔍 4. 직무 분석
- 주요 업무: 이 직무가 실제로 수행하는 핵심 업무를 2~3문장의 설명 문체로 구체적으로 서술한다.
- 다른 직무와의 연관성: 이 직무가 조직 내 어떤 팀·직군과 협력하며, 어떤 방식으로 연결되는지 서술한다.

## 💡 5. 요구 역량
- 직무 수행에 필요한 전문 지식: 이 직무를 수행하기 위해 갖추어야 할 도구·기술·도메인 지식을 구체적으로 서술한다.

## 🔭 6. ${body.jobTitle || "지원 직무"}의 눈으로 읽은 이 회사
이 직무에서 일한다는 게 실질적으로 어떤 과제인지 2~3가지 핵심 포인트로 정리해라.
각 포인트는 아래 구조로 써라:
- 이 회사·직무의 핵심 과제 또는 기회가 무엇인가
- 그게 왜 이 직무에서 중요한가
- 자소서나 면접에서 이 포인트를 어떻게 활용할 수 있는가
긴 에세이 금지. 포인트당 불릿 3개, 각 불릿 2문장 이내.`
        : `당신은 취업 전략 컨설턴트입니다. 지원자가 자소서와 면접을 준비할 수 있도록, 직무를 심층 분석한 전문 보고서를 작성합니다. 기업 정보가 제공되지 않았으므로 직무 분석에만 집중합니다.

${COMMON_PRINCIPLES}

분석 우선순위:
- 직무 정보: 채용공고 링크·이미지·텍스트(1순위) → 직무명 기반 일반 지식(2순위)

반드시 아래 2개 섹션을 순서대로 작성하세요.

## 🔍 1. 직무 분석
- 주요 업무: 이 직무가 실제로 수행하는 핵심 업무를 2~3문장의 설명 문체로 구체적으로 서술한다.
- 다른 직무와의 연관성: 이 직무가 조직 내 어떤 팀·직군과 협력하며, 어떤 방식으로 연결되는지 서술한다.

## 💡 2. 요구 역량
- 직무 수행에 필요한 전문 지식: 이 직무를 수행하기 위해 갖추어야 할 도구·기술·도메인 지식을 구체적으로 서술한다.

## 🔭 3. ${body.jobTitle || "지원 직무"}의 눈으로 읽은 이 직무
이 직무에서 일한다는 게 실질적으로 어떤 과제인지 2~3가지 핵심 포인트로 정리해라.
각 포인트는 아래 구조로 써라:
- 이 직무의 핵심 과제 또는 기회가 무엇인가
- 그게 왜 이 직무에서 중요한가
- 자소서나 면접에서 이 포인트를 어떻게 활용할 수 있는가
긴 에세이 금지. 포인트당 불릿 3개, 각 불릿 2문장 이내.`;

      // URL 병렬 fetch
      const [companyPageText, jobPageText] = await Promise.all([
        body.companyWebsite ? fetchUrlText(body.companyWebsite) : Promise.resolve(""),
        body.jobLink ? fetchUrlText(body.jobLink) : Promise.resolve(""),
      ]);

      // 회사: 사이트 내용 1순위 → 회사명 fallback (회사 미입력 시 생략)
      const companyLines: string[] = [];
      if (hasCompany) {
        if (companyPageText) {
          companyLines.push(`회사 사이트 내용(1순위):\n${companyPageText}`);
          if (body.companyName) companyLines.push(`회사명(참고): ${body.companyName}`);
        } else {
          companyLines.push(`회사명: ${body.companyName}`);
        }
      }

      // 직무: 채용공고 내용 1순위 → 직무명 fallback
      const hasJobSource = !!(jobPageText || body.jobPostText || body.jobPostImage);
      const jobLines: string[] = [];
      if (jobPageText) jobLines.push(`채용공고 페이지 내용(1순위):\n${jobPageText}`);
      if (body.jobPostText) jobLines.push(`채용공고 텍스트(1순위):\n${body.jobPostText}`);
      jobLines.push(hasJobSource
        ? `지원 직무(참고): ${body.jobTitle || "미입력"}`
        : `지원 직무: ${body.jobTitle || "미입력"}`
      );

      const textContent = [...companyLines, ...jobLines].join("\n") + (hasCompany
        ? "\n\n위 정보를 바탕으로 기업·직무 분석 보고서를 작성해줘."
        : "\n\n위 직무 정보를 바탕으로 직무 분석 보고서를 작성해줘. 기업 정보는 제공되지 않았으므로 직무 관련 섹션만 작성해줘.");

      // 이미지가 있으면 멀티모달 메시지
      let msgContent: string | Anthropic.Messages.ContentBlockParam[];
      if (body.jobPostImage) {
        const match = (body.jobPostImage as string).match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          const mediaType = match[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp";
          msgContent = [
            { type: "image", source: { type: "base64", media_type: mediaType, data: match[2] } },
            { type: "text", text: `위 이미지는 채용공고입니다(1순위 분석 대상).\n${textContent}` },
          ];
        } else {
          msgContent = textContent;
        }
      } else {
        msgContent = textContent;
      }

      return stream(sys, [{ role: "user", content: msgContent }], 4096);
    }

    case "classify": {
      const sys = `자소서 문항을 읽고 유형을 JSON으로만 반환해라. 다른 텍스트 없이 JSON만 출력해라.

유형 판단 기준 — 문항이 회사에 "왜 지원했냐"를 묻는가, 아니면 "뭘 했냐"를 묻는가를 기준으로 나눠라.

- "motivation": 지원동기, 이 회사에 지원한 이유, 입사 후 포부·목표, 왜 이 직무인가, 당사를 선택한 이유. 회사명·직무명이 없어도 "왜"를 묻는 문항이면 motivation이다.
- "analyze": 경험·강점·도전·역량·성과를 서술하라는 문항. 구체적 사례나 경험 중심.
- "personality": 성격·장단점·가치관·어떤 사람인가 중심.
- "composite": 위 유형 2개 이상이 한 문항 안에 섞인 경우.

주의: "강점을 서술하고 이루고 싶은 목표를 써라" 같은 문항은 composite다. "목표"만 있어도 지원동기와 묶여 있으면 motivation이다.

복합이면 parts 배열에 파트별로 유형과 텍스트를 담아라.

단일 예시: {"type": "motivation"}
복합 예시: {"type": "composite", "parts": [{"type": "analyze", "text": "직무 강점 서술"}, {"type": "motivation", "text": "이루고 싶은 목표"}]}`;
      const messages: MsgParam[] = [{ role: "user", content: `문항:\n${body.question}` }];
      return generate(sys, messages);
    }

    case "final-analysis": {
      const sys =
        "당신은 면접 코치입니다. 학생이 이 회사 면접에 들고 갈 '면접 한 장'을 만듭니다. 디깅·완성본·면접 답변·기업 분석을 바탕으로 면접장에서 바로 꺼내 말할 수 있게 핵심을 추리고, 마지막엔 학생이 스스로 못 보는 '외부 전문가의 시선'을 더합니다.\n" +
        "규칙:\n" +
        "- 반드시 이 학생·이 회사의 실제 내용에서만. 일반론·뻔한 말(성실함·열정·소통능력 등) 금지.\n" +
        "- companyJob: 이 회사가 무엇을 하는 곳이고 이 직무가 무엇을 하는 자리인지 한두 문장으로. 면접관이 '우리 회사 아세요?'라고 물으면 답할 핵심. 학생이 이걸 보고 사실 확인 후 본인 말로 다시 정리할 것이므로, 외운 듯한 미사여구 말고 핵심만 담백하게.\n" +
        "- weapons: 이 직무에 맞는 학생의 핵심 무기(강점) 2~3개. 각 항목은 title·competency·detail 세 가지.\n" +
        "  · title: 강점 이름 2~12자, 명사 나열 말고 자연스럽게.\n" +
        "  · competency: 이 강점이 직무 역량으로 무엇인지 6~14자로 분류(예: 데이터 기반 의사결정 / 신뢰성 중심 사고). 한 개만.\n" +
        "  · detail: 그 강점이 드러난 근거를 한 문장으로, '무엇을 했고 → 그래서 어떻게 됐다' 흐름으로. ※'~에서 드러납니다/확인됩니다/보입니다' 같은 기계적·번역투 종결 절대 금지.\n" +
        "- interviewKeys: 학생이 연습한 면접 질문마다 '면접에서 이것만 기억하면 되는 핵심 한 줄'. q는 질문을 짧게. a는 전체 답변을 옮기지 말고 그 답의 핵심 포인트만 짧게(외우기 쉽게 한 줄). 답변이 없거나 부실하면 디깅·완성본에서 끌어와 채워라. 질문이 없으면 빈 배열.\n" +
        "- insight: 학생이 스스로 못 보는 '취업소크라테스의 외부 시선'. 세 항목 모두 제안형으로 써라(\"~로 보여요\", \"~인 것 같아요\", \"조심하면 좋아요\"). 면접관의 속마음을 단정하거나(\"면접관은 ~를 본다\") 사람을 단정(\"~한 사람입니다\")하지 마라.\n" +
        "  · edge: 밖에서 봤을 때 이 학생의 진짜 강점·남다른 한 끗. 학생이 당연하게 여기거나 과소평가했지만 신입 중엔 드문 것을, 이 경험의 어디서 그게 보이는지 구체적으로 짚어라.\n" +
        "  · caution: 이 학생의 강점·답변이 자칫 이렇게 비칠 수 있으니 조심하라는 점 하나 + 대신 이렇게 하면 좋다. 약점 지적이 아니라 '이렇게 보일 위험'과 방향이다.\n" +
        "  · direction: 그래서 이 회사 면접에서 무엇을 앞세우고 어떻게 풀면 좋을지 종합 방향 하나.\n" +
        "- 과장 금지. 담백하게. 쉼표 남발 금지. 번역투 금지 — 사람이 말하듯 능동적이고 자연스러운 한국어로.\n" +
        "반드시 JSON만 출력하세요. 다른 텍스트 없이: {\"companyJob\":\"...\",\"weapons\":[{\"title\":\"...\",\"competency\":\"...\",\"detail\":\"...\"}],\"interviewKeys\":[{\"q\":\"...\",\"a\":\"...\"}],\"insight\":{\"edge\":\"...\",\"caution\":\"...\",\"direction\":\"...\"}}";
      const messages: MsgParam[] = [
        { role: "user", content:
          `직무: ${body.jobTitle || "미입력"}\n회사: ${body.companyInfo || "미입력"}\n문항: ${body.question || "미입력"}\n\n[기업·직무 이해 분석]\n${body.analysisContent || "없음"}\n\n[완성본]\n${body.coverLetter || "없음"}\n\n[디깅 대화]\n${body.digging || "없음"}\n\n[면접 질문·답변]\n${body.interviewAnswers || "없음"}\n\n위를 바탕으로 '면접 한 장' JSON만 출력해줘.` },
      ];
      return generate(sys, messages);
    }

    default:
      return Response.json({ error: "invalid type" }, { status: 400 });
  }
}
