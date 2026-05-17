create or replace function public.get_my_profile()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_auth_user_id uuid;
  v_person public.persons%rowtype;
  v_student public.students%rowtype;
  v_rep public.company_representatives%rowtype;
  v_company public.companies%rowtype;
begin
  v_auth_user_id := auth.uid();

  if v_auth_user_id is null then
    raise exception 'Not authenticated';
  end if;

  select *
  into v_person
  from public.persons
  where auth_user_id = v_auth_user_id;

  if not found then
    return jsonb_build_object(
      'person', null,
      'student', null,
      'rep', null,
      'company', null
    );
  end if;

  if v_person.role = 'student' then
    select *
    into v_student
    from public.students
    where person_id = v_person.person_id;

    return jsonb_build_object(
      'person', to_jsonb(v_person),
      'student', to_jsonb(v_student),
      'rep', null,
      'company', null
    );
  end if;

  if v_person.role = 'company_rep' then
    select *
    into v_rep
    from public.company_representatives
    where person_id = v_person.person_id;

    if found and v_rep.company_id is not null then
      select *
      into v_company
      from public.companies
      where company_id = v_rep.company_id;
    end if;

    return jsonb_build_object(
      'person', to_jsonb(v_person),
      'student', null,
      'rep', to_jsonb(v_rep),
      'company', to_jsonb(v_company)
    );
  end if;

  return jsonb_build_object(
    'person', to_jsonb(v_person),
    'student', null,
    'rep', null,
    'company', null
  );
end;
$$;

grant execute on function public.get_my_profile() to authenticated;
