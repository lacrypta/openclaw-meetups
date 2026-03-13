-- Remove event-specific columns from users table
-- These belong in event_attendees (where they already exist)
ALTER TABLE users DROP COLUMN IF EXISTS status;
ALTER TABLE users DROP COLUMN IF EXISTS checked_in;
ALTER TABLE users DROP COLUMN IF EXISTS checked_in_at;
ALTER TABLE users DROP COLUMN IF EXISTS qr_code_url;
ALTER TABLE users DROP COLUMN IF EXISTS registered_at;

-- Remove redundant name columns (name is the full name, first/last are computed)
ALTER TABLE users DROP COLUMN IF EXISTS first_name;
ALTER TABLE users DROP COLUMN IF EXISTS last_name;
