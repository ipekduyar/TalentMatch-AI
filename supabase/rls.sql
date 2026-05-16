-- Enable RLS
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

create or replace function public.current_person_id() returns uuid language sql stable as $$
  select person_id from public.persons where auth_user_id = auth.uid()
$$;

create or replace function public.current_role() returns text language sql stable as $$
  select role from public.persons where auth_user_id = auth.uid()
$$;

create or replace function public.current_student_id() returns uuid language sql stable as $$
  select s.student_id from public.students s join public.persons p on p.person_id = s.person_id where p.auth_user_id = auth.uid()
$$;

create or replace function public.current_company_id() returns uuid language sql stable as $$
  select cr.company_id from public.company_representatives cr join public.persons p on p.person_id = cr.person_id where p.auth_user_id = auth.uid()
$$;

-- persons
create policy persons_self_or_admin_select on public.persons
for select using (person_id = public.current_person_id() or public.current_role() = 'admin');
create policy persons_self_or_admin_update on public.persons
for update using (person_id = public.current_person_id() or public.current_role() = 'admin')
with check (person_id = public.current_person_id() or public.current_role() = 'admin');

-- students
create policy students_self_or_admin_select on public.students
for select using (student_id = public.current_student_id() or public.current_role() = 'admin');
create policy students_self_or_admin_update on public.students
for update using (student_id = public.current_student_id() or public.current_role() = 'admin')
with check (student_id = public.current_student_id() or public.current_role() = 'admin');

-- public metadata tables
create policy companies_read_all_auth on public.companies for select using (auth.uid() is not null);
create policy skills_read_all_auth on public.skills for select using (auth.uid() is not null);
create policy posting_skills_read_all_auth on public.posting_skills for select using (auth.uid() is not null);
create policy learning_resources_read_all_auth on public.learning_resources for select using (auth.uid() is not null);

-- company reps table
create policy company_reps_self_or_admin on public.company_representatives
for select using (person_id = public.current_person_id() or public.current_role() = 'admin');

-- student_skills
create policy student_skills_self_or_admin_select on public.student_skills
for select using (student_id = public.current_student_id() or public.current_role() = 'admin');
create policy student_skills_self_or_admin_write on public.student_skills
for all using (student_id = public.current_student_id() or public.current_role() = 'admin')
with check (student_id = public.current_student_id() or public.current_role() = 'admin');

-- postings
create policy postings_students_active on public.internship_postings
for select using (
  public.current_role() = 'admin'
  or (public.current_role() = 'student' and status = 'active')
  or (public.current_role() = 'company_rep' and company_id = public.current_company_id())
);
create policy postings_company_rep_manage on public.internship_postings
for all using (public.current_role() = 'admin' or (public.current_role() = 'company_rep' and company_id = public.current_company_id()))
with check (public.current_role() = 'admin' or (public.current_role() = 'company_rep' and company_id = public.current_company_id()));

-- applications
create policy applications_student_manage on public.applications
for all using (public.current_role() = 'admin' or (public.current_role() = 'student' and student_id = public.current_student_id()))
with check (public.current_role() = 'admin' or (public.current_role() = 'student' and student_id = public.current_student_id()));

create policy applications_company_rep_view on public.applications
for select using (
  public.current_role() = 'admin' or (
    public.current_role() = 'company_rep'
    and exists (
      select 1 from public.internship_postings ip
      where ip.posting_id = applications.posting_id
      and ip.company_id = public.current_company_id()
    )
  )
);

-- skill gaps
create policy skill_gap_reports_own_or_admin on public.skill_gap_reports
for select using (public.current_role() = 'admin' or student_id = public.current_student_id());
create policy skill_gap_details_own_or_admin on public.skill_gap_details
for select using (
  public.current_role() = 'admin' or exists (
    select 1 from public.skill_gap_reports sgr
    where sgr.report_id = skill_gap_details.report_id
    and sgr.student_id = public.current_student_id()
  )
);

-- docs and notifications
create policy notifications_own_or_admin on public.notifications
for select using (public.current_role() = 'admin' or person_id = public.current_person_id());
create policy student_docs_own_or_admin on public.student_documents
for select using (public.current_role() = 'admin' or student_id = public.current_student_id());
create policy student_docs_own_or_admin_write on public.student_documents
for all using (public.current_role() = 'admin' or student_id = public.current_student_id())
with check (public.current_role() = 'admin' or student_id = public.current_student_id());

-- conversation/message access through related applications
create policy conversations_own_or_company_or_admin on public.conversations
for select using (
  public.current_role() = 'admin' or exists (
    select 1 from public.applications a
    join public.internship_postings ip on ip.posting_id = a.posting_id
    where a.application_id = conversations.application_id
      and (a.student_id = public.current_student_id() or ip.company_id = public.current_company_id())
  )
);

create policy messages_own_conversation_or_admin on public.messages
for select using (
  public.current_role() = 'admin' or exists (
    select 1
    from public.conversations c
    join public.applications a on a.application_id = c.application_id
    join public.internship_postings ip on ip.posting_id = a.posting_id
    where c.conversation_id = messages.conversation_id
      and (a.student_id = public.current_student_id() or ip.company_id = public.current_company_id())
  )
);

create policy messages_insert_participant_only on public.messages
for insert with check (
  public.current_role() = 'admin' or (
    sender_person_id = public.current_person_id() and exists (
      select 1
      from public.conversations c
      join public.applications a on a.application_id = c.application_id
      join public.internship_postings ip on ip.posting_id = a.posting_id
      where c.conversation_id = messages.conversation_id
        and (
          a.student_id = public.current_student_id()
          or ip.company_id = public.current_company_id()
        )
    )
  )
);

-- internship evaluations: student or company of related application
create policy evaluations_participant_or_admin on public.internship_evaluations
for select using (
  public.current_role() = 'admin' or exists (
    select 1
    from public.applications a
    join public.internship_postings ip on ip.posting_id = a.posting_id
    where a.application_id = internship_evaluations.application_id
      and (a.student_id = public.current_student_id() or ip.company_id = public.current_company_id())
  )
);

create policy admin_manage_all_companies on public.companies for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy admin_manage_all_skills on public.skills for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy admin_manage_posting_skills on public.posting_skills for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy admin_manage_learning_resources on public.learning_resources for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy admin_manage_notifications on public.notifications for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy admin_manage_skill_gap_reports on public.skill_gap_reports for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy admin_manage_skill_gap_details on public.skill_gap_details for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy admin_manage_conversations on public.conversations for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy admin_manage_messages on public.messages for update using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
create policy admin_manage_evaluations on public.internship_evaluations for all using (public.current_role() = 'admin') with check (public.current_role() = 'admin');
