import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://eyluwerrsiydkhazlmqt.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bHV3ZXJyc2l5ZGtoYXpsbXF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA3NDM3NCwiZXhwIjoyMDk1NjUwMzc0fQ.abxfgkN-H1NZhJxotEy-kin-0VTNluksrIVQ6RtgpxQ";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const NEW_CAR_ARTICLES = [
  {
    title: "차가 바퀴 달린 스마트폰이 되고 있어요 [현대차·기아 SDV 전환, 소프트웨어가 핵심 경쟁력]",
    content: `📰 [현대차·기아] 소비자가 테슬라를 경험하고 나서 기존 자동차에 대한 기대가 달라졌어요
🔗 원문: https://www.hankookilbo.com/News/Read/A2026050600180001138

무슨 일이냐면:
테슬라가 보여준 게 하나 있어요. 차를 구매한 다음에도 무선 업데이트(OTA)로 새 기능이 추가되거나 성능이 개선된다는 거예요. 소비자들이 이 경험을 하고 나니 기존 자동차에도 같은 걸 기대하기 시작했어요. 이 변화가 완성차 업계 전체를 흔들고 있어요. 현대차·기아는 2025년부터 SDV(Software Defined Vehicle — 소프트웨어가 차량의 기능과 성능을 정의하는 개념) 전환을 공식 선언하고 차량 전체를 통합 제어하는 소프트웨어 플랫폼 개발에 수조 원을 투자하고 있어요. 엔진·변속기 중심이던 차가 이제 소프트웨어 중심으로 설계되는 거예요.

🔍 이걸 왜 봐야 하냐면:
SDV 전환은 자동차 회사의 내부 구조를 바꿔요. 과거에는 부품을 외부 공급사에서 사다 조립하면 됐지만 이제는 소프트웨어를 직접 개발하고 업데이트하는 역량이 없으면 경쟁이 안 돼요. 하드웨어(엔진·섀시)와 소프트웨어(자율주행·커넥티드·OTA)를 함께 다뤄야 하는 시대가 됐거든요. 이 전환 과정에서 자동차 회사가 어떤 기술 역량을 내재화하려 하는지 어떤 외부 협력사와 손잡는지를 이해하는 게 이 업계를 제대로 보는 시작이에요.

💬 스스로 물어봐:
- 테슬라와 현대차·기아가 SDV 전환에서 출발점이 어떻게 다른지 설명할 수 있어요? 테슬라는 처음부터 소프트웨어 회사로 시작했고 현대차는 하드웨어에서 전환하는 중이거든요.
- 자동차에 소프트웨어가 중요해질수록 반도체·통신·AI 회사들이 왜 자동차 업계로 들어오려 하는지 생각해봤어요?`,
  },
  {
    title: "EV 불안을 기술이 풀 수 있을까요 [전고체 배터리, 2027년 양산을 향한 경쟁]",
    content: `📰 [삼성SDI·LG에너지솔루션·현대차] 소비자가 전기차를 망설이는 이유가 배터리에 있어요
🔗 원문: https://www.etnews.com/20260428000148

무슨 일이냐면:
전기차에 관심은 있지만 사지 않는 소비자들한테 이유를 물어보면 세 가지가 나와요. 화재가 무서워요. 겨울에 주행거리가 확 줄어요. 충전이 오래 걸려요. 이 세 가지 모두 지금의 리튬이온 배터리(액체 전해질을 쓰는 방식)의 한계에서 오는 거예요. 전고체 배터리(고체 전해질을 쓰는 방식)는 이 문제를 한꺼번에 해결할 수 있는 기술이에요. 전해질이 고체라 불이 붙지 않고 에너지 밀도가 높아 같은 크기에 더 많은 전기를 담을 수 있어요. 삼성SDI는 2027년 전고체 배터리 양산을 목표로 하고 있고 LG에너지솔루션과 현대차도 각자의 로드맵을 가동 중이에요.

🔍 이걸 왜 봐야 하냐면:
전고체 배터리는 기술 뉴스처럼 보이지만 핵심은 소비자 불안이에요. 고객이 안전과 주행거리에 불안을 갖고 있기 때문에 기업이 기술 개발 방향을 거기에 맞추는 거예요. 이 기술이 양산 가능한 수준으로 올라오면 전기차 시장의 판이 다시 바뀌어요. 배터리는 전기차에서 원가의 40% 이상을 차지하고 자동차의 성능·안전·가격을 동시에 결정하기 때문에 배터리 기술 변화가 자동차 업계 전체에 영향을 줘요.

💬 스스로 물어봐:
- 전고체 배터리가 기술적으로는 우수한데 왜 아직 양산이 안 되는지 어떤 기술적·경제적 장벽이 있는지 생각해봤어요?
- 배터리 회사(삼성SDI, LG에너지솔루션)와 완성차 회사(현대차, 기아)가 전고체 배터리 개발에서 각각 어떤 역할을 하고 이해관계가 어떻게 다른지 생각해봤어요?`,
  },
];

async function main() {
  // 기존 자동차 기사 삭제
  console.log("1. 기존 자동차 기사 삭제 중...");
  const { error: delError } = await supabase
    .from("posts")
    .delete()
    .eq("category", "자동차")
    .is("nickname", null);
  if (delError) console.error("   오류:", delError.message);
  else console.log("   ✓ 완료");

  // 새 기사 등록
  console.log("2. 새 자동차 기사 등록 중...");
  for (const article of NEW_CAR_ARTICLES) {
    const { data, error } = await supabase
      .from("posts")
      .insert({
        title: article.title,
        content: article.content,
        category: "자동차",
        is_published: true,
        is_pinned: false,
      })
      .select("id, title")
      .single();

    if (error) console.error(`   ✗ 실패:`, error.message);
    else console.log(`   ✓ ${data.title.slice(0, 50)}...`);
  }
  console.log("\n완료!");
}

main().catch(console.error);
