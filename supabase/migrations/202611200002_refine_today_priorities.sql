alter table public.tasks
  add column if not exists priority text not null default 'primary';

update public.tasks
set
  category = 'today',
  priority = 'secondary'
where category = 'secondary';

update public.tasks
set priority = 'primary'
where priority is null;

alter table public.tasks
  drop constraint if exists tasks_category_check;
alter table public.tasks
  add constraint tasks_category_check
  check (category in ('today', 'longTerm'));

alter table public.tasks
  drop constraint if exists tasks_priority_check;
alter table public.tasks
  add constraint tasks_priority_check
  check (priority in ('primary', 'secondary'));

update public.task_archives
set category = 'today'
where category = 'secondary';

update public.task_archives
set tasks = coalesce(
  (
    select jsonb_agg(
      case
        when item.value ->> 'category' = 'secondary'
          then item.value || jsonb_build_object(
            'category', 'today',
            'priority', 'secondary'
          )
        else item.value || jsonb_build_object(
          'priority',
          coalesce(item.value ->> 'priority', 'primary')
        )
      end
      order by item.ordinality
    )
    from jsonb_array_elements(tasks) with ordinality as item(value, ordinality)
  ),
  '[]'::jsonb
)
where jsonb_array_length(tasks) > 0;

alter table public.task_archives
  drop constraint if exists task_archives_category_check;
alter table public.task_archives
  add constraint task_archives_category_check
  check (category in ('today', 'longTerm'));
