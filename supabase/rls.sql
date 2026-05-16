alter table persons enable row level security;
alter table students enable row level security;
alter table companies enable row level security;
alter table company_representatives enable row level security;
alter table skills enable row level security;
alter table student_skills enable row level security;
alter table internship_postings enable row level security;
alter table posting_skills enable row level security;
alter table applications enable row level security;
alter table skill_gap_reports enable row level security;
alter table skill_gap_details enable row level security;
alter table learning_resources enable row level security;
alter table internship_evaluations enable row level security;
alter table notifications enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;

create or replace function public.current_person_id()
returns uuid language sql stable as $$
  select person_id from persons where auth_user_id = auth.uid() limit 1
$$;
create or replace function public.current_role()
returns text language sql stable as $$
  select role from persons where auth_user_id = auth.uid() limit 1
$$;

create policy admin_all_persons on persons for all using (current_role() = 'admin');
create policy own_person on persons for select using (person_id = current_person_id());

create policy admin_all_students on students for all using (current_role() = 'admin');
create policy student_own_profile on students for select using (person_id = current_person_id());
create policy student_update_own_profile on students for update using (person_id = current_person_id());

create policy public_view_approved_companies on companies for select using (is_approved = true);
create policy admin_all_companies on companies for all using (current_role() = 'admin');

create policy admin_all_reps on company_representatives for all using (current_role() = 'admin');
create policy rep_self on company_representatives for select using (person_id = current_person_id());

create policy public_read_skills on skills for select using (true);
create policy admin_manage_skills on skills for all using (current_role() = 'admin');

create policy admin_all_student_skills on student_skills for all using (current_role() = 'admin');
create policy student_manage_own_skills on student_skills for all using (
  student_id in (select student_id from students where person_id = current_person_id())
);

create policy student_view_active_postings on internship_postings for select using (
  status = 'active' or current_role() in ('company_rep','admin')
);
create policy company_rep_manage_own_postings on internship_postings for all using (
  company_id in (
    select company_id from company_representatives where person_id = current_person_id()
  )
);
create policy admin_manage_postings on internship_postings for all using (current_role() = 'admin');

create policy public_read_posting_skills on posting_skills for select using (true);
create policy company_rep_manage_posting_skills on posting_skills for all using (
  posting_id in (
    select posting_id from internship_postings
    where company_id in (select company_id from company_representatives where person_id = current_person_id())
  )
);
create policy admin_manage_posting_skills on posting_skills for all using (current_role() = 'admin');

create policy student_manage_own_applications on applications for all using (
  student_id in (select student_id from students where person_id = current_person_id())
);
create policy company_rep_view_company_applications on applications for select using (
  posting_id in (
    select posting_id from internship_postings
    where company_id in (select company_id from company_representatives where person_id = current_person_id())
  )
);
create policy admin_manage_applications on applications for all using (current_role() = 'admin');

create policy student_view_own_reports on skill_gap_reports for select using (
  student_id in (select student_id from students where person_id = current_person_id())
);
create policy admin_manage_reports on skill_gap_reports for all using (current_role() = 'admin');
create policy student_view_own_report_details on skill_gap_details for select using (
  report_id in (
    select report_id from skill_gap_reports where student_id in
      (select student_id from students where person_id = current_person_id())
  )
);
create policy admin_manage_report_details on skill_gap_details for all using (current_role() = 'admin');

create policy public_read_learning_resources on learning_resources for select using (true);
create policy admin_manage_learning_resources on learning_resources for all using (current_role() = 'admin');

create policy admin_manage_evaluations on internship_evaluations for all using (current_role() = 'admin');
create policy evaluation_visible_to_related_users on internship_evaluations for select using (
  application_id in (
    select a.application_id from applications a
    join students s on s.student_id = a.student_id
    left join internship_postings p on p.posting_id = a.posting_id
    left join company_representatives cr on cr.company_id = p.company_id
    where s.person_id = current_person_id() or cr.person_id = current_person_id()
  )
);

create policy own_notifications on notifications for select using (person_id = current_person_id());
create policy own_notifications_update on notifications for update using (person_id = current_person_id());
create policy admin_manage_notifications on notifications for all using (current_role() = 'admin');

create policy conversation_access on conversations for select using (
  application_id in (
    select a.application_id from applications a
    join students s on s.student_id = a.student_id
    join internship_postings p on p.posting_id = a.posting_id
    left join company_representatives cr on cr.company_id = p.company_id
    where s.person_id = current_person_id() or cr.person_id = current_person_id() or current_role() = 'admin'
  )
);
create policy company_rep_create_conversation_on_related_application on conversations for insert with check (
  application_id in (
    select a.application_id from applications a
    join internship_postings p on p.posting_id = a.posting_id
    join company_representatives cr on cr.company_id = p.company_id
    where cr.person_id = current_person_id()
  )
);

create policy messages_access on messages for select using (
  conversation_id in (select conversation_id from conversations)
);
create policy message_insert_related_application_only on messages for insert with check (
  sender_person_id = current_person_id() and
  conversation_id in (
    select c.conversation_id from conversations c
    join applications a on a.application_id = c.application_id
    join students s on s.student_id = a.student_id
    join internship_postings p on p.posting_id = a.posting_id
    left join company_representatives cr on cr.company_id = p.company_id
    where s.person_id = current_person_id() or cr.person_id = current_person_id() or current_role() = 'admin'
  )
);
