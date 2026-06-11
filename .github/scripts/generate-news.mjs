/**
 * 뉴스 자동 수집 + AI 정리 스크립트
 * 실행: node .github/scripts/generate-news.mjs
 * 환경변수 필요: ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// .env.local 자동 로드 (로컬 실행 시)
const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../../.env.local");
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const m = line.match(/^([^#][^=]*)=(.+)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

// ── 카테고리 순환 (경제 → 기술 → 사회 → 글로벌 → 경제 → ...) ──
// DB에 저장되는 카테고리는 admin 게시판 탭 이름과 일치해야 함
const START_DATE = new Date("2026-06-12T00:00:00+09:00");
const CATEGORIES = ["경제", "기술", "사회", "글로벌"];

// ── 자소서 팁 직무 순환 (20개, 날짜 기반) ──
const JASOSEO_ROLES = [
  // 경영/전략
  "경영기획",
  "사업개발",
  // 영업/마케팅
  "B2B 영업",
  "해외영업",
  "영업지원",
  "콘텐츠 마케터",
  "브랜드 마케터",
  "CRM 마케터",
  "퍼포먼스 마케터",
  // 개발/IT
  "백엔드 개발자",
  "프론트엔드 개발자",
  "데이터 분석가",
  "PM (프로덕트 매니저)",
  // 제조/생산
  "생산기술 엔지니어",
  "생산관리 (제조/화학)",
  "품질관리 (제조/화학)",
  "설계 엔지니어",
  "공정 엔지니어",
  // 연구개발
  "연구개발 (R&D)",
  "기구/기계 설계",
  // 경영지원
  "HR (인사/채용)",
  "회계/재무",
  "구매/SCM",
  "물류/무역",
];
const CATEGORY_PAIRS = [["경제", "기술"], ["사회", "글로벌"]];

// 각 카테고리별 RSS 후보 (앞에서부터 시도)
const RSS = {
  경제: [
    "https://www.yna.co.kr/rss/economy.xml",
    "https://rss.etnews.com/Section902.xml",
    "https://rss.donga.com/economy.xml",
  ],
  기술: [
    "https://rss.etnews.com/Section901.xml",
    "https://www.yna.co.kr/rss/it.xml",
    "https://www.yna.co.kr/rss/science.xml",
    "https://rss.donga.com/it.xml",
    "https://www.yna.co.kr/rss/all.xml",
  ],
  사회: [
    "https://www.yna.co.kr/rss/all.xml",
    "https://rss.donga.com/total.xml",
    "https://www.chosun.com/arc/outboundfeeds/rss/?outputType=xml",
  ],
  글로벌: [
    "https://www.yna.co.kr/rss/international.xml",
    "https://www.yna.co.kr/rss/world.xml",
    "https://rss.donga.com/international.xml",
    "https://www.yna.co.kr/rss/all.xml",
  ],
};

function todayCategory() {
  const now = new Date();
  const kst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const start = new Date(START_DATE.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const diff = Math.floor((kst - start) / 86400000);
  return CATEGORIES[((diff % CATEGORIES.length) + CATEGORIES.length) % CATEGORIES.length];
}

function todayRole() {
  const now = new Date();
  const kst = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const start = new Date(START_DATE.toLocaleString("en-US", { timeZone: "Asia/Seoul" }));
  const diff = Math.floor((kst - start) / 86400000);
  return JASOSEO_ROLES[((diff % JASOSEO_ROLES.length) + JASOSEO_ROLES.length) % JASOSEO_ROLES.length];
}

function todayStr() {
  return new Date().toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replace(/\.\s*/g, "-").replace(/-$/, "");
}

function cdata(s) {
  return s?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1") ?? "";
}

function stripHtml(s) {
  return s.replace(/<[^>]+>/g, "").replace(/&[a-z]+;/g, " ").replace(/\s+/g, " ").trim();
}

// ── RSS 파싱 ──
async function fetchArticles(category) {
  const urls = RSS[category];
  let xml = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; jobsocrates/1.0)" },
      });
      if (res.ok) { xml = await res.text(); break; }
    } catch {}
  }
  if (!xml) throw new Error(`모든 RSS 소스 실패: ${urls.join(", ")}`);
  const articles = [];
  const itemRe = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = itemRe.exec(xml)) !== null && articles.length < 10) {
    const raw = m[1];
    const title = stripHtml(cdata(raw.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "")).trim();
    const desc  = stripHtml(cdata(raw.match(/<description>([\s\S]*?)<\/description>/)?.[1] ?? "")).slice(0, 400).trim();
    const link  = (raw.match(/<link>([\s\S]*?)<\/link>/)?.[1] ?? raw.match(/<guid[^>]*>([\s\S]*?)<\/guid>/)?.[1] ?? "").trim();

    if (title.length > 5) articles.push({ title, desc, link });
  }
  return articles;
}

// ── Claude로 요약 + 제목 생성 ──
async function summarize(category, articles) {
  const list = articles
    .map((a, i) => `[기사 ${i + 1}]\n제목: ${a.title}\n내용: ${a.desc}\n링크: ${a.link}`)
    .join("\n\n");

  const prompt = `당신은 취업준비생을 위한 뉴스 큐레이터입니다.

이 글의 목적은 단 하나입니다.
취준생이 뉴스를 그냥 소비하는 게 아니라, 자신만의 관점을 만들도록 돕는 것.
해석을 대신 해주지 말고, 답을 주지 마세요.
"이렇게 말하면 좋아요" 같은 표현은 금지입니다.
당신이 할 일은 "어디를 봐야 하는지 방향만 가리키는 것"입니다.

반드시 제외할 기사 유형 (아래 중 하나라도 해당하면 선택하지 마세요):
- 정치 관련 (정치인, 정당, 선거, 국회, 대통령 발언 등)
- 범죄·사건 사고 (폭행, 사기, 도박, 음주운전, 살인, 납치, 강도, 마약, 성범죄, 횡령, 배임, 구속, 체포, 수사, 재판 등)
- 연예인 사생활·스캔들
- 자연재해·사고 사망 소식

위 기준으로 걸러낸 뒤, 취준생에게 가장 유익한 기사 2개를 선택하세요.
단, 선택한 2개의 기사는 하나의 제목 아래 자연스럽게 묶일 수 있는 연결된 흐름이어야 합니다.
서로 완전히 다른 주제라면 억지로 묶지 말고 가장 유익한 기사 1개를 중심으로 연관된 기사를 고르세요.

본문 작성 규칙:
- 어려운 용어는 괄호 안에 쉽게 설명 (예: 호르무즈 해협 = 중동 원유가 지나는 좁은 바다길)
- 원문 내용을 충분히 설명해서 링크를 안 클릭해도 내용을 이해할 수 있게
- 답은 주지 말 것. 생각의 방향만 제시
- 친근하고 담백한 말투
- 문장 안에서 쉼표(,)는 명사·항목을 나열할 때만 씁니다. 절을 연결하거나 시간·조건을 표현할 때는 쓰지 마세요.

출력 형식 (반드시 아래 구조를 정확히 지키세요):

TITLE: [주제 한 줄] [기사1 핵심 키워드, 기사2 핵심 키워드]
예시: AI가 바꾸는 일과 산업의 풍경 [AI에이전트, 배민 AI 예측 도입]
- 주제: 15자 이내. 두 기사를 하나로 아우르는 취준생 공감 표현
- 키워드: 각 기사에서 가장 눈길 끄는 핵심어 2~4단어씩. 브라켓 안 쉼표는 두 키워드를 구분하는 구분자입니다.

기사 2개를 아래 형식으로 작성하세요. 기사 사이는 반드시 --- 로 구분하세요:

📰 [원래 기사 제목 그대로]
🔗 원문: [링크]

무슨 일이냐면:
(이 기사의 핵심 내용을 4~6줄로 충분히 설명. 배경 맥락 포함. 처음 접하는 사람도 이해할 수 있게. 어려운 개념은 괄호로 바로 설명.)

🔍 이걸 왜 봐야 하냐면:
(이 이슈가 취업·산업·사회와 어떻게 연결되는지. 왜 취준생이 알면 좋은지. 3~4줄.)

💬 스스로 물어봐:
(정답 없는 질문 2개. 본인 경험·관점·가치관과 연결해서 생각해보게 만드는 것.)

---

기사 목록:
${list}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API 오류: ${err}`);
  }
  const data = await response.json();
  const raw = data.content[0].text;

  // 첫 줄 TITLE: 파싱 후 본문과 분리
  const titleMatch = raw.match(/^TITLE:\s*(.+)/m);
  const generatedTitle = titleMatch ? titleMatch[1].trim() : null;
  const content = raw.replace(/^TITLE:\s*.+\n*/m, "").trim();

  return { generatedTitle, content };
}

// ── 자소서 팁 생성 ──
async function generateJasoserTip(role) {
  const isDual = role.includes("/");
  const dualDescriptions = {
    "품질관리 (제조/화학)": "제조 품질(치수·외관 불량, 라인 불량률, MES)과 화학 품질(성분 분석, 배치 기록, HPLC)의 차이가 자연스럽게 드러나도록 작성하세요.",
    "생산관리 (제조/화학)": "일반 제조 생관(생산 계획·공정 관리·납기 대응)과 화학 계열 생관(배치 생산·수율 관리·GMP 준수)의 차이가 자연스럽게 드러나도록 작성하세요.",
    "물류/무역": "물류(선적 일정·포워더·3PL 관리·재고 흐름)와 무역(L/C·B/L·통관·무역서류 처리)이 실무에서 어떻게 맞닿는지 두 맥락이 모두 드러나도록 작성하세요.",
  };
  const dualNote = isDual && dualDescriptions[role]
    ? `\n이 직무는 두 가지 맥락을 함께 다룹니다.\n${dualDescriptions[role]}`
    : isDual
    ? `\n이 직무는 두 가지 맥락을 함께 다룹니다. BEFORE/질문/AFTER 전반에 두 맥락의 차이가 자연스럽게 드러나도록 작성하세요.`
    : "";

  const prompt = `당신은 취업 전문가입니다. 자소서 비포·애프터 예시 게시물을 하나 만들어주세요.

직무: ${role}
문항: 지원 직무에 적합하다고 생각하는 이유를 서술하시오.
${dualNote}
작성 규칙:
- BEFORE (~300자): 결과 없음 / 선택 기준 없음 / 경쟁사 대비 빈자리 없음, 이 3가지 약점이 자연스럽게 드러나는 자소서 초안
- 질문 3개: 어느 문장을 보고 → 어떤 질문을 던졌는지 → 왜 그 질문인지 설명 → 사용자 답변 (구체적 수치 포함)
- AFTER (~300자): 3개 질문의 답변이 모두 자연스럽게 녹아든 개선 버전

구체성 규칙 (반드시 준수):
- 수치는 반드시 맥락과 함께: "불량률" (X) → "라인 불량률 0.8%→0.3% 개선" (O), "저장률" (X) → "인스타그램 게시물 저장수" (O)
- 숫자는 실제처럼 구체적으로: "많이 개선" (X) → "3개월 만에 불량률 0.8%에서 0.3%로 감소" (O)
- 도구·시스템·공정명 명시: "관련 시스템" (X) → "SAP / MES / ERP / HPLC 분석" (O)

출력 형식 (이 구조를 정확히 지키세요):

TITLE: ✍️ [직무명] 자소서 소크라틱 메소드 [키워드1, 키워드2]
(직무명은 role에서 괄호 제거한 핵심 이름만. 예: "품질관리 자소서 소크라틱 메소드 [제조·화학]")

직무: ${role}
문항: 지원 직무에 적합하다고 생각하는 이유

━━━━━━━━━━━━━━━━━━━━━
[ BEFORE ] 취업소크라테스와 대화 전
━━━━━━━━━━━━━━━━━━━━━

(BEFORE 본문)

▷ 약 300자


────────────────────
취업소크라테스가 던진 질문들
────────────────────

▶ Q1. (약점 한 줄 요약)

이 문장을 보고
→ "(해당 문장 인용)"

질문: (질문 내용)

이 질문을 던진 이유:
(2~3줄 설명)

답변: "(수치 포함 구체적 답변)"


▶ Q2. (약점 한 줄 요약)

이 문장을 보고
→ "(해당 문장 인용)"

질문: (질문 내용)

이 질문을 던진 이유:
(2~3줄 설명)

답변: "(수치 포함 구체적 답변)"


▶ Q3. (약점 한 줄 요약)

이 문장을 보고
→ "(해당 문장 인용)"

질문: (질문 내용)

이 질문을 던진 이유:
(2~3줄 설명)

답변: "(수치 포함 구체적 답변)"


────────────────────

[ AFTER ] 취업소크라테스와 대화 후

(AFTER 본문)

▷ 약 300자


━━━━━━━━━━━━━━━━━━━━━
달라진 것 요약

1. (변화 1)
2. (변화 2)
3. (변화 3)
━━━━━━━━━━━━━━━━━━━━━`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API 오류 (자소서 팁): ${err}`);
  }
  const data = await response.json();
  const raw = data.content[0].text;

  const titleMatch = raw.match(/^TITLE:\s*(.+)/m);
  const generatedTitle = titleMatch ? titleMatch[1].trim() : `✍️ 자소서 비포·애프터 [${role}]`;
  const content = raw.replace(/^TITLE:\s*.+\n*/m, "").trim();

  return { generatedTitle, content };
}

// ── Supabase에 임시저장 ──
async function saveToSupabase(title, content, category) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/posts`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({ title, content, category, is_published: false }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase 저장 실패: ${err}`);
  }
}

// ── 메인 ──
async function main() {
  const argIdx = process.argv.indexOf("--category");
  const category = argIdx !== -1 ? process.argv[argIdx + 1] : todayCategory();
  const dateStr = todayStr();

  console.log(`\n📅 ${dateStr} | 카테고리: ${category}`);

  console.log(`\n─── 뉴스: ${category} ───`);
  console.log("🔍 뉴스 수집 중...");
  const articles = await fetchArticles(category);
  if (articles.length === 0) throw new Error(`${category}: 기사를 가져오지 못했습니다`);
  console.log(`   ${articles.length}개 기사 수집 완료`);
  articles.forEach((a, i) => console.log(`   [${i+1}] ${a.title}`));

  console.log("🤖 AI 정리 중...");
  const { generatedTitle, content } = await summarize(category, articles);
  const finalTitle = generatedTitle ?? `${category} 뉴스 ${dateStr}`;

  console.log("💾 Supabase 임시저장 중...");
  await saveToSupabase(finalTitle, content, category);
  console.log(`   ✅ 완료! 제목: "${finalTitle}"`);

  const role = todayRole();
  console.log(`\n─── 자소서 팁 (${role}) ───`);
  console.log("🤖 자소서 비포·애프터 생성 중...");
  const { generatedTitle: tipTitle, content: tipContent } = await generateJasoserTip(role);
  await saveToSupabase(tipTitle, tipContent, "자소서 팁");
  console.log(`   ✅ 완료! 제목: "${tipTitle}"`);

  console.log(`\n✅ 전체 완료! 관리자 페이지 > 게시판 탭에서 확인 후 발행하세요.\n`);
}

main().catch((err) => {
  console.error("\n❌ 오류:", err.message);
  process.exit(1);
});
