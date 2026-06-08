-- Persist legally relevant signup consent on the shared user profile row.
-- Safe to run multiple times. Existing users are not backfilled to consented.

alter table public.persons
  add column if not exists kvkk_consent boolean not null default false,
  add column if not exists kvkk_consent_at timestamptz null,
  add column if not exists terms_consent boolean not null default false,
  add column if not exists terms_consent_at timestamptz null,
  add column if not exists consent_version text null;

update public.persons
set kvkk_consent = false
where kvkk_consent is null;

update public.persons
set terms_consent = false
where terms_consent is null;

alter table public.persons
  alter column kvkk_consent set default false,
  alter column kvkk_consent set not null,
  alter column terms_consent set default false,
  alter column terms_consent set not null;
