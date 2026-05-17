-- Production-safe RLS refactor for Supabase.
-- Important: Supabase Auth users must be mapped to public.persons.auth_user_id.
-- Mock frontend users (without a matching auth.uid() mapping) will not bypass RLS.

-- Enable RLS on all protected tables.
alter table public.persons enable row level security;
alter table public.students enable row level security;
alter table public.companies enable row level security;
alter table public.company_representatives enable row level security;
alter table public.skills enable row level security;
alter table public.student_skills enable row level security;
alter table public.internship_postings enable row level security;
alter table public.posting_skills enable row level security;
alter table public.applications enable row level security;
alter table public.skill_gap_reports enable row level security;
alter table public.skill_gap_details enable row level security;
alter table public.learning_resources enable row level security;
alter table public.internship_evaluations enable row level security;
alter table public.notifications enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.student_documents enable row level security;

-- Remove prior policies to avoid recursive policy checks.
drop policy if exists persons_self_or_admin_select on public.persons;
drop policy if exists persons_self_or_admin_update on public.persons;
drop policy if exists students_self_or_admin_select on public.students;
drop policy if exists students_self_or_admin_update on public.students;
drop policy if exists companies_read_all_auth on public.companies;
drop policy if exists admin_manage_all_companies on public.companies;
drop policy if exists company_reps_self_or_admin on public.company_representatives;
drop policy if exists postings_students_active on public.internship_postings;
drop policy if exists postings_company_rep_manage on public.internship_postings;
drop policy if exists applications_student_manage on public.applications;
drop policy if exists applications_company_rep_view on public.applications;
drop policy if exists conversations_own_or_company_or_admin on public.conversations;
drop policy if exists admin_manage_conversations on public.conversations;
drop policy if exists messages_own_conversation_or_admin on public.messages;
drop policy if exists messages_insert_participant_only on public.messages;
drop policy if exists admin_manage_messages on public.messages;
drop policy if exists notifications_own_or_admin on public.notifications;
drop policy if exists admin_manage_notifications on public.notifications;
drop policy if exists student_docs_own_or_admin on public.student_documents;
drop policy if exists student_docs_own_or_admin_write on public.student_documents;
drop policy if exists skill_gap_reports_own_or_admin on public.skill_gap_reports;
drop policy if exists admin_manage_skill_gap_reports on public.skill_gap_reports;
drop policy if exists skill_gap_details_own_or_admin on public.skill_gap_details;
drop policy if exists admin_manage_skill_gap_details on public.skill_gap_details;
drop policy if exists evaluations_participant_or_admin on public.internship_evaluations;
drop policy if exists admin_manage_evaluations on public.internship_evaluations;

-- Non-recursive helper functions.
create or replace function public.current_person_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.person_id
  from public.persons p
  where p.auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select p.role::text
  from public.persons p
  where p.auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select cr.company_id
  from public.company_representatives cr
  join public.persons p on p.person_id = cr.person_id
  where p.auth_user_id = auth.uid()
  limit 1
$$;

create or replace function public.is_admin()
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
  )
$$;

create or replace function public.is_company_rep_for_company(company_uuid uuid)
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
      and p.role = 'company_rep'
      and cr.company_id = company_uuid
  )
$$;

create or replace function public.is_student_owner(student_uuid uuid)
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
      and p.role = 'student'
      and s.student_id = student_uuid
  )
$$;

-- persons
create policy persons_self_or_admin_select on public.persons
for select using (public.is_admin() or person_id = public.current_person_id());

create policy persons_self_or_admin_update on public.persons
for update using (public.is_admin() or person_id = public.current_person_id())
with check (public.is_admin() or person_id = public.current_person_id());

-- students
create policy students_self_or_admin_select on public.students
for select using (public.is_admin() or public.is_student_owner(student_id));

create policy students_self_or_admin_update on public.students
for update using (public.is_admin() or public.is_student_owner(student_id))
with check (public.is_admin() or public.is_student_owner(student_id));

-- companies and company representatives
create policy companies_select_auth on public.companies
for select using (auth.uid() is not null);

create policy companies_manage_admin on public.companies
for all using (public.is_admin())
with check (public.is_admin());

create policy company_reps_select_self_or_admin on public.company_representatives
for select using (public.is_admin() or person_id = public.current_person_id());

create policy company_reps_manage_admin on public.company_representatives
for all using (public.is_admin())
with check (public.is_admin());

-- internship postings
create policy postings_select_active_auth on public.internship_postings
for select using (
  public.is_admin()
  or auth.uid() is null and status = 'active'
  or auth.uid() is not null and (
    status = 'active'
    or public.is_company_rep_for_company(company_id)
  )
);

create policy postings_insert_company_rep on public.internship_postings
for insert with check (
  public.is_admin()
  or (
    auth.uid() is not null
    and public.current_user_role() = 'company_rep'
    and company_id = public.current_company_id()
  )
);

create policy postings_update_company_rep on public.internship_postings
for update using (
  public.is_admin()
  or (
    auth.uid() is not null
    and public.current_user_role() = 'company_rep'
    and public.is_company_rep_for_company(company_id)
  )
)
with check (
  public.is_admin()
  or (
    auth.uid() is not null
    and public.current_user_role() = 'company_rep'
    and company_id = public.current_company_id()
  )
);

create policy postings_delete_admin_or_own_draft on public.internship_postings
for delete using (
  public.is_admin()
  or (
    auth.uid() is not null
    and public.current_user_role() = 'company_rep'
    and status = 'draft'
    and public.is_company_rep_for_company(company_id)
  )
);

-- applications
create policy applications_student_manage on public.applications
for all using (
  public.is_admin()
  or public.is_student_owner(student_id)
)
with check (
  public.is_admin()
  or public.is_student_owner(student_id)
);

create policy applications_company_rep_select on public.applications
for select using (
  public.is_admin()
  or exists (
    select 1
    from public.internship_postings ip
    where ip.posting_id = applications.posting_id
      and public.is_company_rep_for_company(ip.company_id)
  )
);

-- conversations/messages scoped to related application participants
create policy conversations_select_participant_or_admin on public.conversations
for select using (
  public.is_admin()
  or exists (
    select 1
    from public.applications a
    join public.internship_postings ip on ip.posting_id = a.posting_id
    where a.application_id = conversations.application_id
      and (
        public.is_student_owner(a.student_id)
        or public.is_company_rep_for_company(ip.company_id)
      )
  )
);

create policy conversations_insert_participant_or_admin on public.conversations
for insert with check (
  public.is_admin()
  or exists (
    select 1
    from public.applications a
    join public.internship_postings ip on ip.posting_id = a.posting_id
    where a.application_id = conversations.application_id
      and (
        public.is_student_owner(a.student_id)
        or public.is_company_rep_for_company(ip.company_id)
      )
  )
);

create policy messages_select_participant_or_admin on public.messages
for select using (
  public.is_admin()
  or exists (
    select 1
    from public.conversations c
    join public.applications a on a.application_id = c.application_id
    join public.internship_postings ip on ip.posting_id = a.posting_id
    where c.conversation_id = messages.conversation_id
      and (
        public.is_student_owner(a.student_id)
        or public.is_company_rep_for_company(ip.company_id)
      )
  )
);

create policy messages_insert_participant_only on public.messages
for insert with check (
  public.is_admin()
  or (
    sender_person_id = public.current_person_id()
    and exists (
      select 1
      from public.conversations c
      join public.applications a on a.application_id = c.application_id
      join public.internship_postings ip on ip.posting_id = a.posting_id
      where c.conversation_id = messages.conversation_id
        and (
          public.is_student_owner(a.student_id)
          or public.is_company_rep_for_company(ip.company_id)
        )
    )
  )
);

-- notifications/documents/skill-gaps/evaluations
create policy notifications_select_own_or_admin on public.notifications
for select using (public.is_admin() or person_id = public.current_person_id());

create policy notifications_manage_admin on public.notifications
for all using (public.is_admin())
with check (public.is_admin());

create policy student_docs_select_own_or_admin on public.student_documents
for select using (public.is_admin() or public.is_student_owner(student_id));

create policy student_docs_write_own_or_admin on public.student_documents
for all using (public.is_admin() or public.is_student_owner(student_id))
with check (public.is_admin() or public.is_student_owner(student_id));

create policy skill_gap_reports_select_own_or_admin on public.skill_gap_reports
for select using (public.is_admin() or public.is_student_owner(student_id));

create policy skill_gap_reports_manage_admin on public.skill_gap_reports
for all using (public.is_admin())
with check (public.is_admin());

create policy skill_gap_details_select_own_or_admin on public.skill_gap_details
for select using (
  public.is_admin()
  or exists (
    select 1
    from public.skill_gap_reports sgr
    where sgr.report_id = skill_gap_details.report_id
      and public.is_student_owner(sgr.student_id)
  )
);

create policy skill_gap_details_manage_admin on public.skill_gap_details
for all using (public.is_admin())
with check (public.is_admin());

create policy evaluations_select_participant_or_admin on public.internship_evaluations
for select using (
  public.is_admin()
  or exists (
    select 1
    from public.applications a
    join public.internship_postings ip on ip.posting_id = a.posting_id
    where a.application_id = internship_evaluations.application_id
      and (
        public.is_student_owner(a.student_id)
        or public.is_company_rep_for_company(ip.company_id)
      )
  )
);

create policy evaluations_manage_admin on public.internship_evaluations
for all using (public.is_admin())
with check (public.is_admin());

-- existing metadata table access
create policy skills_read_all_auth on public.skills
for select using (auth.uid() is not null);
create policy admin_manage_all_skills on public.skills
for all using (public.is_admin()) with check (public.is_admin());

create policy posting_skills_read_all_auth on public.posting_skills
for select using (auth.uid() is not null);
create policy admin_manage_posting_skills on public.posting_skills
for all using (public.is_admin()) with check (public.is_admin());

create policy learning_resources_read_all_auth on public.learning_resources
for select using (auth.uid() is not null);
create policy admin_manage_learning_resources on public.learning_resources
for all using (public.is_admin()) with check (public.is_admin());

create policy student_skills_self_or_admin_select on public.student_skills
for select using (
  public.is_admin() or public.is_student_owner(student_id)
);
create policy student_skills_self_or_admin_write on public.student_skills
for all using (
  public.is_admin() or public.is_student_owner(student_id)
)
with check (
  public.is_admin() or public.is_student_owner(student_id)
);
