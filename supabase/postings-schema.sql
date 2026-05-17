create table if not exists public.internship_postings (
  internship_posting_id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(company_id) on delete cascade,
  representative_id uuid references public.company_representatives(representative_id) on delete set null,
  title text not null,
  description text,
  location text,
  industry text,
  start_date date,
  duration_weeks integer,
  is_paid boolean default false,
  monthly_stipend numeric,
  is_remote boolean default false,
  deadline date,
  status text not null default 'draft',
  required_skills text[] default '{}',
  desired_skills text[] default '{}',
  importance_score integer,
  required_level text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint internship_postings_status_check
    check (status in ('draft', 'pending_review', 'active', 'closed')),
  constraint internship_postings_duration_weeks_check
    check (duration_weeks is null or duration_weeks > 0),
  constraint internship_postings_importance_score_check
    check (importance_score is null or importance_score between 1 and 5)
);

create index if not exists idx_internship_postings_company_id
  on public.internship_postings(company_id);

create index if not exists idx_internship_postings_representative_id
  on public.internship_postings(representative_id);

create index if not exists idx_internship_postings_status
  on public.internship_postings(status);

create index if not exists idx_internship_postings_deadline
  on public.internship_postings(deadline);
