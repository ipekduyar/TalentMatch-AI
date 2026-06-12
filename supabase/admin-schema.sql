-- TalentMatch AI admin dashboard RPCs
-- Run this file in Supabase SQL Editor after the core auth/profile, posting, application, CV, and messaging schemas.
-- To promote an existing account manually, replace the placeholder email:
-- update public.persons
-- set role = 'admin'
-- where email = 'ADMIN_EMAIL_HERE';

alter table public.companies
  add column if not exists is_verified boolean not null default false;

alter table public.companies
  add column if not exists verified_at timestamptz null;

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.persons p
    where p.auth_user_id = auth.uid()
      and p.role = 'admin'
  );
$$;

revoke all on function public.is_current_user_admin() from public;
grant execute on function public.is_current_user_admin() to authenticated;

create or replace function public.get_admin_users()
returns table (
  person_id uuid,
  first_name text,
  last_name text,
  email text,
  role text,
  created_at timestamptz,
  kvkk_consent boolean,
  terms_consent boolean,
  student_id uuid,
  university text,
  department text,
  company_id uuid,
  company_name text,
  representative_id uuid,
  representative_job_title text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Unauthorized: admin access required';
  end if;

  return query
  select
    p.person_id,
    p.first_name,
    p.last_name,
    p.email,
    p.role,
    p.created_at,
    p.kvkk_consent,
    p.terms_consent,
    s.student_id,
    s.university,
    s.department,
    c.company_id,
    c.name as company_name,
    cr.representative_id,
    cr.job_title as representative_job_title
  from public.persons p
  left join public.students s on s.person_id = p.person_id
  left join public.company_representatives cr on cr.person_id = p.person_id
  left join public.companies c on c.company_id = cr.company_id
  order by p.created_at desc;
end;
$$;

revoke all on function public.get_admin_users() from public;
grant execute on function public.get_admin_users() to authenticated;

create or replace function public.get_admin_companies()
returns table (
  company_id uuid,
  name text,
  industry text,
  size text,
  location text,
  is_verified boolean,
  verified_at timestamptz,
  representative_name text,
  representative_email text,
  active_posting_count bigint,
  application_count bigint,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Unauthorized: admin access required';
  end if;

  return query
  with representative_rollup as (
    select
      cr.company_id,
      string_agg(trim(concat_ws(' ', p.first_name, p.last_name)), ', ' order by p.created_at desc) as representative_name,
      string_agg(p.email, ', ' order by p.created_at desc) as representative_email
    from public.company_representatives cr
    join public.persons p on p.person_id = cr.person_id
    group by cr.company_id
  ), posting_counts as (
    select
      ip.company_id,
      count(*) filter (where ip.status = 'active') as active_posting_count
    from public.internship_postings ip
    group by ip.company_id
  ), application_counts as (
    select
      a.company_id,
      count(*) as application_count
    from public.applications a
    group by a.company_id
  )
  select
    c.company_id,
    c.name,
    c.industry,
    c.size,
    c.location,
    c.is_verified,
    c.verified_at,
    rr.representative_name,
    rr.representative_email,
    coalesce(pc.active_posting_count, 0)::bigint,
    coalesce(ac.application_count, 0)::bigint,
    c.created_at
  from public.companies c
  left join representative_rollup rr on rr.company_id = c.company_id
  left join posting_counts pc on pc.company_id = c.company_id
  left join application_counts ac on ac.company_id = c.company_id
  order by c.created_at desc;
end;
$$;

revoke all on function public.get_admin_companies() from public;
grant execute on function public.get_admin_companies() to authenticated;

create or replace function public.get_admin_postings()
returns table (
  internship_posting_id uuid,
  title text,
  company_name text,
  industry text,
  location text,
  status text,
  deadline date,
  application_count bigint,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Unauthorized: admin access required';
  end if;

  return query
  select
    ip.internship_posting_id,
    ip.title,
    c.name as company_name,
    ip.industry,
    ip.location,
    ip.status,
    ip.deadline,
    count(a.application_id)::bigint as application_count,
    ip.created_at
  from public.internship_postings ip
  join public.companies c on c.company_id = ip.company_id
  left join public.applications a on a.internship_posting_id = ip.internship_posting_id
  group by ip.internship_posting_id, ip.title, c.name, ip.industry, ip.location, ip.status, ip.deadline, ip.created_at
  order by ip.created_at desc;
end;
$$;

revoke all on function public.get_admin_postings() from public;
grant execute on function public.get_admin_postings() to authenticated;

create or replace function public.get_admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_total_students bigint := 0;
  v_total_companies bigint := 0;
  v_total_company_representatives bigint := 0;
  v_total_active_postings bigint := 0;
  v_total_postings bigint := 0;
  v_total_applications bigint := 0;
  v_accepted_applications bigint := 0;
  v_interview_applications bigint := 0;
  v_total_messages bigint := 0;
  v_total_cv_analyses bigint := 0;
  v_average_match_score numeric := null;
  v_pending_company_verifications bigint := 0;
  v_applications_by_status jsonb := '{}'::jsonb;
  v_newest_users jsonb := '[]'::jsonb;
  v_newest_companies jsonb := '[]'::jsonb;
  v_newest_postings jsonb := '[]'::jsonb;
begin
  if not public.is_current_user_admin() then
    raise exception 'Unauthorized: admin access required';
  end if;

  select count(*) into v_total_students from public.students;
  select count(*) into v_total_companies from public.companies;
  select count(*) into v_total_company_representatives from public.company_representatives;
  select count(*) into v_total_active_postings from public.internship_postings where status = 'active';
  select count(*) into v_total_postings from public.internship_postings;
  select count(*) into v_total_applications from public.applications;
  select count(*) into v_accepted_applications from public.applications where status = 'accepted';
  select count(*) into v_interview_applications from public.applications where status = 'interview';
  select avg(match_score) into v_average_match_score from public.applications where match_score is not null;
  select count(*) into v_pending_company_verifications from public.companies where is_verified = false;

  select coalesce(jsonb_object_agg(status_counts.status, status_counts.total), '{}'::jsonb)
  into v_applications_by_status
  from (
    select a.status, count(*) as total
    from public.applications a
    group by a.status
    order by a.status
  ) status_counts;

  select coalesce(jsonb_agg(to_jsonb(u)), '[]'::jsonb)
  into v_newest_users
  from (select * from public.get_admin_users() limit 5) u;

  select coalesce(jsonb_agg(to_jsonb(c)), '[]'::jsonb)
  into v_newest_companies
  from (select * from public.get_admin_companies() limit 5) c;

  select coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb)
  into v_newest_postings
  from (select * from public.get_admin_postings() limit 5) p;

  if to_regclass('public.messages') is not null then
    execute 'select count(*) from public.messages' into v_total_messages;
  end if;

  if to_regclass('public.cv_analysis_reports') is not null then
    execute 'select count(*) from public.cv_analysis_reports' into v_total_cv_analyses;
  end if;

  return jsonb_build_object(
    'total_students', v_total_students,
    'total_companies', v_total_companies,
    'total_company_representatives', v_total_company_representatives,
    'total_active_postings', v_total_active_postings,
    'total_postings', v_total_postings,
    'total_applications', v_total_applications,
    'accepted_applications', v_accepted_applications,
    'interview_applications', v_interview_applications,
    'total_messages', v_total_messages,
    'total_cv_analyses', v_total_cv_analyses,
    'average_match_score', v_average_match_score,
    'pending_company_verifications', v_pending_company_verifications,
    'applications_by_status', v_applications_by_status,
    'newest_users', v_newest_users,
    'newest_companies', v_newest_companies,
    'newest_postings', v_newest_postings
  );
end;
$$;

revoke all on function public.get_admin_dashboard_stats() from public;
grant execute on function public.get_admin_dashboard_stats() to authenticated;

create or replace function public.admin_update_company_verification(
  p_company_id uuid,
  p_verified boolean
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Unauthorized: admin access required';
  end if;

  update public.companies
  set
    is_verified = p_verified,
    verified_at = case when p_verified then now() else null end,
    updated_at = now()
  where company_id = p_company_id;

  if not found then
    raise exception 'Company not found';
  end if;
end;
$$;

revoke all on function public.admin_update_company_verification(uuid, boolean) from public;
grant execute on function public.admin_update_company_verification(uuid, boolean) to authenticated;

create or replace function public.admin_update_posting_status(
  p_posting_id uuid,
  p_status text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_current_user_admin() then
    raise exception 'Unauthorized: admin access required';
  end if;

  if p_status not in ('active', 'draft', 'pending_review', 'closed') then
    raise exception 'Invalid posting status: %', p_status;
  end if;

  update public.internship_postings
  set status = p_status,
      updated_at = now()
  where internship_posting_id = p_posting_id;

  if not found then
    raise exception 'Posting not found';
  end if;
end;
$$;

revoke all on function public.admin_update_posting_status(uuid, text) from public;
grant execute on function public.admin_update_posting_status(uuid, text) to authenticated;
