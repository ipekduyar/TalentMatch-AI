-- Supabase CV upload storage and analysis schema

-- 1) Private storage bucket for student CV files
insert into storage.buckets (id, name, public)
values ('student-cvs', 'student-cvs', false)
on conflict (id) do update
set public = excluded.public;

-- 2) Student documents metadata table
create table if not exists public.student_documents (
  document_id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(student_id) on delete cascade,
  file_path text not null,
  file_name text not null,
  file_size bigint,
  mime_type text,
  upload_status text not null default 'uploaded',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint student_documents_upload_status_check
    check (upload_status in ('uploaded', 'analyzing', 'analyzed', 'failed'))
);

-- 3) CV analysis reports table
create table if not exists public.cv_analysis_reports (
  analysis_id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.student_documents(document_id) on delete cascade,
  student_id uuid not null references public.students(student_id) on delete cascade,
  extracted_text text,
  extracted_skills text[] default '{}',
  strengths text[] default '{}',
  weaknesses text[] default '{}',
  suggested_roles text[] default '{}',
  improvement_suggestions text[] default '{}',
  overall_score integer,
  analysis_status text not null default 'pending',
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint cv_analysis_reports_overall_score_check
    check (overall_score is null or (overall_score between 0 and 100)),
  constraint cv_analysis_reports_analysis_status_check
    check (analysis_status in ('pending', 'processing', 'completed', 'failed'))
);

-- 4) Indexes for common lookups
create index if not exists idx_student_documents_student_id
  on public.student_documents(student_id);

create index if not exists idx_cv_analysis_reports_student_id
  on public.cv_analysis_reports(student_id);

create index if not exists idx_cv_analysis_reports_document_id
  on public.cv_analysis_reports(document_id);

create index if not exists idx_cv_analysis_reports_analysis_status
  on public.cv_analysis_reports(analysis_status);
