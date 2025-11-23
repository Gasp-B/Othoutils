-- Add translation tables for user-facing taxonomy and tests content.
CREATE TABLE IF NOT EXISTS tests_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  locale text NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  short_description text,
  objective text,
  population text,
  materials text,
  publisher text,
  price_range text,
  notes text,
  UNIQUE (test_id, locale),
  UNIQUE (slug, locale)
);

CREATE TABLE IF NOT EXISTS domains_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id uuid NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  locale text NOT NULL,
  label text NOT NULL,
  slug text NOT NULL,
  UNIQUE (domain_id, locale),
  UNIQUE (slug, locale)
);

CREATE TABLE IF NOT EXISTS tags_translations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id uuid NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  locale text NOT NULL,
  label text NOT NULL,
  UNIQUE (tag_id, locale)
);

-- Seed existing content into the default French locale.
INSERT INTO tests_translations (test_id, locale, name, slug, short_description, objective, population, materials, publisher, price_range, notes)
SELECT id, 'fr', name, slug, short_description, objective, population, materials, publisher, price_range, notes FROM tests;

INSERT INTO domains_translations (domain_id, locale, label, slug)
SELECT id, 'fr', label, slug FROM domains;

INSERT INTO tags_translations (tag_id, locale, label)
SELECT id, 'fr', label FROM tags;

-- Drop language-specific columns from base tables.
ALTER TABLE tests
  DROP COLUMN name,
  DROP COLUMN slug,
  DROP COLUMN short_description,
  DROP COLUMN objective,
  DROP COLUMN population,
  DROP COLUMN materials,
  DROP COLUMN publisher,
  DROP COLUMN price_range,
  DROP COLUMN notes;

ALTER TABLE domains
  DROP COLUMN label,
  DROP COLUMN slug;

ALTER TABLE tags
  DROP COLUMN label;

-- Align RLS configuration with new translation tables.
ALTER TABLE IF EXISTS tests_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS domains_translations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tags_translations ENABLE ROW LEVEL SECURITY;
