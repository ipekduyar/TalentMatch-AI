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

create policy notifications_insert_status_for_company_applications on public.notifications
for insert with check (
  notifications.type = 'status_update'
  and notifications.related_application_id is not null
  and notifications.event_key ~ ('^status:' || notifications.related_application_id::text || ':(reviewed|shortlisted|interview|accepted|rejected)$')
  and exists (
    select 1
    from public.applications a
    join public.students s on s.student_id = a.student_id
    join public.company_representatives cr on cr.company_id = a.company_id
    join public.persons actor on actor.person_id = cr.person_id
    where a.application_id = notifications.related_application_id
      and s.person_id = notifications.person_id
      and actor.auth_user_id = auth.uid()
  )
);

create policy notifications_insert_messages_for_conversation_participants on public.notifications
for insert with check (
  notifications.type = 'new_message'
  and notifications.related_conversation_id is not null
  and notifications.event_key like 'message:%'
  and exists (
    select 1
    from public.persons actor
    where actor.auth_user_id = auth.uid()
      and actor.person_id <> notifications.person_id
      and exists (
        select 1
        from public.conversations c
        where c.conversation_id = notifications.related_conversation_id
          and (
            exists (
              select 1
              from public.students sender_student
              where sender_student.student_id = c.student_id
                and sender_student.person_id = actor.person_id
            )
            or exists (
              select 1
              from public.company_representatives sender_rep
              where sender_rep.company_id = c.company_id
                and sender_rep.person_id = actor.person_id
            )
          )
          and (
            exists (
              select 1
              from public.students recipient_student
              where recipient_student.student_id = c.student_id
                and recipient_student.person_id = notifications.person_id
            )
            or exists (
              select 1
              from public.company_representatives recipient_rep
              where recipient_rep.company_id = c.company_id
                and recipient_rep.person_id = notifications.person_id
            )
          )
      )
  )
);
