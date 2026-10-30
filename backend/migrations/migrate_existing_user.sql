-- One-off migration: Re-parent existing demo data to your Supabase auth account.
--
-- Steps:
--   1. Go to Supabase Dashboard → Authentication → Users
--   2. Create a new user with your email and password (or use "Invite user")
--   3. Copy the UUID shown for that user
--   4. Replace <YOUR_AUTH_UUID> below with that UUID
--   5. Replace <YOUR_EMAIL> with your email address
--   6. Run this script in the Supabase SQL editor
--
-- This is safe to run once. It moves all existing data from the demo user
-- (00000000-0000-0000-0000-000000000001) to your real auth account.

BEGIN;

DO $$
DECLARE
  old_id UUID := '00000000-0000-0000-0000-000000000001';
  new_id UUID := '<YOUR_AUTH_UUID>';   -- ← replace this
  new_email TEXT := '<YOUR_EMAIL>';    -- ← replace this
BEGIN
  -- Migrate FK references before touching the PK
  UPDATE daily_logs    SET user_id = new_id WHERE user_id = old_id;
  UPDATE food_templates SET user_id = new_id WHERE user_id = old_id;
  UPDATE user_goals    SET user_id = new_id WHERE user_id = old_id;

  -- Update the user row itself
  UPDATE users
  SET id = new_id, email = new_email
  WHERE id = old_id;
END $$;

COMMIT;
