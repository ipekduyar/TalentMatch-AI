create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_metadata jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  created_person_id uuid;
  resolved_company_id uuid;
  trimmed_company_name text := nullif(trim(coalesce(user_metadata ->> 'company_name', '')), '');
begin
  insert into public.persons (
    auth_user_id,
    email,
    first_name,
    last_name,
    role,
    kvkk_consent,
    terms_consent,
    consent_given_at
  )
  values (
    new.id,
    new.email,
    nullif(user_metadata ->> 'first_name', ''),
    nullif(user_metadata ->> 'last_name', ''),
    coalesce(nullif(user_metadata ->> 'role', ''), 'student'),
    coalesce((user_metadata ->> 'kvkk_consent')::boolean, false),
    coalesce((user_metadata ->> 'terms_consent')::boolean, false),
    now()
  )
  on conflict (auth_user_id) do update
  set
    email = excluded.email,
    first_name = excluded.first_name,
    last_name = excluded.last_name,
    role = excluded.role,
    kvkk_consent = excluded.kvkk_consent,
    terms_consent = excluded.terms_consent,
    consent_given_at = excluded.consent_given_at
  returning person_id into created_person_id;

  if coalesce(user_metadata ->> 'role', '') = 'student' then
    insert into public.students (
      person_id,
      university,
      department,
      student_number,
      academic_year,
      gpa,
      career_goal
    )
    values (
      created_person_id,
      nullif(user_metadata ->> 'university', ''),
      nullif(user_metadata ->> 'department', ''),
      nullif(user_metadata ->> 'student_number', ''),
      nullif(user_metadata ->> 'academic_year', '')::smallint,
      nullif(user_metadata ->> 'gpa', '')::numeric,
      nullif(user_metadata ->> 'career_goal', '')
    )
    on conflict (person_id) do nothing;
  elsif coalesce(user_metadata ->> 'role', '') = 'company_rep' then
    if trimmed_company_name is not null then
      insert into public.companies (
        name,
        industry,
        size,
        website,
        location
      )
      values (
        trimmed_company_name,
        nullif(user_metadata ->> 'company_industry', ''),
        coalesce(nullif(user_metadata ->> 'company_size', ''), 'sme')::company_size,
        nullif(user_metadata ->> 'company_website', ''),
        nullif(user_metadata ->> 'company_location', '')
      )
      on conflict (name) do update
      set
        industry = coalesce(excluded.industry, public.companies.industry),
        size = coalesce(excluded.size, public.companies.size),
        website = coalesce(excluded.website, public.companies.website),
        location = coalesce(excluded.location, public.companies.location)
      returning company_id into resolved_company_id;

      insert into public.company_representatives (
        person_id,
        company_id,
        job_title
      )
      values (
        created_person_id,
        resolved_company_id,
        nullif(user_metadata ->> 'representative_job_title', '')
      )
      on conflict (person_id) do update
      set
        company_id = excluded.company_id,
        job_title = excluded.job_title;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

grant usage on schema public to anon, authenticated;
grant select on public.persons to authenticated;
grant select on public.students to authenticated;
grant select on public.companies to authenticated;
grant select on public.company_representatives to authenticated;
