import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
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

async function stream(system: SystemParam, messages: MsgParam[]) {
  const enc = new TextEncoder();
  const client = getClient();
  let s: ReturnType<typeof client.messages.stream>;
  try {
    s = await client.messages.stream({
      model: "claude-sonnet-4-6",
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

    case "analyze": {
      const sys: Anthropic.Messages.TextBlockParam[] = [
        { type: "text", text: prompt("analyze_v2"), cache_control: { type: "ephemeral" } },
        { type: "text", text: `## 세션 정보\n직무: ${body.jobTitle}\n문항: ${body.question || "미입력"}\n글자 수 제한: ${body.charLimit ? `${body.charLimit}자 (수정본 작성 시 이 글자 수에 맞춰야 함)` : "미입력"}\n\n## 자소서 초안\n${body.draft}` },
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

    case "update-polish": {
      const { createClient } = await import("@supabase/supabase-js");
      const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { error } = await adminClient
        .from("revisions")
        .update({ polished_content: body.polished_content })
        .eq("id", body.revision_id);
      if (error) {
        console.error("[DB] polished_content update error:", error);
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

    case "polish": {
      const draft = body.draft as string;
      const revision = body.revision as string;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const enc = new TextEncoder();
      const charLimit = body.charLimit ? Number(body.charLimit) : null;
      const polishPrompt = `아래 자소서 완성본을 가독성 좋고 자연스럽게 다듬어라.

쉼표(,) 규칙 — 가장 중요:
- 명사·항목을 나열할 때만 허용한다. (예: "기획, 실행, 검토")
- 절 연결(~하면서, ~하고, ~하여 등), 시간 표현, 조건 표현에는 절대 쓰지 마라.
- 쉼표 없이도 읽히면 반드시 제거해라.
- 기존 문장에 쉼표가 있으면 위 기준에 맞지 않는 것은 전부 제거해라.

추가 규칙:
- "단순히 ~에 그치지 않고" 표현 사용 금지, 다른 표현으로 대체해라.
- 문장 흐름과 가독성을 해치지 않는 선에서만 수정해라. 내용은 바꾸지 마라.
${charLimit ? `\n글자 수 기준 ${charLimit}자:\n- 미달이라면 자연스럽고 가독성이 가장 좋은 형태로 다듬어라.\n- 초과라면 ${charLimit}자 미만으로 가독성 좋게 자연스럽게 다듬어라.` : ""}

${revision}`;
      const openaiStream = openai.chat.completions.stream({
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: polishPrompt }],
      });
      return new Response(
        new ReadableStream({
          async start(ctrl) {
            try {
              for await (const chunk of openaiStream) {
                const text = chunk.choices[0]?.delta?.content ?? "";
                if (text) ctrl.enqueue(enc.encode(text));
              }
            } catch (e) {
              const msg = e instanceof Error ? e.message : "GPT 오류";
              try { ctrl.enqueue(enc.encode(`\n오류: ${msg}`)); } catch { /* 무시 */ }
            } finally {
              try { ctrl.close(); } catch { /* 무시 */ }
            }
          },
        }),
        { headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

    default:
      return Response.json({ error: "invalid type" }, { status: 400 });
  }
}
