/**
 * 기존 뉴스 게시글 제목을 "주제 [키워드1, 키워드2]" 형식으로 일괄 업데이트
 * 실행: node .github/scripts/retitle-posts.mjs
 */

import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dir, "../../.env.local");
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const m = line.match(/^([^#][^=]*)=(.+)$/);
    if (m) process.env[m[1].trim()] = m[2].trim();
  }
}

const NEWS_CATS = ["경제", "기술", "사회", "글로벌", "뉴스"];

async function fetchPosts() {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/posts?select=id,title,content,category&order=created_at.desc`;
  const res = await fetch(url, {
    headers: {
      "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
    },
  });
  return res.json();
}

async function generateTitle(currentTitle, content) {
  const prompt = `다음은 취업준비생 플랫폼의 뉴스 게시글입니다.
현재 제목: "${currentTitle}"
본문 내용 (앞부분):
${content.slice(0, 1200)}

위 내용을 보고 제목을 아래 형식으로 새로 만들어주세요:
형식: 주제 한 줄 [기사1 핵심 키워드, 기사2 핵심 키워드]
예시: AI가 바꾸는 일과 삶의 방식 [AI에이전트, 배민 AI 예측 도입]

규칙:
- 주제는 15자 이내, 취준생이 공감할 표현
- 키워드는 각 기사에서 가장 눈길 끄는 핵심어 2~4단어씩
- 제목만 출력. 다른 설명 없이.`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await response.json();
  return data.content[0].text.trim();
}

async function updateTitle(id, title) {
  const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/posts?id=eq.${id}`;
  await fetch(url, {
    method: "PATCH",
    headers: {
      "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title }),
  });
}

async function main() {
  const posts = await fetchPosts();
  const newsPosts = posts.filter(p => NEWS_CATS.includes(p.category));
  console.log(`뉴스 게시글 ${newsPosts.length}개 발견\n`);

  for (const post of newsPosts) {
    const newTitle = await generateTitle(post.title, post.content);
    await updateTitle(post.id, newTitle);
    console.log(`✅ [${post.category}] ${post.title}`);
    console.log(`   → ${newTitle}\n`);
  }
  console.log("완료!");
}

main().catch(err => { console.error("❌", err.message); process.exit(1); });
