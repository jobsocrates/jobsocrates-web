-- ================================================================
-- RLS 정책 일괄 재적용 스크립트
-- Supabase SQL Editor에서 전체 복사·실행하세요
-- (idempotent: 여러 번 실행해도 안전)
-- ================================================================

-- ── 1. 유저 테이블 RLS 활성화 ────────────────────────────────────
alter table if exists profiles          enable row level security;
alter table if exists sessions          enable row level security;
alter table if exists cover_items       enable row level security;
alter table if exists messages          enable row level security;
alter table if exists revisions         enable row level security;
alter table if exists interview_questions enable row level security;
alter table if exists interview_answers enable row level security;

-- ── 2. 어드민 테이블 RLS 활성화 ──────────────────────────────────
alter table if exists page_views        enable row level security;
alter table if exists admin_reviews     enable row level security;
alter table if exists prompt_notes      enable row level security;

-- ================================================================
-- 3. 유저 정책 (자기 데이터만 접근)
-- ================================================================

drop policy if exists "profiles_policy"           on profiles;
create policy "profiles_policy" on profiles
  for all using (id = auth.uid())
  with check (id = auth.uid());

drop policy if exists "sessions_policy"           on sessions;
create policy "sessions_policy" on sessions
  for all using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "cover_items_policy"        on cover_items;
create policy "cover_items_policy" on cover_items
  for all using (
    session_id in (select id from sessions where user_id = auth.uid())
  )
  with check (
    session_id in (select id from sessions where user_id = auth.uid())
  );

drop policy if exists "messages_policy"           on messages;
create policy "messages_policy" on messages
  for all using (
    cover_item_id in (
      select ci.id from cover_items ci
      join sessions s on s.id = ci.session_id
      where s.user_id = auth.uid()
    )
  )
  with check (
    cover_item_id in (
      select ci.id from cover_items ci
      join sessions s on s.id = ci.session_id
      where s.user_id = auth.uid()
    )
  );

drop policy if exists "revisions_policy"          on revisions;
create policy "revisions_policy" on revisions
  for all using (
    cover_item_id in (
      select ci.id from cover_items ci
      join sessions s on s.id = ci.session_id
      where s.user_id = auth.uid()
    )
  )
  with check (
    cover_item_id in (
      select ci.id from cover_items ci
      join sessions s on s.id = ci.session_id
      where s.user_id = auth.uid()
    )
  );

drop policy if exists "interview_questions_policy" on interview_questions;
create policy "interview_questions_policy" on interview_questions
  for all using (
    cover_item_id in (
      select ci.id from cover_items ci
      join sessions s on s.id = ci.session_id
      where s.user_id = auth.uid()
    )
  )
  with check (
    cover_item_id in (
      select ci.id from cover_items ci
      join sessions s on s.id = ci.session_id
      where s.user_id = auth.uid()
    )
  );

drop policy if exists "interview_answers_policy"  on interview_answers;
create policy "interview_answers_policy" on interview_answers
  for all using (
    interview_question_id in (
      select iq.id from interview_questions iq
      join cover_items ci on ci.id = iq.cover_item_id
      join sessions s on s.id = ci.session_id
      where s.user_id = auth.uid()
    )
  )
  with check (
    interview_question_id in (
      select iq.id from interview_questions iq
      join cover_items ci on ci.id = iq.cover_item_id
      join sessions s on s.id = ci.session_id
      where s.user_id = auth.uid()
    )
  );

-- ================================================================
-- 4. page_views: 누구나 insert 가능 (비로그인 포함), admin만 read
-- ================================================================

drop policy if exists "page_views_insert"     on page_views;
create policy "page_views_insert" on page_views
  for insert with check (true);

drop policy if exists "page_views_admin_read" on page_views;
create policy "page_views_admin_read" on page_views
  for select using (auth.email() = 'ijhan6403@gmail.com');

-- 비로그인 유저도 insert 할 수 있도록 anon role grant
grant insert on page_views to anon;

-- ================================================================
-- 5. admin_reviews: admin full access
-- ================================================================

drop policy if exists "admin_reviews_policy"  on admin_reviews;
create policy "admin_reviews_policy" on admin_reviews
  for all
  using     (auth.email() = 'ijhan6403@gmail.com')
  with check (auth.email() = 'ijhan6403@gmail.com');

-- ================================================================
-- 6. prompt_notes: admin full access
-- ================================================================

drop policy if exists "prompt_notes_policy"   on prompt_notes;
create policy "prompt_notes_policy" on prompt_notes
  for all
  using     (auth.email() = 'ijhan6403@gmail.com')
  with check (auth.email() = 'ijhan6403@gmail.com');

-- ================================================================
-- 7. admin의 모든 유저 데이터 읽기 정책
-- ================================================================

drop policy if exists "admin_read_profiles"            on profiles;
create policy "admin_read_profiles" on profiles
  for select using (auth.email() = 'ijhan6403@gmail.com');

drop policy if exists "admin_read_sessions"            on sessions;
create policy "admin_read_sessions" on sessions
  for select using (auth.email() = 'ijhan6403@gmail.com');

drop policy if exists "admin_read_cover_items"         on cover_items;
create policy "admin_read_cover_items" on cover_items
  for select using (auth.email() = 'ijhan6403@gmail.com');

drop policy if exists "admin_read_messages"            on messages;
create policy "admin_read_messages" on messages
  for select using (auth.email() = 'ijhan6403@gmail.com');

drop policy if exists "admin_read_revisions"           on revisions;
create policy "admin_read_revisions" on revisions
  for select using (auth.email() = 'ijhan6403@gmail.com');

drop policy if exists "admin_read_interview_questions" on interview_questions;
create policy "admin_read_interview_questions" on interview_questions
  for select using (auth.email() = 'ijhan6403@gmail.com');

drop policy if exists "admin_read_interview_answers"   on interview_answers;
create policy "admin_read_interview_answers" on interview_answers
  for select using (auth.email() = 'ijhan6403@gmail.com');
