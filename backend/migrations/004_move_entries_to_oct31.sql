-- Migration 004: Move mis-dated meal entries to 2026-10-31
--
-- Some entries ended up on the wrong day. meal_entries have no date of their own;
-- the date lives on the parent daily_logs row, so we re-point each entry's
-- daily_log_id at the owner's 2026-10-31 log (creating that log if missing).
-- Entries already on 10/31 are left untouched. Idempotent: safe to re-run.

BEGIN;

DO $$
DECLARE
  target_date DATE := '2026-10-31';
  names TEXT[] := ARRAY[
    '40g oats 120g protein soy milk',
    'Oikos nonfat plain yogurt',
    '(Estimate) Garlic and Lemons office lunch',
    'Poppi',
    'Heytea mango sticky rice - light sugar',
    '(Estimate) Sanbada unlimited',
    '(Estimate) NAMU cocktail'
  ];
  uid UUID;
  target_log UUID;
BEGIN
  -- One pass per user who owns a matching entry on a different date
  FOR uid IN
    SELECT DISTINCT dl.user_id
    FROM meal_entries me
    JOIN daily_logs dl ON dl.id = me.daily_log_id
    WHERE me.name = ANY(names) AND dl.date <> target_date
  LOOP
    INSERT INTO daily_logs (user_id, date)
    VALUES (uid, target_date)
    ON CONFLICT (user_id, date) DO NOTHING;

    SELECT id INTO target_log
    FROM daily_logs
    WHERE user_id = uid AND date = target_date;

    UPDATE meal_entries me
    SET daily_log_id = target_log
    FROM daily_logs dl
    WHERE dl.id = me.daily_log_id
      AND dl.user_id = uid
      AND dl.date <> target_date
      AND me.name = ANY(names);
  END LOOP;
END $$;

COMMIT;

-- Verify (optional):
-- SELECT dl.date, me.name, me.calories, me.protein
-- FROM meal_entries me JOIN daily_logs dl ON dl.id = me.daily_log_id
-- WHERE dl.date = '2026-10-31' ORDER BY me.sort_order, me.created_at;
