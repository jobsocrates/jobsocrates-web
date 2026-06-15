import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://eyluwerrsiydkhazlmqt.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bHV3ZXJyc2l5ZGtoYXpsbXF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA3NDM3NCwiZXhwIjoyMDk1NjUwMzc0fQ.abxfgkN-H1NZhJxotEy-kin-0VTNluksrIVQ6RtgpxQ";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 반도체 + 자동차 draft 중 가장 최근 1개씩 발행
async function publishLatestDraft(category) {
  const { data, error } = await supabase
    .from("posts")
    .select("id, title")
    .eq("category", category)
    .eq("is_published", false)
    .is("nickname", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    console.log(`[${category}] 발행할 draft 없음`);
    return;
  }

  const { error: upErr } = await supabase
    .from("posts")
    .update({ is_published: true })
    .eq("id", data.id);

  if (upErr) console.error(`[${category}] 발행 실패:`, upErr.message);
  else console.log(`✓ [${category}] 발행 완료: "${data.title}"`);
}

async function main() {
  console.log("=== 아침 9시 자동 발행 ===");
  await publishLatestDraft("반도체");
  await publishLatestDraft("자동차");
  console.log("완료!");
}

main().catch(console.error);
