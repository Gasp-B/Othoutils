-- Migration to reset catalog tables and introduce test catalog with domains and tags.
-- Idempotent: uses DROP TABLE IF EXISTS and CREATE TABLE IF NOT EXISTS guards.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist to avoid conflicts with the new schema.
DROP TABLE IF EXISTS public.test_tags CASCADE;
DROP TABLE IF EXISTS public.test_domains CASCADE;
DROP TABLE IF EXISTS public.tests CASCADE;
DROP TABLE IF EXISTS public.domains CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;

-- 1) Table tests
CREATE TABLE IF NOT EXISTS public.tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  short_description text,
  objective text,
  age_min_months int,
  age_max_months int,
  population text,
  duration_minutes int,
  materials text,
  is_standardized boolean DEFAULT false,
  publisher text,
  price_range text,
  buy_link text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- Trigger to keep updated_at current on row updates.
CREATE OR REPLACE FUNCTION public.set_tests_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := timezone('utc', now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_tests_updated_at ON public.tests;
CREATE TRIGGER set_tests_updated_at
BEFORE UPDATE ON public.tests
FOR EACH ROW
EXECUTE FUNCTION public.set_tests_updated_at();

-- 2) Table domains
CREATE TABLE IF NOT EXISTS public.domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);

-- 3) Table test_domains (relation N-N)
CREATE TABLE IF NOT EXISTS public.test_domains (
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  domain_id uuid NOT NULL REFERENCES public.domains(id) ON DELETE CASCADE,
  PRIMARY KEY (test_id, domain_id)
);

-- 4) Table tags
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE
);

-- 5) Table test_tags (relation N-N)
CREATE TABLE IF NOT EXISTS public.test_tags (
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (test_id, tag_id)
);

-- Enable Row Level Security on all new tables.
ALTER TABLE IF EXISTS public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.test_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.test_tags ENABLE ROW LEVEL SECURITY;

-- Policies: allow authenticated users to manage catalog data. Service role bypasses RLS by default.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tests' AND policyname = 'authenticated_select_tests'
  ) THEN
    CREATE POLICY authenticated_select_tests ON public.tests
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tests' AND policyname = 'authenticated_modify_tests'
  ) THEN
    CREATE POLICY authenticated_modify_tests ON public.tests
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'domains' AND policyname = 'authenticated_select_domains'
  ) THEN
    CREATE POLICY authenticated_select_domains ON public.domains
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'domains' AND policyname = 'authenticated_modify_domains'
  ) THEN
    CREATE POLICY authenticated_modify_domains ON public.domains
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'test_domains' AND policyname = 'authenticated_select_test_domains'
  ) THEN
    CREATE POLICY authenticated_select_test_domains ON public.test_domains
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'test_domains' AND policyname = 'authenticated_modify_test_domains'
  ) THEN
    CREATE POLICY authenticated_modify_test_domains ON public.test_domains
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tags' AND policyname = 'authenticated_select_tags'
  ) THEN
    CREATE POLICY authenticated_select_tags ON public.tags
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tags' AND policyname = 'authenticated_modify_tags'
  ) THEN
    CREATE POLICY authenticated_modify_tags ON public.tags
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'test_tags' AND policyname = 'authenticated_select_test_tags'
  ) THEN
    CREATE POLICY authenticated_select_test_tags ON public.test_tags
    FOR SELECT
    TO authenticated
    USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'test_tags' AND policyname = 'authenticated_modify_test_tags'
  ) THEN
    CREATE POLICY authenticated_modify_test_tags ON public.test_tags
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
  END IF;
END$$;
