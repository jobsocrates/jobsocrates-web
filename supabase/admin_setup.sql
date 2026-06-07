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

create policy "page_views_insert" on page_views
  for insert with check (true);

create policy "page_views_admin_read" on page_views
  for select using (auth.email() = 'ijhan6403@gmail.com');

create policy "admin_reviews_policy" on admin_reviews
  for all
  using (auth.email() = 'ijhan6403@gmail.com')
  with check (auth.email() = 'ijhan6403@gmail.com');

create policy "prompt_notes_policy" on prompt_notes
  for all
  using (auth.email() = 'ijhan6403@gmail.com')
  with check (auth.email() = 'ijhan6403@gmail.com');

create policy "admin_read_profiles" on profiles
  for select using (auth.email() = 'ijhan6403@gmail.com');

create policy "admin_read_sessions" on sessions
  for select using (auth.email() = 'ijhan6403@gmail.com');

create policy "admin_read_cover_items" on cover_items
  for select using (auth.email() = 'ijhan6403@gmail.com');

create policy "admin_read_messages" on messages
  for select using (auth.email() = 'ijhan6403@gmail.com');

create policy "admin_read_interview_questions" on interview_questions
  for select using (auth.email() = 'ijhan6403@gmail.com');

create policy "admin_read_interview_answers" on interview_answers
  for select using (auth.email() = 'ijhan6403@gmail.com');
