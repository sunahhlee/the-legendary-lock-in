-- Migration 002: User Goals Table
-- Tracks historical and active calorie and protein goals with date spans

CREATE TABLE IF NOT EXISTS user_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    calorie_goal NUMERIC(8, 2) NOT NULL,
    protein_goal NUMERIC(7, 2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_goals_user ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_dates ON user_goals(start_date, end_date);
