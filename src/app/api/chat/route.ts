import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { join } from "path";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function loadSystemPrompt(): string {
  const promptPath = join(process.cwd(), "src", "prompts", "cover-letter.txt");
  return readFileSync(promptPath, "utf-8");
}

export async function POST(req: Request) {
  const { messages, context } = await req.json();

  const systemPrompt =
    loadSystemPrompt() +
    `\n\n## 현재 세션 정보\n` +
    `- 지원 직무: ${context.jobTitle || "미입력"}\n` +
    `- 자소서 문항: ${context.question || "미입력"}\n` +
    `- JD: ${context.jd ? context.jd : "없음"}\n` +
    `- 입력된 경험:\n${
      context.experiences?.length
        ? context.experiences.map((e: { type: string; text: string }, i: number) => `  ${i + 1}. [${e.type}] ${e.text}`).join("\n")
        : "  없음"
    }`;

  const stream = await client.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
