-- Migration 003: Move misdated entries from 2026-10-30 to 2026-10-29
-- Entries were accidentally logged on 2026-10-30 but belong to 2026-10-29.
--
-- daily_logs has UNIQUE (user_id, date), so for each user:
--   * if no 2026-10-29 log exists, the 2026-10-30 log is simply re-dated
--   * if a 2026-10-29 log already exists, the 2026-10-30 meal entries are moved
--     into it (appended after its existing entries), notes are carried over if
--     the target has none, and the now-empty 2026-10-30 log is deleted
-- Runs in a single transaction; safe to re-run (no-op once nothing is on 10/30).

BEGIN;

-- Case 1: no 10/29 log for the user -> re-date the 10/30 log
UPDATE daily_logs src
SET date = DATE '2026-10-29'
WHERE src.date = DATE '2026-10-30'
  AND NOT EXISTS (
      SELECT 1 FROM daily_logs dst
      WHERE dst.user_id = src.user_id
        AND dst.date = DATE '2026-10-29'
  );

-- Case 2: both logs exist -> merge 10/30 into 10/29
-- Carry over notes when the target has none
UPDATE daily_logs dst
SET notes = src.notes
FROM daily_logs src
WHERE src.user_id = dst.user_id
  AND src.date = DATE '2026-10-30'
  AND dst.date = DATE '2026-10-29'
  AND (dst.notes IS NULL OR dst.notes = '')
  AND src.notes IS NOT NULL;

-- Move entries, keeping them after any existing 10/29 entries
UPDATE meal_entries me
SET daily_log_id = dst.id,
    sort_order = me.sort_order + COALESCE(
        (SELECT MAX(e.sort_order) + 1 FROM meal_entries e WHERE e.daily_log_id = dst.id),
        0
    )
FROM daily_logs src
JOIN daily_logs dst
  ON dst.user_id = src.user_id
 AND dst.date = DATE '2026-10-29'
WHERE me.daily_log_id = src.id
  AND src.date = DATE '2026-10-30';

-- Remove the emptied 10/30 logs (only those that were merged, i.e. have a 10/29 twin)
DELETE FROM daily_logs src
USING daily_logs dst
WHERE src.date = DATE '2026-10-30'
  AND dst.user_id = src.user_id
  AND dst.date = DATE '2026-10-29'
  AND NOT EXISTS (SELECT 1 FROM meal_entries me WHERE me.daily_log_id = src.id);

COMMIT;
