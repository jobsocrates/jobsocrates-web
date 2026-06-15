import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://eyluwerrsiydkhazlmqt.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bHV3ZXJyc2l5ZGtoYXpsbXF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA3NDM3NCwiZXhwIjoyMDk1NjUwMzc0fQ.abxfgkN-H1NZhJxotEy-kin-0VTNluksrIVQ6RtgpxQ";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 기존 제목 앞부분(키워드)으로 매칭해서 새 제목으로 교체
const TITLE_MAP = [
  { keyword: "메모리 슈퍼사이클",           newTitle: "삼성·SK하이닉스, 빅테크 HBM 장기계약 본격화" },
  { keyword: "HBM4 시대 개막",              newTitle: "SK하이닉스, HBM4 엔비디아 독점 공급 준비" },
  { keyword: "현대차그룹, 올해만 신차",      newTitle: "현대차·기아, 하이브리드·EV 투트랙 신차 14종" },
  { keyword: "차가 바퀴 달린",               newTitle: "현대차·기아, SDV 전환 선언 — 소프트웨어가 경쟁력" },
  { keyword: "EV 불안을 기술이",             newTitle: "삼성SDI·LG엔솔, 전고체 배터리 2027년 양산 도전" },
  { keyword: "OLED가 LCD를 밀어낸다",        newTitle: "삼성D·LGD, 게이밍 OLED 컴퓨텍스 격돌" },
  { keyword: "애플 맥북에 OLED",             newTitle: "LGD·삼성D, 애플 맥북 OLED 전환 수혜" },
  { keyword: "삼성전자 1분기 영업이익 756%", newTitle: "삼성전자, AI로 영업익 756%↑ — 반도체·TV 동시 호황" },
  { keyword: "사람들이 AI에게 물어보기",     newTitle: "네이버, AI 검색 브리핑 전면 도입" },
  { keyword: "K푸드·K뷰티, 나란히",          newTitle: "오리온 대기업 등극 · 아모레·LGH 다이소 입점" },
  { keyword: "대기업 없이 글로벌 뷰티",      newTitle: "에이피알(APR), 홈 뷰티 디바이스로 글로벌 공략" },
  { keyword: "국산 비만신약 허가",           newTitle: "한미·삼바·셀트리온, K바이오 빅3 동향" },
  { keyword: "한국에서 만든 폐암",           newTitle: "유한양행, 렉라자 미국 현지 처방 개시" },
  { keyword: "한전 상반기 공채",             newTitle: "한전 공채 개시 · KB금융 시총 63조 돌파" },
  { keyword: "고객이 24시간 즉각",           newTitle: "KB·신한·하나, AI 뱅커 출시 러시" },
];

async function main() {
  const { data: posts, error } = await supabase
    .from("posts")
    .select("id, title")
    .is("nickname", null)
    .in("category", ["반도체","자동차","디스플레이","IT","식품/화장품","제약/바이오","공기업/금융"]);

  if (error) { console.error("조회 실패:", error.message); return; }

  console.log(`총 ${posts.length}개 게시물 조회됨\n`);

  for (const { keyword, newTitle } of TITLE_MAP) {
    const post = posts.find(p => p.title.includes(keyword));
    if (!post) { console.log(`  ✗ 매칭 실패: "${keyword}"`); continue; }

    const { error: upErr } = await supabase
      .from("posts")
      .update({ title: newTitle })
      .eq("id", post.id);

    if (upErr) console.error(`  ✗ 업데이트 실패 [${post.id}]:`, upErr.message);
    else console.log(`  ✓ "${newTitle}"`);
  }

  console.log("\n완료!");
}

main().catch(console.error);
