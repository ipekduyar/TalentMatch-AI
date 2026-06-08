-- Run this file in the Supabase SQL Editor after the core schema and messaging schema.
-- It is safe to run multiple times.

create extension if not exists pgcrypto;

create table if not exists public.notifications (
  notification_id uuid primary key default gen_random_uuid(),
  person_id uuid not null references public.persons(person_id) on delete cascade,
  type text not null,
  title text not null,
  message text not null,
  related_application_id uuid null references public.applications(application_id) on delete cascade,
  related_conversation_id uuid null references public.conversations(conversation_id) on delete cascade,
  event_key text null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table if exists public.notifications
  add column if not exists notification_id uuid default gen_random_uuid(),
  add column if not exists person_id uuid references public.persons(person_id) on delete cascade,
  add column if not exists type text,
  add column if not exists title text,
  add column if not exists message text,
  add column if not exists related_application_id uuid references public.applications(application_id) on delete cascade,
  add column if not exists related_conversation_id uuid references public.conversations(conversation_id) on delete cascade,
  add column if not exists event_key text,
  add column if not exists is_read boolean default false,
  add column if not exists created_at timestamptz default now();

alter table public.notifications
  alter column notification_id set default gen_random_uuid(),
  alter column person_id set not null,
  alter column type set not null,
  alter column title set not null,
  alter column message set not null,
  alter column is_read set default false,
  alter column is_read set not null,
  alter column created_at set default now(),
  alter column created_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'notifications_event_key_key'
      and conrelid = 'public.notifications'::regclass
  ) then
    alter table public.notifications
      add constraint notifications_event_key_key unique (event_key);
  end if;
end $$;

create index if not exists idx_notifications_person_id on public.notifications(person_id);
create index if not exists idx_notifications_is_read on public.notifications(is_read);
create index if not exists idx_notifications_created_at on public.notifications(created_at desc);
create index if not exists idx_notifications_person_created_at on public.notifications(person_id, created_at desc);

alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
drop policy if exists notifications_update_own on public.notifications;
drop policy if exists notifications_insert_status_for_company_applications on public.notifications;
drop policy if exists notifications_insert_messages_for_conversation_participants on public.notifications;

create policy notifications_select_own on public.notifications
for select using (
  exists (
    select 1
    from public.persons p
    where p.person_id = notifications.person_id
      and p.auth_user_id = auth.uid()
  )
);

create policy notifications_update_own on public.notifications
for update using (
  exists (
    select 1
    from public.persons p
    where p.person_id = notifications.person_id
      and p.auth_user_id = auth.uid()
  )
) with check (
  exists (
    select 1
    from public.persons p
    where p.person_id = notifications.person_id
      and p.auth_user_id = auth.uid()
  )
);


create or replace function public.create_status_notification(
  p_application_id uuid,
  p_status text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notification_id uuid;
  v_event_key text;
  v_student_person_id uuid;
  v_posting_title text;
  v_status_label text;
begin
  if p_status not in ('reviewed', 'shortlisted', 'interview', 'accepted', 'rejected') then
    raise exception 'Invalid notification status: %', p_status using errcode = '22023';
  end if;

  select s.person_id, ip.title
    into v_student_person_id, v_posting_title
  from public.applications a
  join public.students s on s.student_id = a.student_id
  left join public.internship_postings ip on ip.internship_posting_id = a.internship_posting_id
  join public.company_representatives cr on cr.company_id = a.company_id
  join public.persons actor on actor.person_id = cr.person_id
  where a.application_id = p_application_id
    and actor.auth_user_id = auth.uid()
  limit 1;

  if v_student_person_id is null then
    raise exception 'Application not found or not accessible' using errcode = '42501';
  end if;

  v_event_key := 'status:' || p_application_id::text || ':' || p_status;
  v_status_label := initcap(replace(p_status, '_', ' '));

  insert into public.notifications (
    person_id,
    type,
    title,
    message,
    related_application_id,
    related_conversation_id,
    event_key,
    is_read
  ) values (
    v_student_person_id,
    'status_update',
    'Application status updated',
    'Your application for ' || coalesce(nullif(v_posting_title, ''), 'this role') || ' is now ' || v_status_label || '.',
    p_application_id,
    null,
    v_event_key,
    false
  )
  on conflict (event_key) do nothing
  returning notification_id into v_notification_id;

  if v_notification_id is null then
    select n.notification_id
      into v_notification_id
    from public.notifications n
    where n.event_key = v_event_key;
  end if;

  return v_notification_id;
end;
$$;

create or replace function public.create_message_notification(
  p_message_id uuid,
  p_conversation_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notification_id uuid;
  v_event_key text;
  v_sender_person_id uuid;
  v_sender_name text;
  v_recipient_person_id uuid;
  v_student_person_id uuid;
  v_company_id uuid;
  v_message_conversation_id uuid;
begin
  select p.person_id,
         coalesce(nullif(trim(concat_ws(' ', p.first_name, p.last_name)), ''), p.email, 'a TalentMatch user')
    into v_sender_person_id, v_sender_name
  from public.persons p
  where p.auth_user_id = auth.uid()
  limit 1;

  if v_sender_person_id is null then
    raise exception 'Authenticated person not found' using errcode = '42501';
  end if;

  select m.sender_person_id, m.conversation_id
    into v_sender_person_id, v_message_conversation_id
  from public.messages m
  where m.message_id = p_message_id;

  if v_message_conversation_id is null then
    raise exception 'Message not found' using errcode = '42501';
  end if;

  if v_message_conversation_id <> p_conversation_id then
    raise exception 'Message does not belong to conversation' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.persons p
    where p.person_id = v_sender_person_id
      and p.auth_user_id = auth.uid()
  ) then
    raise exception 'Message sender does not match authenticated user' using errcode = '42501';
  end if;

  select c.company_id, s.person_id
    into v_company_id, v_student_person_id
  from public.conversations c
  join public.students s on s.student_id = c.student_id
  where c.conversation_id = p_conversation_id;

  if v_company_id is null or v_student_person_id is null then
    raise exception 'Conversation not found or missing participants' using errcode = '42501';
  end if;

  if v_sender_person_id = v_student_person_id then
    select cr.person_id
      into v_recipient_person_id
    from public.company_representatives cr
    where cr.company_id = v_company_id
      and cr.person_id <> v_sender_person_id
    order by cr.person_id
    limit 1;
  else
    if not exists (
      select 1
      from public.company_representatives cr
      where cr.company_id = v_company_id
        and cr.person_id = v_sender_person_id
    ) then
      raise exception 'Sender is not a conversation participant' using errcode = '42501';
    end if;

    v_recipient_person_id := v_student_person_id;

    select coalesce(nullif(c.name, ''), v_sender_name)
      into v_sender_name
    from public.companies c
    where c.company_id = v_company_id;
  end if;

  if v_recipient_person_id is null then
    raise exception 'Notification recipient not found' using errcode = '42501';
  end if;

  if v_recipient_person_id = v_sender_person_id then
    raise exception 'Sender and recipient must differ' using errcode = '22023';
  end if;

  v_event_key := 'message:' || p_message_id::text;

  insert into public.notifications (
    person_id,
    type,
    title,
    message,
    related_application_id,
    related_conversation_id,
    event_key,
    is_read
  ) values (
    v_recipient_person_id,
    'new_message',
    'New message',
    'You received a new message from ' || coalesce(nullif(v_sender_name, ''), 'a TalentMatch user') || '.',
    null,
    p_conversation_id,
    v_event_key,
    false
  )
  on conflict (event_key) do nothing
  returning notification_id into v_notification_id;

  if v_notification_id is null then
    select n.notification_id
      into v_notification_id
    from public.notifications n
    where n.event_key = v_event_key;
  end if;

  return v_notification_id;
end;
$$;

revoke all on function public.create_status_notification(uuid, text) from public;
revoke all on function public.create_message_notification(uuid, uuid) from public;
grant execute on function public.create_status_notification(uuid, text) to authenticated;
grant execute on function public.create_message_notification(uuid, uuid) to authenticated;
