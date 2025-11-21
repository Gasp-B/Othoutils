-- Ensure the taxonomy tags table matches the Drizzle schema with label-based columns.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create the table if it does not already exist with all expected columns.
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE,
  color_label text,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- If an old "name" column exists, align it with the expected "label" column.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'tags'
      AND column_name = 'name'
  ) THEN
    EXECUTE 'ALTER TABLE public.tags RENAME COLUMN name TO label';
  END IF;
END
$$;

-- Ensure label is required and unique even if the table pre-existed without constraints.
ALTER TABLE public.tags ALTER COLUMN label SET NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'tags_label_key'
      AND conrelid = 'public.tags'::regclass
  ) THEN
    ALTER TABLE public.tags ADD CONSTRAINT tags_label_key UNIQUE (label);
  END IF;
END
$$;

-- Ensure optional metadata columns exist.
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS color_label text;
ALTER TABLE public.tags ADD COLUMN IF NOT EXISTS created_at timestamptz;

-- Backfill and enforce created_at when added on existing tables.
ALTER TABLE public.tags ALTER COLUMN created_at SET DEFAULT timezone('utc', now());
UPDATE public.tags SET created_at = timezone('utc', now()) WHERE created_at IS NULL;
ALTER TABLE public.tags ALTER COLUMN created_at SET NOT NULL;
