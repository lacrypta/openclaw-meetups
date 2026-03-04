-- ============================================================
-- MIGRATION: Merge attendees + users → single users table (UUID)
-- ============================================================
-- Steps:
--   1. Add UUID column to attendees
--   2. Populate UUIDs for existing rows
--   3. Add missing columns from users table (phone, verified flags)
--   4. Drop old users table (messaging engine, not yet populated)
--   5. Rename attendees → users
--   6. Migrate FKs in event_attendees, email_sends, email_events
--   7. Update messaging_sessions FK
--   8. Swap PK from SERIAL to UUID
--   9. Clean up

-- Step 1: Add uuid column to attendees
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();

-- Step 2: Ensure all existing rows have a UUID
UPDATE attendees SET uuid = gen_random_uuid() WHERE uuid IS NULL;

-- Step 3: Add columns from users table that attendees doesn't have
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS luma_id TEXT;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create indexes on new columns
CREATE INDEX IF NOT EXISTS idx_attendees_phone ON attendees(phone);
CREATE INDEX IF NOT EXISTS idx_attendees_uuid ON attendees(uuid);
CREATE INDEX IF NOT EXISTS idx_attendees_luma_id ON attendees(luma_id);

-- Step 4: Migrate data from old users table if any exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
    -- Copy any phone/verified data from users to attendees (matched by attendee_id)
    UPDATE attendees a SET
      phone = u.phone,
      email_verified = u.email_verified,
      phone_verified = u.phone_verified,
      uuid = u.id  -- preserve the UUID from users table
    FROM users u
    WHERE u.attendee_id = a.id;
  END IF;
END $$;

-- Step 5: Update messaging_sessions to reference attendees.uuid before dropping users
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
    -- Drop the old FK on messaging_sessions.user_id → users(id)
    ALTER TABLE messaging_sessions DROP CONSTRAINT IF EXISTS messaging_sessions_user_id_fkey;

    -- Update messaging_sessions.user_id to point to attendees.uuid
    UPDATE messaging_sessions ms SET user_id = a.uuid
    FROM users u
    JOIN attendees a ON u.attendee_id = a.id
    WHERE ms.user_id = u.id;

    -- Drop the old users table
    DROP TABLE users CASCADE;
  END IF;
END $$;

-- Step 6: Add uuid columns to referencing tables and populate
-- event_attendees
ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS user_id UUID;
UPDATE event_attendees ea SET user_id = a.uuid FROM attendees a WHERE ea.attendee_id = a.id;

-- email_sends
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_sends' AND column_name = 'attendee_id') THEN
    ALTER TABLE email_sends ADD COLUMN IF NOT EXISTS user_id UUID;
    UPDATE email_sends es SET user_id = a.uuid FROM attendees a WHERE es.attendee_id = a.id;
  END IF;
END $$;

-- email_events
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_events' AND column_name = 'attendee_id') THEN
    ALTER TABLE email_events ADD COLUMN IF NOT EXISTS user_id UUID;
    UPDATE email_events ee SET user_id = a.uuid FROM attendees a WHERE ee.attendee_id = a.id;
  END IF;
END $$;

-- Step 7: Rename attendees → users
ALTER TABLE attendees RENAME TO users;

-- Step 8: Swap PK from SERIAL id to UUID
-- Drop old PK
ALTER TABLE users DROP CONSTRAINT IF EXISTS attendees_pkey;

-- Drop old integer FKs (they reference the old SERIAL id)
ALTER TABLE event_attendees DROP CONSTRAINT IF EXISTS event_attendees_attendee_id_fkey;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'email_sends_attendee_id_fkey') THEN
    ALTER TABLE email_sends DROP CONSTRAINT email_sends_attendee_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'email_events_attendee_id_fkey') THEN
    ALTER TABLE email_events DROP CONSTRAINT email_events_attendee_id_fkey;
  END IF;
END $$;

-- Drop old unique constraints that reference attendee_id
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'email_sends_job_id_attendee_id_key') THEN
    ALTER TABLE email_sends DROP CONSTRAINT email_sends_job_id_attendee_id_key;
  END IF;
END $$;

-- Rename uuid → id (drop old serial id first, rename uuid)
ALTER TABLE users DROP COLUMN id;
ALTER TABLE users RENAME COLUMN uuid TO id;
ALTER TABLE users ADD PRIMARY KEY (id);

-- Make id NOT NULL with default
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE users ALTER COLUMN id SET NOT NULL;

-- Step 9: Add new FKs pointing to users(id) UUID
ALTER TABLE event_attendees
  ADD CONSTRAINT event_attendees_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Drop old integer columns
ALTER TABLE event_attendees DROP COLUMN IF EXISTS attendee_id;

-- Add FK on messaging_sessions
ALTER TABLE messaging_sessions
  ADD CONSTRAINT messaging_sessions_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- email_sends
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_sends' AND column_name = 'user_id') THEN
    ALTER TABLE email_sends
      ADD CONSTRAINT email_sends_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    -- Add unique constraint
    ALTER TABLE email_sends ADD CONSTRAINT email_sends_job_id_user_id_key UNIQUE(job_id, user_id);
    ALTER TABLE email_sends DROP COLUMN IF EXISTS attendee_id;
  END IF;
END $$;

-- email_events
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'email_events' AND column_name = 'user_id') THEN
    ALTER TABLE email_events
      ADD CONSTRAINT email_events_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    ALTER TABLE email_events DROP COLUMN IF EXISTS attendee_id;
  END IF;
END $$;

-- Step 10: Update indexes
DROP INDEX IF EXISTS idx_attendees_email;
DROP INDEX IF EXISTS idx_attendees_phone;
DROP INDEX IF EXISTS idx_attendees_uuid;
DROP INDEX IF EXISTS idx_attendees_luma_id;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_luma_id ON users(luma_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON event_attendees(user_id);

-- Step 11: Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow all on users') THEN
    CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Step 12: Add unique constraint for event_attendees (event_id, user_id)
ALTER TABLE event_attendees ADD CONSTRAINT event_attendees_event_user_unique UNIQUE(event_id, user_id);
