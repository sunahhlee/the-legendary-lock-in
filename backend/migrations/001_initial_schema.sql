-- Migration 001: Initial Diet Tracker Schema
-- Tables: users, food_templates, daily_logs, meal_entries

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Compatible with Supabase Auth or standalone user management)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Food Templates Table (Reusable items for frequent meals)
CREATE TABLE IF NOT EXISTS food_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    default_calories NUMERIC(8, 3) NOT NULL,
    default_protein NUMERIC(7, 3) NOT NULL DEFAULT 0.0,
    category TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_food_templates_user ON food_templates(user_id);

-- 3. Daily Logs Table (Tracks one day per user)
CREATE TABLE IF NOT EXISTS daily_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_daily_logs_user_date UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_logs_user_date ON daily_logs(user_id, date);

-- 4. Meal Entries Table (Individual items logged under a daily log)
CREATE TABLE IF NOT EXISTS meal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_log_id UUID NOT NULL REFERENCES daily_logs(id) ON DELETE CASCADE,
    template_id UUID REFERENCES food_templates(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    calories NUMERIC(8, 3) NOT NULL,
    protein NUMERIC(7, 3) NOT NULL DEFAULT 0.0,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meal_entries_log_id ON meal_entries(daily_log_id);

-- Insert a default demo user for local development / v1 single-user mode
INSERT INTO users (id, email)
VALUES ('00000000-0000-0000-0000-000000000001', 'demo@legendarylockin.local')
ON CONFLICT (id) DO NOTHING;
