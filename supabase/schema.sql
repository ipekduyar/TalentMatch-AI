create extension if not exists "pgcrypto";

create table if not exists persons (
  person_id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  first_name text not null,
  last_name text not null,
  email text not null unique,
  role text not null check (role in ('student','company_rep','admin')),
  kvkk_consent boolean not null default false,
  kvkk_consent_at timestamptz,
  is_active boolean not null default true,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists students (
  student_id uuid primary key default gen_random_uuid(),
  person_id uuid not null unique references persons(person_id) on delete cascade,
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

create table if not exists companies (
  company_id uuid primary key default gen_random_uuid(),
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
create table if not exists company_representatives (
  rep_id uuid primary key default gen_random_uuid(),
  person_id uuid not null unique references persons(person_id) on delete cascade,
  company_id uuid not null references companies(company_id) on delete cascade,
  job_title text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists skills (
  skill_id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null check (category in ('technical','soft','domain','language')),
  description text,
  created_at timestamptz not null default now()
);
create table if not exists student_skills (
  student_skill_id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(student_id) on delete cascade,
  skill_id uuid not null references skills(skill_id) on delete cascade,
  proficiency int not null check (proficiency between 1 and 5),
  verified boolean not null default false,
  added_at timestamptz not null default now(),
  unique(student_id, skill_id)
);

create table if not exists internship_postings (
  posting_id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(company_id) on delete cascade,
  rep_id uuid not null references company_representatives(rep_id) on delete cascade,
  title text not null,
  description text not null,
  location text,
  industry text,
  start_date date,
  duration_weeks int check (duration_weeks > 0),
  is_paid boolean not null default false,
  monthly_stipend_try numeric(12,2),
  is_remote boolean not null default false,
  status text not null check (status in ('active','closed','draft','pending_review')),
  deadline date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists posting_skills (
  posting_skill_id uuid primary key default gen_random_uuid(),
  posting_id uuid not null references internship_postings(posting_id) on delete cascade,
  skill_id uuid not null references skills(skill_id) on delete cascade,
  is_required boolean not null default true,
  importance_score int not null check (importance_score between 1 and 5),
  required_level int not null check (required_level between 1 and 5),
  unique(posting_id, skill_id)
);
create table if not exists applications (
  application_id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(student_id) on delete cascade,
  posting_id uuid not null references internship_postings(posting_id) on delete cascade,
  match_score numeric(5,2) not null check (match_score between 0 and 100),
  status text not null check (status in ('pending','reviewed','shortlisted','accepted','rejected','withdrawn','completed')),
  cover_note text,
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(student_id, posting_id)
);

create table if not exists skill_gap_reports (
  report_id uuid primary key default gen_random_uuid(),
  student_id uuid not null references students(student_id) on delete cascade,
  posting_id uuid references internship_postings(posting_id) on delete set null,
  summary_text text not null,
  percentile_rank numeric(5,2) check (percentile_rank between 0 and 100),
  generated_at timestamptz not null default now()
);
create table if not exists skill_gap_details (
  gap_detail_id uuid primary key default gen_random_uuid(),
  report_id uuid not null references skill_gap_reports(report_id) on delete cascade,
  skill_id uuid not null references skills(skill_id) on delete cascade,
  student_level int not null check (student_level between 0 and 5),
  required_level int not null check (required_level between 1 and 5),
  gap_score int not null,
  urgency text not null check (urgency in ('critical','moderate','low'))
);
create table if not exists learning_resources (
  resource_id uuid primary key default gen_random_uuid(),
  skill_id uuid not null references skills(skill_id) on delete cascade,
  title text not null,
  provider text not null,
  url text not null,
  duration_hours int not null check (duration_hours > 0),
  cost_type text not null check (cost_type in ('free','paid','subscription')),
  cost_amount_try numeric(12,2),
  avg_rating numeric(3,2) not null check (avg_rating between 1 and 5),
  level text not null check (level in ('beginner','intermediate','advanced')),
  created_at timestamptz not null default now()
);
create table if not exists internship_evaluations (
  evaluation_id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(application_id) on delete cascade,
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
create table if not exists notifications (
  notification_id uuid primary key default gen_random_uuid(),
  person_id uuid not null references persons(person_id) on delete cascade,
  type text not null check (type in ('new_match','status_update','deadline','skill_alert','new_message','evaluation_request','new_application')),
  title text not null,
  message text not null,
  link_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
create table if not exists conversations (
  conversation_id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(application_id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists messages (
  message_id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(conversation_id) on delete cascade,
  sender_person_id uuid not null references persons(person_id) on delete cascade,
  content text not null,
  sent_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists idx_students_person_id on students(person_id);
create index if not exists idx_reps_company_id on company_representatives(company_id);
create index if not exists idx_postings_company_id on internship_postings(company_id);
create index if not exists idx_postings_status on internship_postings(status);
create index if not exists idx_apps_student_id on applications(student_id);
create index if not exists idx_apps_posting_id on applications(posting_id);
create index if not exists idx_skill_gap_student_id on skill_gap_reports(student_id);
create index if not exists idx_notifications_person_id on notifications(person_id);
create index if not exists idx_messages_conversation_id on messages(conversation_id);
