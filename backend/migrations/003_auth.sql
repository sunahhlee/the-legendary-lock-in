-- Migration 003: Auth support — username column + Row Level Security
-- Run this in the Supabase SQL editor.

-- 1. Add username column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 2. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

-- 3. users: each user can only see/modify their own row
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "users_delete_own" ON users FOR DELETE USING (auth.uid() = id);

-- 4. daily_logs: scoped by user_id
CREATE POLICY "daily_logs_select_own" ON daily_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "daily_logs_insert_own" ON daily_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "daily_logs_update_own" ON daily_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "daily_logs_delete_own" ON daily_logs FOR DELETE USING (auth.uid() = user_id);

-- 5. meal_entries: scoped via parent daily_log's user_id
CREATE POLICY "meal_entries_select_own" ON meal_entries FOR SELECT
  USING (EXISTS (SELECT 1 FROM daily_logs dl WHERE dl.id = daily_log_id AND dl.user_id = auth.uid()));
CREATE POLICY "meal_entries_insert_own" ON meal_entries FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM daily_logs dl WHERE dl.id = daily_log_id AND dl.user_id = auth.uid()));
CREATE POLICY "meal_entries_update_own" ON meal_entries FOR UPDATE
  USING (EXISTS (SELECT 1 FROM daily_logs dl WHERE dl.id = daily_log_id AND dl.user_id = auth.uid()));
CREATE POLICY "meal_entries_delete_own" ON meal_entries FOR DELETE
  USING (EXISTS (SELECT 1 FROM daily_logs dl WHERE dl.id = daily_log_id AND dl.user_id = auth.uid()));

-- 6. food_templates: scoped by user_id
CREATE POLICY "food_templates_select_own" ON food_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "food_templates_insert_own" ON food_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "food_templates_update_own" ON food_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "food_templates_delete_own" ON food_templates FOR DELETE USING (auth.uid() = user_id);

-- 7. user_goals: scoped by user_id
CREATE POLICY "user_goals_select_own" ON user_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_goals_insert_own" ON user_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_goals_update_own" ON user_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "user_goals_delete_own" ON user_goals FOR DELETE USING (auth.uid() = user_id);
