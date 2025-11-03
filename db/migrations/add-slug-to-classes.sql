-- Migration: Add slug column to classes table
-- This script safely adds the slug column without losing data

-- Step 1: Add slug column as nullable first
ALTER TABLE classes ADD COLUMN IF NOT EXISTS slug TEXT;

-- Step 2: Generate slugs for existing courses
-- This function generates a URL-friendly slug from text
CREATE OR REPLACE FUNCTION generate_slug(text_input TEXT) RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    REGEXP_REPLACE(
      REGEXP_REPLACE(
        REGEXP_REPLACE(text_input, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+', '-', 'g'
      ),
      '-+', '-', 'g'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Step 3: Update existing rows with generated slugs
-- Handle duplicates by appending numbers
DO $$
DECLARE
  class_record RECORD;
  base_slug TEXT;
  unique_slug TEXT;
  counter INTEGER;
BEGIN
  FOR class_record IN SELECT id, title FROM classes WHERE slug IS NULL OR slug = '' LOOP
    -- Generate base slug
    base_slug := generate_slug(class_record.title);
    
    -- Remove leading/trailing hyphens
    base_slug := TRIM(BOTH '-' FROM base_slug);
    
    -- Ensure uniqueness
    unique_slug := base_slug;
    counter := 2;
    
    WHILE EXISTS (SELECT 1 FROM classes WHERE slug = unique_slug AND id != class_record.id) LOOP
      unique_slug := base_slug || '-' || counter;
      counter := counter + 1;
    END LOOP;
    
    -- Update the row
    UPDATE classes SET slug = unique_slug WHERE id = class_record.id;
  END LOOP;
END $$;

-- Step 4: Make slug NOT NULL and add unique constraint
ALTER TABLE classes 
  ALTER COLUMN slug SET NOT NULL,
  ADD CONSTRAINT classes_slug_unique UNIQUE (slug);

-- Step 5: Clean up the temporary function
DROP FUNCTION IF EXISTS generate_slug(TEXT);

-- Verify the migration
SELECT id, title, slug FROM classes LIMIT 5;

