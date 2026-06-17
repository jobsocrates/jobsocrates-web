import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";
import type { DiggingContext } from "@/types";

function getClient() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
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

async function stream(system: SystemParam, messages: MsgParam[], maxTokens = 2048) {
  const enc = new TextEncoder();
  const client = getClient();
  let s: ReturnType<typeof client.messages.stream>;
  try {
    s = await client.messages.stream({
      model: "claude-sonnet-4-6",
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

async function generate(system: string, messages: MsgParam[]) {
  const client = getClient();
  const res = await client.messages.create({
    model: "claude-sonnet-4-6",
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
      const reportCtx = body.analysisReport ? `\n\n## 기업·직무 분석 보고서\n${body.analysisReport}` : "";
      const sys: Anthropic.Messages.TextBlockParam[] = [
        { type: "text", text: prompt("common") + "\n\n" + prompt("personality"), cache_control: { type: "ephemeral" } },
        { type: "text", text: `## 세션 정보\n직무: ${body.jobTitle || "미입력"}\n회사: ${body.companyInfo || "미입력"}\n글자 수 제한: ${body.charLimit ? `${body.charLimit}자 (수정본 작성 시 이 글자 수에 맞춰야 함)` : "미입력"}${reportCtx}\n\n## 자소서 초안\n${body.draft}` },
      ];
      const msgs: MsgParam[] = body.messages?.length > 0
        ? body.messages
        : [{ role: "user", content: "초안을 분석하고 첫 질문을 시작해줘." }];
      return stream(sys, msgs);
    }

    case "motivation": {
      const reportCtx = body.analysisReport ? `\n\n## 기업·직무 분석 보고서\n${body.analysisReport}` : "";
      const sys: Anthropic.Messages.TextBlockParam[] = [
        { type: "text", text: prompt("common") + "\n\n" + prompt("motivation"), cache_control: { type: "ephemeral" } },
        { type: "text", text: `## 세션 정보\n직무: ${body.jobTitle}\n회사: ${body.companyInfo || "미입력"}\n글자 수 제한: ${body.charLimit ? `${body.charLimit}자 (완성본 작성 시 이 글자 수에 맞춰야 함)` : "미입력"}${reportCtx}\n\n## 자소서 초안\n${body.draft}` },
      ];
      const msgs: MsgParam[] = body.messages?.length > 0
        ? body.messages
        : [{ role: "user", content: "초안을 분석하고 첫 질문을 시작해줘." }];
      return stream(sys, msgs);
    }

    case "analyze": {
      const reportCtx = body.analysisReport ? `\n\n## 기업·직무 분석 보고서 (직무 이해 1순위 근거)\n${body.analysisReport}` : "";
      const sys: Anthropic.Messages.TextBlockParam[] = [
        { type: "text", text: prompt("analyze_v2"), cache_control: { type: "ephemeral" } },
        { type: "text", text: `## 세션 정보\n직무: ${body.jobTitle}\n회사: ${body.companyInfo || "미입력"}\n문항: ${body.question || "미입력"}\n글자 수 제한: ${body.charLimit ? `${body.charLimit}자 (수정본 작성 시 이 글자 수에 맞춰야 함)` : "미입력"}${reportCtx}\n\n## 자소서 초안\n${body.draft}` },
      ];
      const msgs: MsgParam[] = body.messages?.length > 0
        ? body.messages
        : [{ role: "user", content: "자소서 초안을 분석하고 첫 질문을 시작해줘." }];
      return stream(sys, msgs);
    }

    case "interview-questions": {
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
        "학생 답변에 피드백을 줘라. 잘한 점과 보완할 점을 구체적으로 짚어줘. \"~요\" 체로 따뜻하게. 4~5문장 이내. 마크다운 볼드(**) 절대 금지. 쉼표(,) 남발 금지. 명사·항목 나열 외에는 쓰지 마라.";
      const messages: MsgParam[] = [{ role: "user", content: body.answer }];
      return stream(sys, messages);
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
      const sys = `당신은 취업 전략 컨설턴트입니다. 지원자가 자소서와 면접을 준비할 수 있도록, 기업과 직무를 심층 분석한 전문 보고서를 작성합니다.

작성 원칙:
- "기업을 이해하고 → 직무를 이해하고 → 무엇을 준비해야 하는가"로 자연스럽게 연결되는 스토리텔링
- 각 항목은 키워드 나열이 아닌 완성된 문장으로 서술한다. 예: "마케팅 기획 직무는 브랜드 전략을 수립하고 실행하는 역할을 담당합니다." 수준의 설명 문체를 유지한다.
- 줄임말·약어 사용 금지. 모든 용어는 풀어서 서술한다.
- 확인된 사실은 단정적으로. "추측됩니다" "판단됩니다" "보입니다" 같은 불확실 표현 사용 금지. 불확실한 내용은 아예 쓰지 마라.
- 마크다운 볼드(**) 사용 금지. 섹션 제목에만 ## 사용

분석 우선순위:
- 회사 정보: 회사 사이트 링크(1순위) → 회사명 기반 공개 정보(2순위)
- 직무 정보: 채용공고 링크·이미지·텍스트(1순위) → 직무명 기반 추정(2순위)

반드시 아래 6개 섹션을 순서대로 작성하세요.

## 🏢 1. 회사 개요
- 산업 및 시장: 이 기업이 속한 산업군과 시장 내 위치를 구체적으로 서술한다.
- 기업의 비전 및 방향성: 공식 미션·비전·슬로건을 바탕으로 기업이 지향하는 장기적 방향성을 설명한다.
- 현재 시장 내 위치: 국내외 경쟁사 대비 이 기업의 위상과 차별화 포인트를 서술한다.

## 🧭 2. 인재상 · 조직 문화
- 공식 인재상 및 핵심 가치: 이 기업이 공식적으로 제시하는 인재상과 핵심 가치를 구체적으로 서술한다.
- 조직 문화 및 일하는 방식: 이 기업의 내부 문화, 의사결정 방식, 구성원들이 일하는 특징적인 방식을 설명한다.
- 자소서 및 면접에서 중시하는 가치: 채용 과정에서 이 기업이 지원자에게 특히 주목하는 역량이나 태도를 서술한다.

## 📈 3. 주력 사업 및 성장 방향
- 주요 제품 및 서비스: 이 기업의 핵심 사업 영역과 대표 제품·서비스를 구체적으로 서술한다.
- 핵심 고객층: 이 기업의 주된 고객 또는 파트너가 누구인지 설명한다.
- 최근 사업 전략 및 성장 방향: 최근 공시·뉴스·채용 동향을 바탕으로 기업이 현재 집중하는 전략적 방향을 서술한다.

## 🔍 4. 직무 분석
- 직무의 정의: 이 직무가 조직 내에서 담당하는 역할을 한두 문장으로 명확하게 정의한다.
- 다른 직무와의 연관성: 이 직무가 조직 내 어떤 팀·직군과 협력하며, 어떤 방식으로 연결되는지 서술한다.

## ⚡ 5. 핵심 역할
- 주요 업무: 이 직무가 실제로 수행하는 핵심 업무를 2~3문장의 설명 문체로 구체적으로 서술한다.
- 존재 이유: 조직이 이 직무를 필요로 하는 이유와, 이 직무가 사업 성과에 어떻게 기여하는지를 서술한다.

## 💡 6. 요구 역량
- 직무 수행에 필요한 전문 지식: 이 직무를 수행하기 위해 갖추어야 할 도구·기술·도메인 지식을 구체적으로 서술한다.
- 협업 및 커뮤니케이션 역량: 이 직무에서 요구되는 대인 관계·협업 방식·커뮤니케이션 특성을 설명한다.`;

      // URL 병렬 fetch
      const [companyPageText, jobPageText] = await Promise.all([
        body.companyWebsite ? fetchUrlText(body.companyWebsite) : Promise.resolve(""),
        body.jobLink ? fetchUrlText(body.jobLink) : Promise.resolve(""),
      ]);

      // 회사: 사이트 내용 1순위 → 회사명 fallback
      const companyLines: string[] = [];
      if (companyPageText) {
        companyLines.push(`회사 사이트 내용(1순위):\n${companyPageText}`);
        if (body.companyName) companyLines.push(`회사명(참고): ${body.companyName}`);
      } else {
        companyLines.push(`회사명: ${body.companyName || "미입력"}`);
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

      const textContent = [...companyLines, ...jobLines].join("\n") + "\n\n위 정보를 바탕으로 분석 보고서를 작성해줘.";

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

    default:
      return Response.json({ error: "invalid type" }, { status: 400 });
  }
}
