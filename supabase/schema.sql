-- 취업소크라테스 Supabase Schema (idempotent)

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade
);
alter table profiles add column if not exists email text not null default '';
alter table profiles add column if not exists created_at timestamptz not null default now();

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, email) values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
exception when others then
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create table if not exists sessions (
  id uuid primary key default gen_random_uuid()
);
alter table sessions add column if not exists user_id uuid references profiles(id) on delete cascade;
alter table sessions add column if not exists job_title text not null default '';
alter table sessions add column if not exists jd_keywords jsonb not null default '[]';
alter table sessions add column if not exists created_at timestamptz not null default now();
alter table sessions add column if not exists updated_at timestamptz not null default now();
alter table sessions add column if not exists analysis_report text;
create index if not exists sessions_user_id_idx on sessions(user_id);

create table if not exists cover_items (
  id uuid primary key default gen_random_uuid()
);
alter table cover_items add column if not exists session_id uuid references sessions(id) on delete cascade;
alter table cover_items add column if not exists question text not null default '';
alter table cover_items add column if not exists draft text not null default '';
alter table cover_items add column if not exists char_limit integer;
alter table cover_items add column if not exists status text not null default 'idle';
alter table cover_items add column if not exists order_index integer not null default 0;
alter table cover_items add column if not exists created_at timestamptz not null default now();
alter table cover_items add column if not exists updated_at timestamptz not null default now();
create index if not exists cover_items_session_id_idx on cover_items(session_id);

create table if not exists messages (
  id uuid primary key default gen_random_uuid()
);
alter table messages add column if not exists cover_item_id uuid references cover_items(id) on delete cascade;
alter table messages add column if not exists role text not null default 'user';
alter table messages add column if not exists content text not null default '';
alter table messages add column if not exists created_at timestamptz not null default now();
create index if not exists messages_cover_item_id_idx on messages(cover_item_id);

create table if not exists revisions (
  id uuid primary key default gen_random_uuid()
);
alter table revisions add column if not exists cover_item_id uuid references cover_items(id) on delete cascade;
alter table revisions add column if not exists content text not null default '';
alter table revisions add column if not exists changes jsonb not null default '[]';
alter table revisions add column if not exists created_at timestamptz not null default now();
create index if not exists revisions_cover_item_id_idx on revisions(cover_item_id);

create table if not exists interview_questions (
  id uuid primary key default gen_random_uuid()
);
alter table interview_questions add column if not exists cover_item_id uuid references cover_items(id) on delete cascade;
alter table interview_questions add column if not exists question text not null default '';
alter table interview_questions add column if not exists order_index integer not null default 0;
alter table interview_questions add column if not exists created_at timestamptz not null default now();
create index if not exists interview_questions_cover_item_id_idx on interview_questions(cover_item_id);

create table if not exists interview_answers (
  id uuid primary key default gen_random_uuid()
);
alter table interview_answers add column if not exists interview_question_id uuid references interview_questions(id) on delete cascade;
alter table interview_answers add column if not exists user_answer text not null default '';
alter table interview_answers add column if not exists ai_feedback text not null default '';
alter table interview_answers add column if not exists created_at timestamptz not null default now();
create index if not exists interview_answers_question_id_idx on interview_answers(interview_question_id);

alter table profiles enable row level security;
alter table sessions enable row level security;
alter table cover_items enable row level security;
alter table messages enable row level security;
alter table revisions enable row level security;
alter table interview_questions enable row level security;
alter table interview_answers enable row level security;

drop policy if exists "profiles_policy" on profiles;
create policy "profiles_policy" on profiles for all using (id = auth.uid());

drop policy if exists "sessions_policy" on sessions;
create policy "sessions_policy" on sessions for all using (user_id = auth.uid());

drop policy if exists "cover_items_policy" on cover_items;
create policy "cover_items_policy" on cover_items for all using (
  session_id in (select id from sessions where user_id = auth.uid())
);

drop policy if exists "messages_policy" on messages;
create policy "messages_policy" on messages for all using (
  cover_item_id in (
    select ci.id from cover_items ci
    join sessions s on s.id = ci.session_id
    where s.user_id = auth.uid()
  )
);

drop policy if exists "revisions_policy" on revisions;
create policy "revisions_policy" on revisions for all using (
  cover_item_id in (
    select ci.id from cover_items ci
    join sessions s on s.id = ci.session_id
    where s.user_id = auth.uid()
  )
);

drop policy if exists "interview_questions_policy" on interview_questions;
create policy "interview_questions_policy" on interview_questions for all using (
  cover_item_id in (
    select ci.id from cover_items ci
    join sessions s on s.id = ci.session_id
    where s.user_id = auth.uid()
  )
);

drop policy if exists "interview_answers_policy" on interview_answers;
create policy "interview_answers_policy" on interview_answers for all using (
  interview_question_id in (
    select iq.id from interview_questions iq
    join cover_items ci on ci.id = iq.cover_item_id
    join sessions s on s.id = ci.session_id
    where s.user_id = auth.uid()
  )
);

-- ─── Admin tables ───────────────────────────────────────────────────────────

create table if not exists page_views (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  created_at timestamptz not null default now()
);

create table if not exists admin_reviews (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  rating text,
  comment text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(session_id)
);

create table if not exists prompt_notes (
  id uuid primary key default gen_random_uuid(),
  good_notes text not null default '',
  bad_notes text not null default '',
  improvement_notes text not null default '',
  updated_at timestamptz not null default now()
);

alter table page_views enable row level security;
alter table admin_reviews enable row level security;
alter table prompt_notes enable row level security;

-- page_views: 누구나 insert 가능, admin만 read
drop policy if exists "page_views_insert" on page_views;
create policy "page_views_insert" on page_views for insert with check (true);

drop policy if exists "page_views_admin_read" on page_views;
create policy "page_views_admin_read" on page_views for select
  using (auth.jwt() ->> 'email' = 'ijhan6403@gmail.com');

-- admin_reviews: admin full access
drop policy if exists "admin_reviews_policy" on admin_reviews;
create policy "admin_reviews_policy" on admin_reviews for all
  using (auth.jwt() ->> 'email' = 'ijhan6403@gmail.com')
  with check (auth.jwt() ->> 'email' = 'ijhan6403@gmail.com');

-- prompt_notes: admin full access
drop policy if exists "prompt_notes_policy" on prompt_notes;
create policy "prompt_notes_policy" on prompt_notes for all
  using (auth.jwt() ->> 'email' = 'ijhan6403@gmail.com')
  with check (auth.jwt() ->> 'email' = 'ijhan6403@gmail.com');

-- Admin read access to all existing tables (OR'd with user-scoped policies)
drop policy if exists "admin_read_profiles" on profiles;
create policy "admin_read_profiles" on profiles for select
  using (auth.jwt() ->> 'email' = 'ijhan6403@gmail.com');

drop policy if exists "admin_read_sessions" on sessions;
create policy "admin_read_sessions" on sessions for select
  using (auth.jwt() ->> 'email' = 'ijhan6403@gmail.com');

drop policy if exists "admin_read_cover_items" on cover_items;
create policy "admin_read_cover_items" on cover_items for select
  using (auth.jwt() ->> 'email' = 'ijhan6403@gmail.com');

drop policy if exists "admin_read_messages" on messages;
create policy "admin_read_messages" on messages for select
  using (auth.jwt() ->> 'email' = 'ijhan6403@gmail.com');

drop policy if exists "admin_read_revisions" on revisions;
create policy "admin_read_revisions" on revisions for select
  using (auth.jwt() ->> 'email' = 'ijhan6403@gmail.com');

drop policy if exists "admin_read_interview_questions" on interview_questions;
create policy "admin_read_interview_questions" on interview_questions for select
  using (auth.jwt() ->> 'email' = 'ijhan6403@gmail.com');

drop policy if exists "admin_read_interview_answers" on interview_answers;
create policy "admin_read_interview_answers" on interview_answers for select
  using (auth.jwt() ->> 'email' = 'ijhan6403@gmail.com');
