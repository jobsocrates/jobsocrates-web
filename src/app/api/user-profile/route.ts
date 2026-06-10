import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages, interviewAnswers } = await req.json() as { messages: string[]; interviewAnswers?: string[] };
    if (!messages?.length) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    const diggingSection = messages
      .filter(m => m?.trim())
      .slice(0, 20)
      .map((m, i) => `[${i + 1}] ${m.trim()}`)
      .join("\n\n");

    const interviewSection = (interviewAnswers || []).filter(a => a?.trim()).length > 0
      ? `\n\n[면접 연습 답변]\n` + (interviewAnswers || [])
          .filter(a => a?.trim())
          .slice(0, 12)
          .map((a, i) => `[${i + 1}] ${a.trim()}`)
          .join("\n\n")
      : "";

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 420,
      temperature: 1,
      messages: [
        {
          role: "user",
          content: `당신은 취업소크라테스입니다. 아래는 한 구직자가 자소서 디깅과 면접 연습 과정에서 직접 쓴 내용들이에요.

[자소서 디깅 답변]
${diggingSection}${interviewSection}

이 사람에 대해 시인처럼 따뜻하게 써주세요.
- 약점이나 아쉬운 점은 절대 언급하지 마세요. 오직 이 사람의 빛나는 면만요.
- "당신은" 으로 시작해서 3~4문장으로요.
- 경험을 직접 분석하거나 나열하지 말고, 이 사람에게서 느껴지는 결과 온기를 시처럼 담아주세요.
- 마지막에, 이 사람의 분위기와 자연스럽게 어울리는 짧은 명언이나 시구를 한 줄 덧붙여주세요. 억지스럽지 않게, 흐름이 이어지도록요. (예: 릴케, 헤르만 헤세, 알베르 카뮈, 버지니아 울프, 파울로 코엘료 등 문학적인 인물 우선)
- 한국어로만, 마크다운 없이요.`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text.trim() : "";
    return NextResponse.json({ analysis: text });
  } catch (e) {
    console.error("[user-profile]", e);
    return NextResponse.json({ error: "analysis failed" }, { status: 500 });
  }
}
