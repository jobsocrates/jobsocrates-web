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
  const s = await client.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: 1500,
    system,
    messages,
  });
  const enc = new TextEncoder();
  return new Response(
    new ReadableStream({
      async start(ctrl) {
        try {
          for await (const chunk of s) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              ctrl.enqueue(enc.encode(chunk.delta.text));
            }
          }
        } finally {
          ctrl.close();
        }
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

export async function POST(req: Request) {
  const body = await req.json();

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

    default:
      return Response.json({ error: "invalid type" }, { status: 400 });
  }
}
