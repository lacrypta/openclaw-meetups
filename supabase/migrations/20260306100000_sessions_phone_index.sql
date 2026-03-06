-- Sessions indexed by phone number (not user_id)
-- Multiple users may share same phone; session is 1:1 with the number
ALTER TABLE messaging_sessions ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE messaging_sessions ALTER COLUMN user_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messaging_sessions_phone ON messaging_sessions(phone);
