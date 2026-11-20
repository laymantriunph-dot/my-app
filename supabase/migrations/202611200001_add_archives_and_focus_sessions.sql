create table if not exists public.task_archives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 120),
  category text not null check (
    category in ('today', 'longTerm', 'secondary')
  ),
  tasks jsonb not null default '[]'::jsonb,
  task_count integer not null default 0 check (task_count >= 0),
  completed_count integer not null default 0 check (completed_count >= 0),
  archived_at timestamptz not null default now()
);

create index if not exists task_archives_user_id_archived_at_idx
  on public.task_archives (user_id, archived_at desc);

alter table public.task_archives enable row level security;

drop policy if exists "Users can read their own task archives"
  on public.task_archives;
create policy "Users can read their own task archives"
  on public.task_archives
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own task archives"
  on public.task_archives;
create policy "Users can create their own task archives"
  on public.task_archives
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own task archives"
  on public.task_archives;
create policy "Users can delete their own task archives"
  on public.task_archives
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.task_archives from anon;
grant select, insert, delete on table public.task_archives to authenticated;

create table if not exists public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  mode text not null check (mode in ('countdown', 'stopwatch')),
  note text not null default '专注学习'
    check (char_length(btrim(note)) between 1 and 80),
  planned_seconds integer not null default 0
    check (planned_seconds >= 0),
  elapsed_seconds integer not null check (elapsed_seconds > 0),
  started_at timestamptz not null,
  ended_at timestamptz not null,
  created_at timestamptz not null default now(),
  check (ended_at >= started_at)
);

create index if not exists focus_sessions_user_id_ended_at_idx
  on public.focus_sessions (user_id, ended_at desc);

alter table public.focus_sessions enable row level security;

drop policy if exists "Users can read their own focus sessions"
  on public.focus_sessions;
create policy "Users can read their own focus sessions"
  on public.focus_sessions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "Users can create their own focus sessions"
  on public.focus_sessions;
create policy "Users can create their own focus sessions"
  on public.focus_sessions
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete their own focus sessions"
  on public.focus_sessions;
create policy "Users can delete their own focus sessions"
  on public.focus_sessions
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

revoke all on table public.focus_sessions from anon;
grant select, insert, delete on table public.focus_sessions to authenticated;
