import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://eyluwerrsiydkhazlmqt.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bHV3ZXJyc2l5ZGtoYXpsbXF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA3NDM3NCwiZXhwIjoyMDk1NjUwMzc0fQ.abxfgkN-H1NZhJxotEy-kin-0VTNluksrIVQ6RtgpxQ";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 분리할 복합 포스트 정보 (제목 키워드 → 분리된 두 포스트 제목)
const SPLITS = [
  {
    keyword: "오리온 대기업 등극",
    category: "식품/화장품",
    titles: [
      "오리온, 창사 70년 만에 대기업집단 등극",
      "아모레·LGH, 다이소에 세컨드 브랜드 입점",
    ],
  },
  {
    keyword: "한미·삼바·셀트리온",
    category: "제약/바이오",
    titles: [
      "한미약품, 국산 비만신약 식약처 허가 신청",
      "삼성바이오·셀트리온, K바이오 역대 실적 경신",
    ],
  },
  {
    keyword: "한전 공채 개시",
    category: "공기업/금융",
    titles: [
      "한국전력, AI 전력 수요 급증 속 상반기 공채",
      "KB·신한·하나, 밸류업으로 시총 2배 뛰었다",
    ],
  },
];

async function main() {
  for (const split of SPLITS) {
    console.log(`\n▶ [${split.category}] "${split.keyword}" 분리 중...`);

    // 복합 포스트 조회
    const { data: posts } = await supabase
      .from("posts")
      .select("id, title, content")
      .is("nickname", null)
      .eq("category", split.category)
      .ilike("title", `%${split.keyword}%`);

    if (!posts?.length) { console.log("  ✗ 포스트를 찾을 수 없어요"); continue; }
    const post = posts[0];

    // --- 기준으로 두 블록으로 분리
    const blocks = post.content.split(/\n\s*---\s*\n/).map(b => b.trim()).filter(Boolean);
    if (blocks.length < 2) { console.log("  ✗ 두 블록이 없어요"); continue; }

    // 기존 포스트 삭제
    await supabase.from("posts").delete().eq("id", post.id);
    console.log(`  ✓ 기존 포스트 삭제: "${post.title}"`);

    // 두 포스트 개별 등록
    for (let i = 0; i < 2; i++) {
      const { data, error } = await supabase
        .from("posts")
        .insert({
          title: split.titles[i],
          content: blocks[i],
          category: split.category,
          is_published: true,
          is_pinned: false,
        })
        .select("id, title")
        .single();

      if (error) console.error(`  ✗ 등록 실패:`, error.message);
      else console.log(`  ✓ 등록: "${data.title}"`);
    }
  }

  console.log("\n완료!");
}

main().catch(console.error);
