-- Enable RLS
alter table public.profiles enable row level security;
alter table public.job_postings enable row level security;
alter table public.applications enable row level security;
alter table public.messages enable row level security;

-- Profiles: user can read/write their own profile; admins can read all.
create policy "profiles_select_own_or_admin"
on public.profiles
for select
using (id = auth.uid() or exists (
  select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin'
));

create policy "profiles_update_own"
on public.profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "profiles_insert_own"
on public.profiles
for insert
with check (id = auth.uid());

-- Job postings: anyone can read published postings; companies can manage their own.
create policy "job_postings_select_published_or_owner"
on public.job_postings
for select
using (status = 'published' or company_id = auth.uid());

create policy "job_postings_company_manage"
on public.job_postings
for all
using (company_id = auth.uid())
with check (company_id = auth.uid());

-- Applications: students manage their own, companies can review applications for their postings.
create policy "applications_student_manage"
on public.applications
for all
using (student_id = auth.uid())
with check (student_id = auth.uid());

create policy "applications_company_select"
on public.applications
for select
using (exists (
  select 1 from public.job_postings jp
  where jp.id = posting_id and jp.company_id = auth.uid()
));

create policy "applications_company_update_status"
on public.applications
for update
using (exists (
  select 1 from public.job_postings jp
  where jp.id = posting_id and jp.company_id = auth.uid()
))
with check (exists (
  select 1 from public.job_postings jp
  where jp.id = posting_id and jp.company_id = auth.uid()
));

-- Messages tied to applications visible to application owner and posting owner.
create policy "messages_participants_select"
on public.messages
for select
using (
  exists (
    select 1
    from public.applications a
    join public.job_postings jp on jp.id = a.posting_id
    where a.id = application_id and (a.student_id = auth.uid() or jp.company_id = auth.uid())
  )
);

create policy "messages_participants_insert"
on public.messages
for insert
with check (
  sender_id = auth.uid() and
  exists (
    select 1
    from public.applications a
    join public.job_postings jp on jp.id = a.posting_id
    where a.id = application_id and (a.student_id = auth.uid() or jp.company_id = auth.uid())
  )
);
