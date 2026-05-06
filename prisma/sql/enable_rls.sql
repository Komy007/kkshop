-- =====================================================================
-- KKShop: Enable Row Level Security (RLS) on ALL public tables
-- =====================================================================
-- PURPOSE:
--   Blocks Supabase's auto-generated REST API (PostgREST) from
--   accessing any table with just the anon key.
--
-- SAFETY:
--   Prisma connects as the PostgreSQL superuser (postgres role),
--   which BYPASSES RLS automatically. This script has ZERO impact
--   on the Next.js app or any Prisma queries.
--
-- HOW TO APPLY:
--   1. Go to Supabase Dashboard → SQL Editor
--   2. Paste this entire script and click "Run"
--   3. Verify the output shows rowsecurity = true for all tables
-- =====================================================================

-- Enable RLS on ALL tables in the public schema (handles current + future tables)
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    RAISE NOTICE 'RLS enabled on table: %', t;
  END LOOP;
END;
$$;

-- =====================================================================
-- VERIFICATION: List all tables and their RLS status
-- All rows should show rowsecurity = true after running above
-- =====================================================================
SELECT
  tablename,
  rowsecurity AS rls_enabled,
  CASE
    WHEN rowsecurity THEN '✅ Protected'
    ELSE '❌ EXPOSED'
  END AS status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY
  rowsecurity ASC,  -- show unprotected tables first
  tablename;
