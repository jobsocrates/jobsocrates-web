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

이 사람에 대해 직관적으로 느낀 것을 3~4문장으로 써주세요.
- 경험이나 행동을 직접 짚거나 분석하지 마세요. 그 사람에게서 느껴지는 에너지, 본질, 감각을 담아주세요.
- 잘하는 것만 말하지 말고, 이 사람이 어디서 조금 힘들어할 것 같은지도 자연스럽게 담아주세요.
- "당신은" 으로 시작해서, 오래 알아온 사람에게 솔직하게 건네는 말처럼요.
- 분석이 아니라 감각으로 느낀 것처럼, 부드럽고 솔직하게요.
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
