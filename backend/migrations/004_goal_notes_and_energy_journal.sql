-- Migration 004: Goal notes and daily energy journal
-- user_goals.notes:          optional note on a macro/calorie goal span (max 100 chars)
-- daily_logs.energy_journal: optional freeform journal of how the day felt energy-wise (max 500 chars)

ALTER TABLE user_goals
    ADD COLUMN IF NOT EXISTS notes VARCHAR(100);

ALTER TABLE daily_logs
    ADD COLUMN IF NOT EXISTS energy_journal VARCHAR(500);
