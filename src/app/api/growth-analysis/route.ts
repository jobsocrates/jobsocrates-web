import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { firstDraft, firstQuestion, latestDraft, latestQuestion } = await req.json();
    if (!firstDraft?.trim() || !latestDraft?.trim()) {
      return NextResponse.json({ error: "drafts required" }, { status: 400 });
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 220,
      messages: [
        {
          role: "user",
          content: `다음은 같은 사람이 시간 차를 두고 쓴 자소서 초안 두 편입니다.

【처음 쓴 초안】
문항: ${firstQuestion}
${firstDraft.slice(0, 600)}

【가장 최근 초안】
문항: ${latestQuestion}
${latestDraft.slice(0, 600)}

이 두 글을 비교해서 글쓰기가 어떻게 성장했는지 2~3문장으로 분석해주세요.
- 상황/행동/결과의 구체성, 자신만의 이야기, 설득력 변화에 집중하세요.
- "처음엔 ~하셨는데, 이제는 ~하고 있어요" 형식으로, 따뜻하고 응원하는 톤으로 써주세요.
- 한국어로만 써주세요. 마크다운 없이 자연스러운 문장으로만요.`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text.trim() : "";
    return NextResponse.json({ analysis: text });
  } catch (e) {
    console.error("[growth-analysis]", e);
    return NextResponse.json({ error: "analysis failed" }, { status: 500 });
  }
}
