import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Vercel cron 인증 확인
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // is_published: false 인 뉴스 draft 전부 발행
  const { data: drafts, error: fetchErr } = await supabase
    .from("posts")
    .select("id, title, category")
    .eq("is_published", false)
    .is("nickname", null);

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!drafts || drafts.length === 0) {
    return NextResponse.json({ message: "발행할 draft 없음", published: [] });
  }

  const ids = drafts.map((d) => d.id);
  const { error: updateErr } = await supabase
    .from("posts")
    .update({ is_published: true })
    .in("id", ids);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  const published = drafts.map((d) => `[${d.category}] ${d.title}`);
  console.log("✓ 자동 발행 완료:", published);

  return NextResponse.json({ message: "발행 완료", published });
}
