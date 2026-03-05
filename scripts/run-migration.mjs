#!/usr/bin/env node
/**
 * Run migrations via Supabase service key (no direct DB connection needed).
 * Uses the PostgREST /rpc endpoint or raw SQL via supabase-js.
 */

import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_KEY required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function sql(query) {
  // Use the Supabase Management API SQL endpoint
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) {
    // Try alternative: use the pg_net or direct approach
    throw new Error(`SQL exec failed: ${res.status} ${await res.text()}`);
  }
  return await res.json();
}

// Since we can't run raw SQL via REST API directly, we'll use
// Supabase JS client operations to achieve the migration step by step

async function tableExists(name) {
  const { data, error } = await supabase.from(name).select('*').limit(0);
  return !error;
}

async function columnExists(table, column) {
  const { data, error } = await supabase.from(table).select(column).limit(0);
  return !error;
}

async function run() {
  console.log('🔧 OpenClaw Meetups — Manual Migration Runner\n');

  // Step 1: Check current state
  const hasAttendees = await tableExists('attendees');
  const hasUsers = await tableExists('users');
  const hasEventAttendees = await tableExists('event_attendees');

  console.log(`📊 Current state:`);
  console.log(`   attendees table: ${hasAttendees ? '✅' : '❌'}`);
  console.log(`   users table: ${hasUsers ? '✅' : '❌'}`);
  console.log(`   event_attendees table: ${hasEventAttendees ? '✅' : '❌'}`);

  if (hasUsers && !hasAttendees) {
    console.log('\n✅ Migration already completed (users exists, attendees doesn\'t)');
    return;
  }

  if (!hasAttendees) {
    console.error('\n❌ No attendees table found — nothing to migrate');
    return;
  }

  // Step 2: Read all attendees
  console.log('\n📥 Reading all attendees...');
  const { data: attendees, error: attErr } = await supabase
    .from('attendees')
    .select('*')
    .order('id', { ascending: true });

  if (attErr) {
    console.error('❌ Failed to read attendees:', attErr.message);
    return;
  }
  console.log(`   Found ${attendees.length} attendees`);

  // Step 3: Read event_attendees
  console.log('📥 Reading event_attendees...');
  const { data: eventAttendees, error: eaErr } = await supabase
    .from('event_attendees')
    .select('*');

  if (eaErr) {
    console.error('❌ Failed to read event_attendees:', eaErr.message);
    return;
  }
  console.log(`   Found ${eventAttendees.length} event_attendees`);

  // Step 4: Read email_sends if exists
  let emailSends = [];
  const hasEmailSends = await tableExists('email_sends');
  if (hasEmailSends) {
    const { data } = await supabase.from('email_sends').select('*');
    emailSends = data || [];
    console.log(`   Found ${emailSends.length} email_sends`);
  }

  // Step 5: Read email_events if exists
  let emailEvents = [];
  const hasEmailEvents = await tableExists('email_events');
  if (hasEmailEvents) {
    const { data } = await supabase.from('email_events').select('*');
    emailEvents = data || [];
    console.log(`   Found ${emailEvents.length} email_events`);
  }

  // Step 6: Generate UUID mapping (old integer id → new UUID)
  const crypto = await import('crypto');
  const idMap = new Map(); // old integer id → new UUID
  for (const att of attendees) {
    idMap.set(att.id, crypto.randomUUID());
  }

  console.log(`\n🔄 Generated ${idMap.size} UUIDs for migration`);

  // Step 7: We need to use raw SQL for DDL operations
  // Since we can't do DDL via supabase-js, we'll output the SQL for manual execution
  // OR use the Supabase SQL editor API

  // Try using the Supabase SQL API (available in newer versions)
  const sqlEndpoint = `${SUPABASE_URL.replace('.supabase.co', '.supabase.co')}/pg`;

  // Alternative approach: use fetch to the SQL endpoint
  async function execSQL(query) {
    // Try the Supabase HTTP API for SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
    });
    // This won't work for DDL, so we take another approach
  }

  // Since we can't execute DDL via REST, we'll do it step by step
  // using Supabase client operations where possible

  // The actual approach: create the users table via Supabase Dashboard SQL Editor
  // But we CAN do DML (insert/update/delete) via the REST API

  // So the plan is:
  // 1. Output DDL SQL that needs to be run in Supabase SQL Editor (one-time)
  // 2. Run DML (data migration) via supabase-js

  console.log('\n' + '='.repeat(60));
  console.log('📋 STEP 1: Run this SQL in Supabase SQL Editor');
  console.log('   Dashboard → SQL Editor → New Query');
  console.log('='.repeat(60));

  const ddlSQL = `
-- ============================================================
-- DDL: Merge attendees → users (run in Supabase SQL Editor)
-- ============================================================

-- 1. Add UUID + new columns to attendees
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid();
UPDATE attendees SET uuid = gen_random_uuid() WHERE uuid IS NULL;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false;
ALTER TABLE attendees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 2. Drop old users table if exists (messaging engine, likely empty)
DROP TABLE IF EXISTS messaging_sessions CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 3. Add user_id UUID column to event_attendees
ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS attendance_confirmed BOOLEAN DEFAULT false;
UPDATE event_attendees ea SET user_id = a.uuid FROM attendees a WHERE ea.attendee_id = a.id;

-- 4. Same for email_sends
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_sends' AND column_name='attendee_id') THEN
    ALTER TABLE email_sends ADD COLUMN IF NOT EXISTS user_id UUID;
    UPDATE email_sends es SET user_id = a.uuid FROM attendees a WHERE es.attendee_id = a.id;
  END IF;
END $$;

-- 5. Same for email_events
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_events' AND column_name='attendee_id') THEN
    ALTER TABLE email_events ADD COLUMN IF NOT EXISTS user_id UUID;
    UPDATE email_events ee SET user_id = a.uuid FROM attendees a WHERE ee.attendee_id = a.id;
  END IF;
END $$;

-- 6. Rename attendees → users
ALTER TABLE attendees RENAME TO users;

-- 7. Swap PK: drop old serial, rename uuid → id
ALTER TABLE users DROP CONSTRAINT IF EXISTS attendees_pkey;
ALTER TABLE event_attendees DROP CONSTRAINT IF EXISTS event_attendees_attendee_id_fkey;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='email_sends_attendee_id_fkey') THEN
    ALTER TABLE email_sends DROP CONSTRAINT email_sends_attendee_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='email_events_attendee_id_fkey') THEN
    ALTER TABLE email_events DROP CONSTRAINT email_events_attendee_id_fkey;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name='email_sends_job_id_attendee_id_key') THEN
    ALTER TABLE email_sends DROP CONSTRAINT email_sends_job_id_attendee_id_key;
  END IF;
END $$;

ALTER TABLE users DROP COLUMN id;
ALTER TABLE users RENAME COLUMN uuid TO id;
ALTER TABLE users ADD PRIMARY KEY (id);
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE users ALTER COLUMN id SET NOT NULL;

-- 8. New FKs
ALTER TABLE event_attendees
  ADD CONSTRAINT event_attendees_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE event_attendees DROP COLUMN IF EXISTS attendee_id;
ALTER TABLE event_attendees ADD CONSTRAINT event_attendees_event_user_unique UNIQUE(event_id, user_id);

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_sends' AND column_name='user_id') THEN
    ALTER TABLE email_sends ADD CONSTRAINT email_sends_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    ALTER TABLE email_sends ADD CONSTRAINT email_sends_job_id_user_id_key UNIQUE(job_id, user_id);
    ALTER TABLE email_sends DROP COLUMN IF EXISTS attendee_id;
  END IF;
END $$;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='email_events' AND column_name='user_id') THEN
    ALTER TABLE email_events ADD CONSTRAINT email_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    ALTER TABLE email_events DROP COLUMN IF EXISTS attendee_id;
  END IF;
END $$;

-- 9. Indexes
DROP INDEX IF EXISTS idx_attendees_email;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_luma_id ON users(luma_id);
CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON event_attendees(user_id);

-- 10. RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);

-- 11. Recreate messaging tables (dropped above)
CREATE TABLE IF NOT EXISTS messaging_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  event_id UUID REFERENCES events(id),
  master_prompt_id UUID,
  model_provider TEXT DEFAULT 'anthropic',
  model_name TEXT DEFAULT 'claude-sonnet-4-5',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON messaging_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON messaging_sessions(status);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES messaging_sessions(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  wasender_message_id TEXT,
  model_used TEXT,
  provider TEXT,
  tokens_in INTEGER,
  tokens_out INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);

-- 12. Recreate other messaging tables
CREATE TABLE IF NOT EXISTS ai_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  api_base_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES ai_providers(id),
  name TEXT NOT NULL,
  display_name TEXT,
  is_active BOOLEAN DEFAULT true,
  cost_per_1m_input DECIMAL,
  cost_per_1m_output DECIMAL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS master_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed AI providers
INSERT INTO ai_providers (name, api_base_url) VALUES
  ('anthropic', 'https://api.anthropic.com/v1'),
  ('openai', 'https://api.openai.com/v1'),
  ('google', 'https://generativelanguage.googleapis.com/v1')
ON CONFLICT (name) DO NOTHING;

-- 13. Add confirmation segment to email_templates
DO $$ BEGIN
  ALTER TABLE email_templates DROP CONSTRAINT IF EXISTS email_templates_segment_check;
  ALTER TABLE email_templates ADD CONSTRAINT email_templates_segment_check
    CHECK (segment IN ('checked-in', 'no-show', 'waitlist', 'confirmation', 'custom'));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 14. Add luma_event_id to events
ALTER TABLE events ADD COLUMN IF NOT EXISTS luma_event_id TEXT;

SELECT 'Migration complete ✅' AS result;
`;

  console.log(ddlSQL);

  console.log('='.repeat(60));
  console.log('📋 Copy the SQL above and run it in Supabase SQL Editor');
  console.log('   https://supabase.com/dashboard/project/gpfoxevxvhltjzppeacr/sql');
  console.log('='.repeat(60));
}

run().catch(console.error);
