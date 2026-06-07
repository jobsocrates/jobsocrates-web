import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";
import type { DiggingContext } from "@/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function prompt(name: string) {
  return readFileSync(join(process.cwd(), "src", "prompts", `${name}.txt`), "utf-8");
}

function buildCtx(ctx: DiggingContext): string {
  return (
    `\n\n## 세션 정보\n` +
    `직무: ${ctx.jobTitle}\n` +
    `문항: ${ctx.question}\n` +
    `JD 키워드: ${ctx.jdKeywords.join(", ") || "없음"}\n` +
    `경험:\n${ctx.experiences.map((e, i) => `  ${i + 1}. [${e.type}] ${e.text}`).join("\n")}`
  );
}

type MsgParam = Anthropic.MessageParam;

async function stream(system: string, messages: MsgParam[]) {
  const enc = new TextEncoder();
  let s: ReturnType<typeof client.messages.stream>;
  try {
    s = await client.messages.stream({
      model: "claude-sonnet-4-5",
      max_tokens: 1500,
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
  const res = await client.messages.create({
    model: "claude-sonnet-4-5",
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

export async function GET() {
  return Response.json({ hasKey: !!process.env.ANTHROPIC_API_KEY, keyPrefix: process.env.ANTHROPIC_API_KEY?.slice(0, 10) ?? "MISSING" });
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

    case "jd-extract": {
      const messages: MsgParam[] = [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: body.mediaType, data: body.imageData },
            },
            {
              type: "text",
              text: 'JD 이미지에서 핵심 요구 역량/키워드 5개를 추출해줘. 반드시 JSON 배열만 출력: ["키워드1","키워드2","키워드3","키워드4","키워드5"]',
            },
          ],
        },
      ];
      return generate("JD 분석 전문가. JSON 배열만 반환.", messages);
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

    case "analyze": {
      const sys = prompt("analyze") +
        `\n\n## 세션 정보\n직무: ${body.jobTitle}\n문항: ${body.question || "미입력"}\nJD 키워드: ${(body.jdKeywords ?? []).join(", ") || "없음"}\n글자 수 제한: ${body.charLimit ? `${body.charLimit}자 (수정본 작성 시 이 글자 수에 맞춰야 함)` : "미입력"}\n\n## 자소서 초안\n${body.draft}`;
      const msgs: MsgParam[] = body.messages?.length > 0
        ? body.messages
        : [{ role: "user", content: "자소서 초안을 분석하고 첫 질문을 시작해줘." }];
      return stream(sys, msgs);
    }

    case "interview-questions": {
      const sys =
        "당신은 면접 전문가입니다. 자소서를 분석하여 면접관이 실제로 물어볼 법한 예상 질문 4개를 생성하세요. " +
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
        "학생 답변에 피드백을 줘라. 잘한 점과 보완할 점을 구체적으로 짚어줘. \"~요\" 체로 따뜻하게. 4~5문장 이내. 마크다운 볼드(**) 절대 금지.";
      const messages: MsgParam[] = [{ role: "user", content: body.answer }];
      return stream(sys, messages);
    }

    default:
      return Response.json({ error: "invalid type" }, { status: 400 });
  }
}
