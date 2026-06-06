-- public.users 테이블 (auth.users와 연동)
create table public.users (
  id        uuid references auth.users(id) on delete cascade primary key,
  email     text not null,
  created_at timestamptz default now() not null
);

-- Row Level Security 활성화
alter table public.users enable row level security;

-- 본인 데이터만 조회 가능
create policy "users: select own"
  on public.users for select
  using (auth.uid() = id);

-- 회원가입 시 자동으로 public.users에 삽입하는 트리거
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
