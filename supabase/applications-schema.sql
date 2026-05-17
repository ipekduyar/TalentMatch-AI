create extension if not exists pgcrypto;

create table if not exists public.applications (
  application_id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(student_id) on delete cascade,
  internship_posting_id uuid not null references public.internship_postings(internship_posting_id) on delete cascade,
  company_id uuid not null references public.companies(company_id) on delete cascade,
  status text not null default 'submitted',
  cover_letter text,
  match_score integer,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint applications_status_check
    check (status in ('submitted', 'reviewed', 'shortlisted', 'rejected', 'accepted')),
  constraint applications_match_score_check
    check (match_score is null or (match_score between 0 and 100)),
  constraint applications_student_posting_unique
    unique(student_id, internship_posting_id)
);

create index if not exists applications_student_id on public.applications(student_id);
create index if not exists applications_company_id on public.applications(company_id);
create index if not exists applications_posting_id on public.applications(internship_posting_id);
create index if not exists applications_status on public.applications(status);

alter table public.applications enable row level security;

drop policy if exists "students_insert_own_applications" on public.applications;
create policy "students_insert_own_applications"
on public.applications
for insert
to authenticated
with check (
  exists (
    select 1
    from public.students s
    join public.persons p on p.person_id = s.person_id
    where s.student_id = applications.student_id
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "students_read_own_applications" on public.applications;
create policy "students_read_own_applications"
on public.applications
for select
to authenticated
using (
  exists (
    select 1
    from public.students s
    join public.persons p on p.person_id = s.person_id
    where s.student_id = applications.student_id
      and p.auth_user_id = auth.uid()
  )
);

drop policy if exists "company_reps_read_company_applications" on public.applications;
create policy "company_reps_read_company_applications"
on public.applications
for select
to authenticated
using (
  exists (
    select 1
    from public.company_representatives cr
    join public.persons p on p.person_id = cr.person_id
    where cr.company_id = applications.company_id
      and p.auth_user_id = auth.uid()
  )
);
