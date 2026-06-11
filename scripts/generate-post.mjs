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

// 자소서 가져오기
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

// 가장 긴 초안 선택
const item = items.sort((a, b) => b.draft.length - a.draft.length)[0];
const jobTitle = item.sessions?.job_title || '';

// Claude로 각색
const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });
const res = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 400,
  messages: [{
    role: 'user',
    content: `다음 자소서 내용을 Threads(스레드) SNS용 짧은 글로 각색해줘.
- 반드시 200자 이내
- 실제 자소서 느낌 지우고, 공감가는 커리어 이야기처럼
- 해시태그 1~2개 포함
- 익명화 (회사명/이름 제거)

직군: ${jobTitle}
자소서 내용: ${item.draft.slice(0, 600)}`
  }]
});

const adapted = res.content[0].text.trim();

console.log('\n========== 복사해서 쓰세요 ==========\n');
console.log(adapted);
console.log('\n=====================================\n');
console.log(`(${adapted.length}자)`);

// DB에 저장 (비공개 상태)
const { error } = await supabase.from('posts').insert({
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
