-- posts table
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  content text not null default '',
  job_title text not null default '',
  category text not null default '자소서팁',
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists posts_created_at_idx on posts(created_at desc);
create index if not exists posts_published_idx on posts(is_published);

alter table posts enable row level security;
create policy "Public read published posts" on posts for select using (is_published = true);
create policy "Admin full access on posts" on posts using (auth.jwt()->>'email' = 'ijhan6403@gmail.com') with check (auth.jwt()->>'email' = 'ijhan6403@gmail.com');

-- site_config table
create table if not exists site_config (
  key text primary key,
  value jsonb not null default 'null'
);

alter table site_config enable row level security;
create policy "Public read site_config" on site_config for select using (true);
create policy "Admin update site_config" on site_config using (auth.jwt()->>'email' = 'ijhan6403@gmail.com') with check (auth.jwt()->>'email' = 'ijhan6403@gmail.com');

insert into site_config (key, value) values ('board_visible', 'false') on conflict (key) do nothing;
