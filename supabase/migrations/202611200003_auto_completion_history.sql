alter table public.task_archives
  add column if not exists record_type text not null default 'manual';

alter table public.task_archives
  add column if not exists record_date date not null default current_date;

update public.task_archives
set record_date = (archived_at at time zone 'Asia/Shanghai')::date
where record_type = 'manual'
  and record_date = current_date;

alter table public.task_archives
  drop constraint if exists task_archives_record_type_check;
alter table public.task_archives
  add constraint task_archives_record_type_check
  check (record_type in ('manual', 'completed'));

create index if not exists task_archives_completed_day_idx
  on public.task_archives (user_id, category, record_date)
  where record_type = 'completed';
