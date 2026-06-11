// 자소서 각색 스크립트 — 터미널 출력 + DB 저장 (비공개)
// 실행: node scripts/generate-post.mjs

import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';

try {
  const env = readFileSync('.env.local', 'utf8');
  for (const line of env.split('\n')) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length) process.env[key.trim()] = rest.join('=').trim();
  }
} catch {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !ANTHROPIC_KEY) {
  console.error('.env.local 에 필요한 키가 없어요');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const { data: items } = await supabase
  .from('cover_items')
  .select('question, draft, sessions(job_title)')
  .not('draft', 'eq', '')
  .order('created_at', { ascending: false })
  .limit(10);

if (!items?.length) {
  console.error('DB에 자소서 데이터가 없어요');
  process.exit(1);
}

const item = items.sort((a, b) => b.draft.length - a.draft.length)[0];
const jobTitle = item.sessions?.job_title || '';

const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });
const res = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 500,
  messages: [{
    role: 'user',
    content: `다음 자소서 내용을 SNS 게시글로 각색해줘.

- 제목: 25자 이내, 클릭하고 싶은 제목
- 본문: 200자 이내, 실제 자소서 느낌 지우고 공감가는 커리어 이야기처럼, 해시태그 1~2개, 익명화(회사명/이름 제거)

직군: ${jobTitle}
자소서 내용: ${item.draft.slice(0, 600)}

반드시 아래 JSON 형식으로만 출력 (다른 텍스트 없이):
{"title": "제목", "content": "본문"}`
  }]
});

let title = '', adapted = '';
try {
  const parsed = JSON.parse(res.content[0].text.trim());
  title = parsed.title || '';
  adapted = parsed.content || '';
} catch {
  adapted = res.content[0].text.trim();
  title = adapted.slice(0, 25);
}

console.log('\n========== 제목 ==========\n');
console.log(title);
console.log('\n========== 본문 ==========\n');
console.log(adapted);
console.log('\n===========================\n');
console.log(`(본문 ${adapted.length}자)`);

const { error } = await supabase.from('posts').insert({
  title,
  content: adapted,
  job_title: jobTitle,
  category: '자소서팁',
  is_published: false,
});

if (error) {
  console.error('\n⚠️  DB 저장 실패:', error.message);
} else {
  console.log('\n✅ 어드민 게시판에 저장됨 (비공개) — /admin 에서 공개 여부 선택하세요');
}
