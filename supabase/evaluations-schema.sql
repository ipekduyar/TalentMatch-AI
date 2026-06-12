-- Bidirectional internship evaluations for accepted applications.
-- Run this file in the Supabase SQL Editor after the core TalentMatch schema.

create extension if not exists pgcrypto;

create table if not exists public.company_student_evaluations (
  evaluation_id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(application_id) on delete cascade,
  company_id uuid not null references public.companies(company_id) on delete cascade,
  student_id uuid not null references public.students(student_id) on delete cascade,
  technical_skills integer not null,
  communication integer not null,
  teamwork integer not null,
  responsibility integer not null,
  overall_score integer not null,
  strengths text null,
  improvement_feedback text null,
  would_recommend boolean null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_student_evaluations_application_unique unique(application_id),
  constraint company_student_evaluations_scores_check check (
    technical_skills between 1 and 5
    and communication between 1 and 5
    and teamwork between 1 and 5
    and responsibility between 1 and 5
    and overall_score between 1 and 5
  )
);

create table if not exists public.student_company_evaluations (
  evaluation_id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(application_id) on delete cascade,
  student_id uuid not null references public.students(student_id) on delete cascade,
  company_id uuid not null references public.companies(company_id) on delete cascade,
  mentorship_quality integer not null,
  learning_opportunity integer not null,
  work_environment integer not null,
  task_relevance integer not null,
  overall_score integer not null,
  positive_feedback text null,
  improvement_feedback text null,
  would_recommend boolean null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_company_evaluations_application_unique unique(application_id),
  constraint student_company_evaluations_scores_check check (
    mentorship_quality between 1 and 5
    and learning_opportunity between 1 and 5
    and work_environment between 1 and 5
    and task_relevance between 1 and 5
    and overall_score between 1 and 5
  )
);

create index if not exists idx_company_student_evaluations_company_id on public.company_student_evaluations(company_id);
create index if not exists idx_company_student_evaluations_student_id on public.company_student_evaluations(student_id);
create index if not exists idx_student_company_evaluations_student_id on public.student_company_evaluations(student_id);
create index if not exists idx_student_company_evaluations_company_id on public.student_company_evaluations(company_id);


create or replace function public.validate_company_student_evaluation_application()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.applications a
    where a.application_id = new.application_id
      and a.company_id = new.company_id
      and a.student_id = new.student_id
      and a.status = 'accepted'
  ) then
    raise exception 'Only accepted applications with matching company and student can be evaluated.';
  end if;

  return new;
end;
$$;

create or replace function public.validate_student_company_evaluation_application()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.applications a
    where a.application_id = new.application_id
      and a.company_id = new.company_id
      and a.student_id = new.student_id
      and a.status = 'accepted'
  ) then
    raise exception 'Only accepted applications with matching company and student can be evaluated.';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_company_student_evaluation_application on public.company_student_evaluations;
create trigger validate_company_student_evaluation_application
before insert or update on public.company_student_evaluations
for each row execute function public.validate_company_student_evaluation_application();

drop trigger if exists validate_student_company_evaluation_application on public.student_company_evaluations;
create trigger validate_student_company_evaluation_application
before insert or update on public.student_company_evaluations
for each row execute function public.validate_student_company_evaluation_application();

create or replace function public.set_evaluation_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_company_student_evaluations_updated_at on public.company_student_evaluations;
create trigger set_company_student_evaluations_updated_at
before update on public.company_student_evaluations
for each row execute function public.set_evaluation_updated_at();

drop trigger if exists set_student_company_evaluations_updated_at on public.student_company_evaluations;
create trigger set_student_company_evaluations_updated_at
before update on public.student_company_evaluations
for each row execute function public.set_evaluation_updated_at();

create or replace function public.is_current_company_representative(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_representatives cr
    join public.persons p on p.person_id = cr.person_id
    where p.auth_user_id = auth.uid()
      and cr.company_id = p_company_id
  );
$$;

create or replace function public.is_current_student(p_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.students s
    join public.persons p on p.person_id = s.person_id
    where p.auth_user_id = auth.uid()
      and s.student_id = p_student_id
  );
$$;

alter table public.company_student_evaluations enable row level security;
alter table public.student_company_evaluations enable row level security;

drop policy if exists company_student_evaluations_company_select on public.company_student_evaluations;
create policy company_student_evaluations_company_select
on public.company_student_evaluations
for select
to authenticated
using (public.is_current_company_representative(company_id));

drop policy if exists company_student_evaluations_student_select on public.company_student_evaluations;
create policy company_student_evaluations_student_select
on public.company_student_evaluations
for select
to authenticated
using (public.is_current_student(student_id));

drop policy if exists company_student_evaluations_company_insert on public.company_student_evaluations;
create policy company_student_evaluations_company_insert
on public.company_student_evaluations
for insert
to authenticated
with check (
  public.is_current_company_representative(company_id)
  and exists (
    select 1
    from public.applications a
    where a.application_id = company_student_evaluations.application_id
      and a.company_id = company_student_evaluations.company_id
      and a.student_id = company_student_evaluations.student_id
      and a.status = 'accepted'
  )
);

drop policy if exists company_student_evaluations_company_update on public.company_student_evaluations;
create policy company_student_evaluations_company_update
on public.company_student_evaluations
for update
to authenticated
using (public.is_current_company_representative(company_id))
with check (
  public.is_current_company_representative(company_id)
  and exists (
    select 1
    from public.applications a
    where a.application_id = company_student_evaluations.application_id
      and a.company_id = company_student_evaluations.company_id
      and a.student_id = company_student_evaluations.student_id
      and a.status = 'accepted'
  )
);

drop policy if exists student_company_evaluations_student_select on public.student_company_evaluations;
create policy student_company_evaluations_student_select
on public.student_company_evaluations
for select
to authenticated
using (public.is_current_student(student_id));

drop policy if exists student_company_evaluations_company_select on public.student_company_evaluations;
create policy student_company_evaluations_company_select
on public.student_company_evaluations
for select
to authenticated
using (public.is_current_company_representative(company_id));

drop policy if exists student_company_evaluations_student_insert on public.student_company_evaluations;
create policy student_company_evaluations_student_insert
on public.student_company_evaluations
for insert
to authenticated
with check (
  public.is_current_student(student_id)
  and exists (
    select 1
    from public.applications a
    where a.application_id = student_company_evaluations.application_id
      and a.company_id = student_company_evaluations.company_id
      and a.student_id = student_company_evaluations.student_id
      and a.status = 'accepted'
  )
);

drop policy if exists student_company_evaluations_student_update on public.student_company_evaluations;
create policy student_company_evaluations_student_update
on public.student_company_evaluations
for update
to authenticated
using (public.is_current_student(student_id))
with check (
  public.is_current_student(student_id)
  and exists (
    select 1
    from public.applications a
    where a.application_id = student_company_evaluations.application_id
      and a.company_id = student_company_evaluations.company_id
      and a.student_id = student_company_evaluations.student_id
      and a.status = 'accepted'
  )
);

create or replace function public.submit_company_student_evaluation(
  p_application_id uuid,
  p_technical_skills integer,
  p_communication integer,
  p_teamwork integer,
  p_responsibility integer,
  p_overall_score integer,
  p_strengths text,
  p_improvement_feedback text,
  p_would_recommend boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_student_id uuid;
  v_evaluation_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if p_technical_skills not between 1 and 5
    or p_communication not between 1 and 5
    or p_teamwork not between 1 and 5
    or p_responsibility not between 1 and 5
    or p_overall_score not between 1 and 5 then
    raise exception 'Scores must be between 1 and 5.';
  end if;

  select a.company_id, a.student_id
    into v_company_id, v_student_id
  from public.applications a
  where a.application_id = p_application_id
    and a.status = 'accepted';

  if v_company_id is null then
    raise exception 'Only accepted applications can be evaluated.';
  end if;

  if not public.is_current_company_representative(v_company_id) then
    raise exception 'You can only evaluate applications for your company.';
  end if;

  insert into public.company_student_evaluations (
    application_id,
    company_id,
    student_id,
    technical_skills,
    communication,
    teamwork,
    responsibility,
    overall_score,
    strengths,
    improvement_feedback,
    would_recommend
  ) values (
    p_application_id,
    v_company_id,
    v_student_id,
    p_technical_skills,
    p_communication,
    p_teamwork,
    p_responsibility,
    p_overall_score,
    nullif(trim(p_strengths), ''),
    nullif(trim(p_improvement_feedback), ''),
    p_would_recommend
  )
  on conflict (application_id) do update set
    technical_skills = excluded.technical_skills,
    communication = excluded.communication,
    teamwork = excluded.teamwork,
    responsibility = excluded.responsibility,
    overall_score = excluded.overall_score,
    strengths = excluded.strengths,
    improvement_feedback = excluded.improvement_feedback,
    would_recommend = excluded.would_recommend,
    updated_at = now()
  returning evaluation_id into v_evaluation_id;

  return v_evaluation_id;
end;
$$;

create or replace function public.submit_student_company_evaluation(
  p_application_id uuid,
  p_mentorship_quality integer,
  p_learning_opportunity integer,
  p_work_environment integer,
  p_task_relevance integer,
  p_overall_score integer,
  p_positive_feedback text,
  p_improvement_feedback text,
  p_would_recommend boolean
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_student_id uuid;
  v_evaluation_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentication required.';
  end if;

  if p_mentorship_quality not between 1 and 5
    or p_learning_opportunity not between 1 and 5
    or p_work_environment not between 1 and 5
    or p_task_relevance not between 1 and 5
    or p_overall_score not between 1 and 5 then
    raise exception 'Scores must be between 1 and 5.';
  end if;

  select a.company_id, a.student_id
    into v_company_id, v_student_id
  from public.applications a
  where a.application_id = p_application_id
    and a.status = 'accepted';

  if v_student_id is null then
    raise exception 'Only accepted applications can be evaluated.';
  end if;

  if not public.is_current_student(v_student_id) then
    raise exception 'You can only evaluate your own accepted internship.';
  end if;

  insert into public.student_company_evaluations (
    application_id,
    student_id,
    company_id,
    mentorship_quality,
    learning_opportunity,
    work_environment,
    task_relevance,
    overall_score,
    positive_feedback,
    improvement_feedback,
    would_recommend
  ) values (
    p_application_id,
    v_student_id,
    v_company_id,
    p_mentorship_quality,
    p_learning_opportunity,
    p_work_environment,
    p_task_relevance,
    p_overall_score,
    nullif(trim(p_positive_feedback), ''),
    nullif(trim(p_improvement_feedback), ''),
    p_would_recommend
  )
  on conflict (application_id) do update set
    mentorship_quality = excluded.mentorship_quality,
    learning_opportunity = excluded.learning_opportunity,
    work_environment = excluded.work_environment,
    task_relevance = excluded.task_relevance,
    overall_score = excluded.overall_score,
    positive_feedback = excluded.positive_feedback,
    improvement_feedback = excluded.improvement_feedback,
    would_recommend = excluded.would_recommend,
    updated_at = now()
  returning evaluation_id into v_evaluation_id;

  return v_evaluation_id;
end;
$$;

grant execute on function public.submit_company_student_evaluation(uuid, integer, integer, integer, integer, integer, text, text, boolean) to authenticated;
grant execute on function public.submit_student_company_evaluation(uuid, integer, integer, integer, integer, integer, text, text, boolean) to authenticated;
