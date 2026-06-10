import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json() as { messages: string[] };
    if (!messages?.length) {
      return NextResponse.json({ error: "messages required" }, { status: 400 });
    }

    const joined = messages
      .filter(m => m?.trim())
      .slice(0, 20)
      .map((m, i) => `[${i + 1}] ${m.trim()}`)
      .join("\n\n");

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 250,
      messages: [
        {
          role: "user",
          content: `당신은 취업소크라테스입니다. 아래는 한 구직자가 자소서 디깅 과정에서 직접 쓴 답변들이에요.

${joined}

이 사람과 대화를 나누면서 느낀 점을 3~4문장으로 써주세요.
- "당신은" 으로 시작해서 이 사람에게 직접 말하는 형식으로요.
- 강점/약점 같은 구조 없이 자연스럽게 흘러가는 문장으로요.
- 대화에서 느껴지는 가치관, 일하는 방식, 사람을 대하는 태도가 자연스럽게 드러나도록요.
- 분석적이지 않게, 진심 어린 말투로요. 마치 오랜 시간 같이 이야기한 사람에게 건네는 말처럼요.
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
