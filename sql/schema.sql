-- ============================================================================
-- Wordly — схема базы для Supabase
--
-- Как применить:
--   1. Создайте проект на https://supabase.com (Free подойдёт)
--   2. Откройте SQL Editor → New query
--   3. Вставьте весь этот файл и нажмите Run
--
-- Что здесь важно:
--   * RLS включён на обеих таблицах — без политик не читается ни одна строка;
--   * политики разрешают только свои строки (auth.uid() = user_id);
--   * клиент ходит в базу с публичным anon-ключом, и это безопасно ровно
--     настолько, насколько корректны политики ниже.
--   * service_role key в браузер не попадает никогда.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Таблицы
-- ----------------------------------------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  daily_goal  integer not null default 20 check (daily_goal between 1 and 500),
  direction   text not null default 'en-ru' check (direction in ('en-ru', 'ru-en')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.card_progress (
  user_id     uuid not null references auth.users (id) on delete cascade,
  card_id     text not null check (char_length(card_id) between 1 and 64),
  box         smallint not null default 0 check (box between 0 and 5),
  due_at      timestamptz not null default now(),
  seen        integer not null default 0 check (seen >= 0),
  correct     integer not null default 0 check (correct >= 0),
  wrong       integer not null default 0 check (wrong >= 0),
  updated_at  timestamptz not null default now(),
  primary key (user_id, card_id)
);

create index if not exists card_progress_due_idx
  on public.card_progress (user_id, due_at);

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.card_progress enable row level security;

-- profiles: пользователь видит и правит только свой профиль
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- card_progress: только свои строки, все четыре операции
drop policy if exists "progress_select_own" on public.card_progress;
create policy "progress_select_own"
  on public.card_progress for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "progress_insert_own" on public.card_progress;
create policy "progress_insert_own"
  on public.card_progress for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "progress_update_own" on public.card_progress;
create policy "progress_update_own"
  on public.card_progress for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "progress_delete_own" on public.card_progress;
create policy "progress_delete_own"
  on public.card_progress for delete
  to authenticated
  using ((select auth.uid()) = user_id);

-- ----------------------------------------------------------------------------
-- Профиль создаётся автоматически при регистрации
-- ----------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
-- Проверка после применения (должно вернуть 2 строки с rowsecurity = true)
-- ----------------------------------------------------------------------------
-- select tablename, rowsecurity
-- from pg_tables
-- where schemaname = 'public' and tablename in ('profiles', 'card_progress');
