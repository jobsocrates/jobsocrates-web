import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// 요일별 발행 카테고리 (UTC 기준, 0=일 ~ 6=토)
// 한국 9시 = UTC 0시
const SCHEDULE: Record<number, string[]> = {
  2: ["반도체", "자동차"],   // 화
  3: ["디스플레이", "IT"],   // 수
  4: ["식품/화장품"],         // 목
  5: ["제약/바이오"],         // 금
  6: ["공기업/금융"],         // 토
};

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const dayOfWeek = new Date().getUTCDay();
  const categories = SCHEDULE[dayOfWeek];

  if (!categories) {
    return NextResponse.json({ message: "오늘은 발행 없음", day: dayOfWeek });
  }

  const published: string[] = [];

  for (const category of categories) {
    // 해당 카테고리에서 가장 오래된 draft 1개 발행
    const { data, error: fetchErr } = await supabase
      .from("posts")
      .select("id, title")
      .eq("category", category)
      .eq("is_published", false)
      .is("nickname", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (fetchErr || !data) {
      console.log(`[${category}] draft 없음`);
      continue;
    }

    const { error: updateErr } = await supabase
      .from("posts")
      .update({ is_published: true })
      .eq("id", data.id);

    if (updateErr) {
      console.error(`[${category}] 발행 실패:`, updateErr.message);
    } else {
      published.push(`[${category}] ${data.title}`);
      console.log(`✓ 발행: [${category}] ${data.title}`);
    }
  }

  return NextResponse.json({ message: "완료", published });
}
