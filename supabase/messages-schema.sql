-- Run this file in Supabase SQL Editor.

create extension if not exists pgcrypto;

alter table if exists public.conversations
  add column if not exists student_id uuid references public.students(student_id) on delete cascade,
  add column if not exists company_id uuid references public.companies(company_id) on delete cascade,
  add column if not exists updated_at timestamptz not null default now();

alter table if exists public.conversations
  alter column conversation_id set default gen_random_uuid();

alter table if exists public.conversations
  alter column application_id drop not null;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'applications' and column_name = 'company_id'
  ) then
    update public.conversations c
    set student_id = a.student_id,
        company_id = a.company_id
    from public.applications a
    where c.application_id = a.application_id
      and (c.student_id is null or c.company_id is null);
  end if;
end $$;

alter table public.conversations
  alter column student_id set not null,
  alter column company_id set not null;

alter table if exists public.conversations
  drop constraint if exists conversations_application_id_key;

alter table if exists public.conversations
  add constraint conversations_student_company_application_key unique (student_id, company_id, application_id);

create index if not exists idx_conversations_student_id on public.conversations(student_id);
create index if not exists idx_conversations_company_id on public.conversations(company_id);
create index if not exists idx_conversations_application_id on public.conversations(application_id);

alter table if exists public.messages
  add column if not exists body text,
  add column if not exists created_at timestamptz not null default now();

update public.messages
set body = coalesce(body, content),
    created_at = coalesce(created_at, sent_at)
where body is null or created_at is null;

alter table public.messages alter column body set not null;
alter table public.messages alter column message_id set default gen_random_uuid();

create index if not exists idx_messages_conversation_created on public.messages(conversation_id, created_at);

alter table public.conversations enable row level security;
alter table public.messages enable row level security;

create policy if not exists conversations_select_for_participants on public.conversations
for select using (
  exists (
    select 1 from public.persons p
    join public.students s on s.person_id = p.person_id
    where p.auth_user_id = auth.uid() and s.student_id = conversations.student_id
  )
  or exists (
    select 1 from public.persons p
    join public.company_representatives cr on cr.person_id = p.person_id
    where p.auth_user_id = auth.uid() and cr.company_id = conversations.company_id
  )
);

create policy if not exists conversations_insert_for_participants on public.conversations
for insert with check (
  exists (
    select 1 from public.persons p
    join public.students s on s.person_id = p.person_id
    where p.auth_user_id = auth.uid() and s.student_id = conversations.student_id
  )
  or exists (
    select 1 from public.persons p
    join public.company_representatives cr on cr.person_id = p.person_id
    where p.auth_user_id = auth.uid() and cr.company_id = conversations.company_id
  )
);

create policy if not exists messages_select_for_conversation_participants on public.messages
for select using (
  exists (
    select 1 from public.conversations c
    where c.conversation_id = messages.conversation_id
      and (
        exists (
          select 1 from public.persons p
          join public.students s on s.person_id = p.person_id
          where p.auth_user_id = auth.uid() and s.student_id = c.student_id
        )
        or exists (
          select 1 from public.persons p
          join public.company_representatives cr on cr.person_id = p.person_id
          where p.auth_user_id = auth.uid() and cr.company_id = c.company_id
        )
      )
  )
);

create policy if not exists messages_insert_for_sender on public.messages
for insert with check (
  exists (
    select 1 from public.persons p
    where p.person_id = messages.sender_person_id
      and p.auth_user_id = auth.uid()
  )
  and exists (
    select 1 from public.conversations c
    where c.conversation_id = messages.conversation_id
      and (
        exists (
          select 1 from public.persons p
          join public.students s on s.person_id = p.person_id
          where p.auth_user_id = auth.uid() and s.student_id = c.student_id
        )
        or exists (
          select 1 from public.persons p
          join public.company_representatives cr on cr.person_id = p.person_id
          where p.auth_user_id = auth.uid() and cr.company_id = c.company_id
        )
      )
  )
);
