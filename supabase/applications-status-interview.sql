-- Safely update applications status check constraint to include 'interview'
DO $$
DECLARE
  constraint_name text;
BEGIN
  SELECT con.conname
  INTO constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE rel.relname = 'applications'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) ILIKE '%status%'
    AND pg_get_constraintdef(con.oid) ILIKE '%submitted%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS %I', constraint_name);
  END IF;
END $$;

ALTER TABLE public.applications
ADD CONSTRAINT applications_status_check
CHECK (status IN ('submitted', 'reviewed', 'shortlisted', 'interview', 'rejected', 'accepted'));
