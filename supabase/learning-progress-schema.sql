create extension if not exists pgcrypto;

create table if not exists public.student_learning_progress (
  progress_id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(student_id) on delete cascade,
  recommendation_key text not null,
  recommendation_title text not null,
  provider text null,
  url text null,
  related_skill text null,
  status text not null default 'not_started',
  started_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'student_learning_progress_status_check'
      and conrelid = 'public.student_learning_progress'::regclass
  ) then
    alter table public.student_learning_progress
      add constraint student_learning_progress_status_check
      check (status in ('not_started', 'in_progress', 'completed'));
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'student_learning_progress_student_recommendation_key'
      and conrelid = 'public.student_learning_progress'::regclass
  ) then
    alter table public.student_learning_progress
      add constraint student_learning_progress_student_recommendation_key
      unique (student_id, recommendation_key);
  end if;
end $$;

create index if not exists idx_student_learning_progress_student_id
  on public.student_learning_progress(student_id);

create or replace function public.set_student_learning_progress_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_student_learning_progress_updated_at on public.student_learning_progress;
create trigger set_student_learning_progress_updated_at
before update on public.student_learning_progress
for each row execute function public.set_student_learning_progress_updated_at();

alter table public.student_learning_progress enable row level security;

drop policy if exists student_learning_progress_select_own on public.student_learning_progress;
create policy student_learning_progress_select_own
on public.student_learning_progress
for select
to authenticated
using (
  exists (
    select 1
    from public.students s
    join public.persons p on p.person_id = s.person_id
    where s.student_id = student_learning_progress.student_id
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists student_learning_progress_insert_own on public.student_learning_progress;
create policy student_learning_progress_insert_own
on public.student_learning_progress
for insert
to authenticated
with check (
  exists (
    select 1
    from public.students s
    join public.persons p on p.person_id = s.person_id
    where s.student_id = student_learning_progress.student_id
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists student_learning_progress_update_own on public.student_learning_progress;
create policy student_learning_progress_update_own
on public.student_learning_progress
for update
to authenticated
using (
  exists (
    select 1
    from public.students s
    join public.persons p on p.person_id = s.person_id
    where s.student_id = student_learning_progress.student_id
      and p.auth_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.students s
    join public.persons p on p.person_id = s.person_id
    where s.student_id = student_learning_progress.student_id
      and p.auth_user_id = auth.uid()
  )
);
