-- Migration 005: Optional gram-based scaling for food templates and entries
-- food_templates.default_grams: grams that default_calories / default_protein refer to.
--                               NULL = template is not scalable (existing templates stay as-is).
-- meal_entries.grams:           optional portion size (grams) the entry was logged with.
--                               NULL = logged as a flat amount (all existing entries).

ALTER TABLE food_templates
    ADD COLUMN IF NOT EXISTS default_grams NUMERIC(8, 2) CHECK (default_grams IS NULL OR default_grams > 0);

ALTER TABLE meal_entries
    ADD COLUMN IF NOT EXISTS grams NUMERIC(8, 2) CHECK (grams IS NULL OR grams > 0);
