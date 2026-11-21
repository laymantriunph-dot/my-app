alter table public.tasks
  add column if not exists custom_category text,
  add column if not exists tags text[] not null default '{}'::text[];

alter table public.tasks
  drop constraint if exists tasks_custom_category_check;
alter table public.tasks
  add constraint tasks_custom_category_check
  check (
    custom_category is null
    or char_length(btrim(custom_category)) between 1 and 24
  );

alter table public.tasks
  drop constraint if exists tasks_tags_check;
alter table public.tasks
  add constraint tasks_tags_check
  check (coalesce(array_length(tags, 1), 0) between 0 and 8);

alter table public.tasks
  drop constraint if exists tasks_long_term_labels_only_check;
alter table public.tasks
  add constraint tasks_long_term_labels_only_check
  check (
    category = 'longTerm'
    or (custom_category is null and coalesce(array_length(tags, 1), 0) = 0)
  );

create index if not exists tasks_long_term_category_idx
  on public.tasks (user_id, custom_category)
  where category = 'longTerm';

create index if not exists tasks_long_term_tags_idx
  on public.tasks using gin (tags)
  where category = 'longTerm';
