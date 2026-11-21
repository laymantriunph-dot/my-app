alter table public.tasks
  add column if not exists scheduled_date date;

update public.tasks
set scheduled_date = current_date
where scheduled_date is null;

alter table public.tasks
  alter column scheduled_date set default current_date,
  alter column scheduled_date set not null;

create index if not exists tasks_user_id_scheduled_date_idx
  on public.tasks (user_id, scheduled_date, created_at desc);
