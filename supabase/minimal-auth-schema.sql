create extension if not exists pgcrypto;

create table if not exists persons (
  person_id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  role text not null check (role in ('student', 'company_rep', 'admin')),
  kvkk_consent boolean not null default false,
  terms_consent boolean not null default false,
  consent_given_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists students (
  student_id uuid primary key default gen_random_uuid(),
  person_id uuid unique not null references persons(person_id) on delete cascade,
  university text,
  department text,
  student_number text,
  academic_year int,
  gpa numeric,
  career_goal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists companies (
  company_id uuid primary key default gen_random_uuid(),
  name text unique not null,
  industry text,
  size text,
  website text,
  location text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists company_representatives (
  representative_id uuid primary key default gen_random_uuid(),
  person_id uuid unique not null references persons(person_id) on delete cascade,
  company_id uuid not null references companies(company_id) on delete restrict,
  job_title text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
