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
const BASE = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const HEADERS = { "apikey": KEY, "Authorization": `Bearer ${KEY}`, "Content-Type": "application/json" };

async function main() {
  const res = await fetch(`${BASE}/rest/v1/posts?select=id,title,content,category&order=created_at.desc`, { headers: HEADERS });
  const posts = await res.json();
  const newsPosts = posts.filter(p => NEWS_CATS.includes(p.category));
  console.log(`대상 ${newsPosts.length}개 뉴스 글\n`);

  for (const post of newsPosts) {
    const newTitle = post.title.replace(/,/g, "");
    const newContent = post.content.replace(/,/g, "");
    if (newTitle === post.title && newContent === post.content) {
      console.log(`⏭ [${post.category}] 쉼표 없음 — 스킵`);
      continue;
    }
    await fetch(`${BASE}/rest/v1/posts?id=eq.${post.id}`, {
      method: "PATCH",
      headers: HEADERS,
      body: JSON.stringify({ title: newTitle, content: newContent }),
    });
    console.log(`✅ [${post.category}] ${post.title.slice(0, 40)}...`);
  }
  console.log("\n완료!");
}

main().catch(e => { console.error("❌", e.message); process.exit(1); });
