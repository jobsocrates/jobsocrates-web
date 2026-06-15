import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://eyluwerrsiydkhazlmqt.supabase.co";
const SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV5bHV3ZXJyc2l5ZGtoYXpsbXF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDA3NDM3NCwiZXhwIjoyMDk1NjUwMzc0fQ.abxfgkN-H1NZhJxotEy-kin-0VTNluksrIVQ6RtgpxQ";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DRAFTS = [
  {
    category: "반도체",
    title: "엔비디아가 1등이 된 이유, 그리고 SK하이닉스가 웃는 이유",
    content: `📰 [엔비디아·SK하이닉스] AI 칩 시장의 1위가 만들어진 배경과 한국 반도체의 연결 고리
🔗 원문: https://bien.ltd/blogs/hbm-market-sk-hynix-samsung-2026-hegemony-war/

무슨 일이냐면:
엔비디아라는 회사를 알고 있어요? 원래는 게임용 그래픽 카드를 만드는 회사였어요. 게임 화면은 엄청나게 많은 픽셀을 동시에 계산해야 하기 때문에 수천 개의 연산을 병렬로 처리하는 GPU(그래픽처리장치)를 만들었어요.

그런데 AI 연구자들이 이걸 발견했어요. AI 모델을 학습시키는 것도 결국 엄청난 양의 숫자 계산을 동시에 처리하는 거거든요. GPU가 딱 맞는 도구였어요. 엔비디아는 AI 붐이 오기 전부터 이미 최고의 병렬 연산 칩을 갖고 있었어요. 그 결과 챗GPT가 터지면서 엔비디아는 세계 시가총액 상위권 기업이 됐어요.

여기서 한국이 등장해요. 엔비디아 GPU는 연산은 빠른데 약점이 하나 있어요. 데이터를 빠르게 가져다 줄 메모리가 없으면 GPU가 기다려야 한다는 거예요. 이 병목을 해결하기 위해 GPU 칩 바로 옆에 붙이는 초고속 메모리가 HBM이에요. 지금 이 HBM을 세계에서 가장 잘 만드는 곳이 SK하이닉스예요. 엔비디아 GPU 하나마다 SK하이닉스 HBM이 붙어서 나가요. 엔비디아가 팔릴수록 SK하이닉스 실적도 같이 올라가는 구조예요.

2026년 들어 이 구조에 변화가 생겼어요. AMD(엔비디아의 경쟁사)가 AI 칩 시장에서 빠르게 성장하면서 삼성전자가 AMD에 HBM을 공급하기 시작했어요. 'AI 칩 = 엔비디아 = SK하이닉스'라는 단일 공식이 흔들리기 시작한 거예요.

🔍 이걸 왜 봐야 하냐면:
반도체 업계를 볼 때 "어떤 회사가 어떤 칩을 만드냐"보다 "누가 누구에게 팔고 있냐"가 더 중요해요. 고객 구조가 바뀌면 공급사의 전략도 바뀌어요. SK하이닉스가 엔비디아 하나에만 의존하는 구조에서 삼성이 AMD 채널을 열면서 경쟁이 시작된 것처럼 B2B 산업에서는 고객 구조가 곧 시장 판도예요.

💬 스스로 물어봐:
- 엔비디아가 AI 시대에 갑자기 1등이 된 이유를 자기 언어로 설명할 수 있어요?
- SK하이닉스와 엔비디아의 관계를 보면서 B2B 거래에서 핵심 고객사에 의존하는 것의 장단점을 생각해봤어요?`,
  },
  {
    category: "자동차",
    title: "BYD가 한국에 들어왔어요 — 중국 전기차가 위협적인 진짜 이유",
    content: `📰 [BYD·현대차·기아] 10년 전엔 상상도 못 했던 일이 지금 일어나고 있어요
🔗 원문: https://web.getcha.kr/blog/2026-automobile-market-outlook-ev-hybrid-release-schedule/

무슨 일이냐면:
10년 전 중국 자동차 하면 어떤 이미지가 떠올라요? 싸지만 품질이 불안하고 브랜드 가치도 없는 차. 한국이나 일본 브랜드와 비교 대상도 안 된다는 인식이 지배적이었어요. 그런데 지금은 달라요.

BYD라는 중국 회사가 있어요. 원래 배터리 회사였는데 전기차를 직접 만들기 시작했어요. 배터리를 직접 만드는 회사가 전기차를 만들었으니 원가 경쟁력이 남달라요. 지금 BYD는 세계 전기차 판매 1위예요. 테슬라도 뛰어넘었어요.

이 회사가 한국 시장에 본격적으로 들어오고 있어요. 가격이 핵심이에요. 비슷한 크기의 전기차를 현대·기아보다 30~40% 저렴하게 팔아요. 성능도 뒤지지 않아요. 특히 배터리 기술은 자체 생산이라 가격을 낮추면서도 성능을 유지해요.

소비자 입장에서 생각해봐요. 같은 크기 전기차인데 현대 4000만 원, BYD 2800만 원이에요. 어디서 살 것 같아요? 한국 소비자들도 합리적 선택을 하기 시작했고 BYD 점유율이 빠르게 오르고 있어요.

현대차·기아 입장에서는 해외 시장에서만 경쟁하던 구도에서 이제 내수 시장에서도 중국과 붙어야 하는 상황이 됐어요. 어떻게 대응할까요?

🔍 이걸 왜 봐야 하냐면:
자동차 산업은 지금 두 번의 전환이 동시에 일어나고 있어요. 내연기관→전기차 전환이 한 축이고 한국·일본·유럽 브랜드 중심에서 중국 브랜드까지 포함된 경쟁 구도로의 전환이 또 다른 축이에요. 가격 경쟁력이 강한 중국 브랜드가 전기차라는 새 판 위에서 글로벌 시장을 빠르게 공략하는 구조를 이해하면 자동차 업계 전체 지형이 보여요.

💬 스스로 물어봐:
- 중국 전기차가 한국 시장에서 경쟁력을 갖게 된 이유를 가격·기술·공급망 관점에서 설명할 수 있어요?
- 현대차·기아가 BYD에 대응하기 위해 가격을 낮추는 것 말고 어떤 전략을 쓸 수 있을지 생각해봤어요?`,
  },
];

async function main() {
  console.log("Draft 기사 저장 중 (is_published: false)...");
  for (const draft of DRAFTS) {
    const { data, error } = await supabase
      .from("posts")
      .insert({
        title: draft.title,
        content: draft.content,
        category: draft.category,
        is_published: false,
        is_pinned: false,
      })
      .select("id, title")
      .single();

    if (error) console.error(`✗ [${draft.category}] 실패:`, error.message);
    else console.log(`✓ [${draft.category}] draft 저장 완료 | id: ${data.id}`);
  }
  console.log("\nDraft 저장 완료. publish-batch1.mjs 실행 시 발행됩니다.");
}

main().catch(console.error);
