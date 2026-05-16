-- TalentMatch AI Supabase schema
create extension if not exists pgcrypto;

create table if not exists public.persons (
  person_id uuid primary key,
  auth_user_id uuid unique,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  role text not null check (role in ('student', 'company_rep', 'admin')),
  kvkk_consent boolean not null default false,
  kvkk_consent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_active boolean not null default true,
  avatar_url text
);

create table if not exists public.students (
  student_id uuid primary key,
  person_id uuid not null unique references public.persons(person_id) on delete cascade,
  university text not null,
  department text not null,
  student_number text not null unique,
  gpa numeric(3,2) check (gpa between 0 and 4),
  academic_year int not null check (academic_year between 1 and 5),
  graduation_date date,
  career_goal text,
  cv_file_path text,
  cv_parsed_text text,
  is_edu_verified boolean not null default false,
  profile_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.companies (
  company_id uuid primary key,
  name text not null unique,
  industry text not null,
  size text check (size in ('startup','sme','enterprise')),
  website text,
  location text,
  description text,
  logo_url text,
  is_premium boolean not null default false,
  is_approved boolean not null default false,
  avg_evaluation_score numeric(3,2) check (avg_evaluation_score between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_representatives (
  rep_id uuid primary key,
  person_id uuid not null unique references public.persons(person_id) on delete cascade,
  company_id uuid not null references public.companies(company_id) on delete cascade,
  job_title text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skills (
  skill_id uuid primary key,
  name text not null unique,
  category text not null check (category in ('technical','soft','domain','language')),
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.student_skills (
  student_skill_id uuid primary key,
  student_id uuid not null references public.students(student_id) on delete cascade,
  skill_id uuid not null references public.skills(skill_id) on delete cascade,
  proficiency int not null check (proficiency between 1 and 5),
  verified boolean not null default false,
  added_at timestamptz not null default now(),
  unique (student_id, skill_id)
);

create table if not exists public.internship_postings (
  posting_id uuid primary key,
  company_id uuid not null references public.companies(company_id) on delete cascade,
  rep_id uuid not null references public.company_representatives(rep_id) on delete restrict,
  title text not null,
  description text not null,
  location text,
  industry text,
  start_date date,
  duration_weeks int check (duration_weeks is null or duration_weeks > 0),
  is_paid boolean not null default false,
  monthly_stipend_try numeric(10,2) check (monthly_stipend_try is null or monthly_stipend_try >= 0),
  is_remote boolean not null default false,
  status text not null check (status in ('active','closed','draft','pending_review')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deadline date not null
);

create table if not exists public.posting_skills (
  posting_skill_id uuid primary key,
  posting_id uuid not null references public.internship_postings(posting_id) on delete cascade,
  skill_id uuid not null references public.skills(skill_id) on delete cascade,
  is_required boolean not null default true,
  importance_score int not null check (importance_score between 1 and 5),
  required_level int not null check (required_level between 1 and 5),
  unique (posting_id, skill_id)
);

create table if not exists public.applications (
  application_id uuid primary key,
  student_id uuid not null references public.students(student_id) on delete cascade,
  posting_id uuid not null references public.internship_postings(posting_id) on delete cascade,
  match_score numeric(5,2) not null check (match_score between 0 and 100),
  status text not null check (status in ('pending','reviewed','shortlisted','accepted','rejected','withdrawn','completed')),
  cover_note text,
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, posting_id)
);

create table if not exists public.skill_gap_reports (
  report_id uuid primary key,
  student_id uuid not null references public.students(student_id) on delete cascade,
  posting_id uuid references public.internship_postings(posting_id) on delete set null,
  generated_at timestamptz not null default now(),
  summary_text text not null,
  percentile_rank numeric(5,2) not null check (percentile_rank between 0 and 100)
);

create table if not exists public.skill_gap_details (
  gap_detail_id uuid primary key,
  report_id uuid not null references public.skill_gap_reports(report_id) on delete cascade,
  skill_id uuid not null references public.skills(skill_id) on delete cascade,
  student_level int not null check (student_level between 0 and 5),
  required_level int not null check (required_level between 1 and 5),
  gap_score numeric(4,2) not null,
  urgency text not null check (urgency in ('critical','moderate','low'))
);

create table if not exists public.learning_resources (
  resource_id uuid primary key,
  skill_id uuid not null references public.skills(skill_id) on delete cascade,
  title text not null,
  provider text not null check (provider in ('Coursera','Udemy','edX','freeCodeCamp','Khan Academy','ITU','Other')),
  url text not null,
  duration_hours numeric(6,2) not null check (duration_hours > 0),
  cost_type text not null check (cost_type in ('free','paid','subscription')),
  cost_amount_try numeric(10,2) check (cost_amount_try is null or cost_amount_try >= 0),
  avg_rating numeric(3,2) not null check (avg_rating between 1 and 5),
  level text not null check (level in ('beginner','intermediate','advanced')),
  created_at timestamptz not null default now()
);

create table if not exists public.internship_evaluations (
  evaluation_id uuid primary key,
  application_id uuid not null references public.applications(application_id) on delete cascade,
  evaluator_type text not null check (evaluator_type in ('student','company')),
  mentorship_q int check (mentorship_q between 1 and 5),
  task_relevance int check (task_relevance between 1 and 5),
  tech_skill_q int check (tech_skill_q between 1 and 5),
  comm_skill_q int check (comm_skill_q between 1 and 5),
  professionalism_q int check (professionalism_q between 1 and 5),
  overall_score numeric(3,2) not null check (overall_score between 1 and 5),
  comments text,
  submitted_at timestamptz not null default now(),
  is_anonymous boolean not null default false
);

create table if not exists public.notifications (
  notification_id uuid primary key,
  person_id uuid not null references public.persons(person_id) on delete cascade,
  type text not null check (type in ('new_match','status_update','deadline','skill_alert','new_message','evaluation_request','new_application')),
  title text not null,
  message text not null,
  link_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.conversations (
  conversation_id uuid primary key,
  application_id uuid not null unique references public.applications(application_id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.messages (
  message_id uuid primary key,
  conversation_id uuid not null references public.conversations(conversation_id) on delete cascade,
  sender_person_id uuid not null references public.persons(person_id) on delete cascade,
  content text not null,
  sent_at timestamptz not null default now(),
  read_at timestamptz
);

create table if not exists public.student_documents (
  document_id uuid primary key,
  student_id uuid not null references public.students(student_id) on delete cascade,
  doc_type text not null check (doc_type in ('cv','transcript','certificate','portfolio','other')),
  file_name text not null,
  file_path text not null,
  mime_type text,
  file_size_bytes bigint check (file_size_bytes is null or file_size_bytes >= 0),
  uploaded_at timestamptz not null default now(),
  parsed_text text
);

create index if not exists idx_persons_auth_user_id on public.persons(auth_user_id);
create index if not exists idx_persons_role on public.persons(role);
create index if not exists idx_students_person_id on public.students(person_id);
create index if not exists idx_company_reps_person_id on public.company_representatives(person_id);
create index if not exists idx_company_reps_company_id on public.company_representatives(company_id);
create index if not exists idx_student_skills_student_id on public.student_skills(student_id);
create index if not exists idx_student_skills_skill_id on public.student_skills(skill_id);
create index if not exists idx_postings_company_id on public.internship_postings(company_id);
create index if not exists idx_postings_rep_id on public.internship_postings(rep_id);
create index if not exists idx_postings_status on public.internship_postings(status);
create index if not exists idx_postings_deadline on public.internship_postings(deadline);
create index if not exists idx_posting_skills_posting_id on public.posting_skills(posting_id);
create index if not exists idx_applications_student_id on public.applications(student_id);
create index if not exists idx_applications_posting_id on public.applications(posting_id);
create index if not exists idx_applications_status on public.applications(status);
create index if not exists idx_skill_gap_reports_student_id on public.skill_gap_reports(student_id);
create index if not exists idx_skill_gap_reports_posting_id on public.skill_gap_reports(posting_id);
create index if not exists idx_skill_gap_details_report_id on public.skill_gap_details(report_id);
create index if not exists idx_notifications_person_id on public.notifications(person_id);
create index if not exists idx_messages_conversation_id on public.messages(conversation_id);
create index if not exists idx_messages_sender_person_id on public.messages(sender_person_id);
create index if not exists idx_student_documents_student_id on public.student_documents(student_id);
