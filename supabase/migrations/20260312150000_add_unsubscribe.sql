ALTER TABLE users ADD COLUMN IF NOT EXISTS subscribed BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS unsubscribe_token UUID DEFAULT gen_random_uuid();
ALTER TABLE users ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_unsubscribe_token ON users(unsubscribe_token);
-- Backfill existing users with tokens
UPDATE users SET unsubscribe_token = gen_random_uuid() WHERE unsubscribe_token IS NULL;
-- Make NOT NULL after backfill
ALTER TABLE users ALTER COLUMN unsubscribe_token SET NOT NULL;
ALTER TABLE users ALTER COLUMN unsubscribe_token SET DEFAULT gen_random_uuid();
