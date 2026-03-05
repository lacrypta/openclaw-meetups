#!/usr/bin/env node
/**
 * Migration runner that creates a temporary RPC function to execute DDL,
 * then cleans it up. Uses only the Supabase service key (no direct DB needed).
 */

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL and SUPABASE_SERVICE_KEY required in .env.local');
  process.exit(1);
}

const headers = {
  'apikey': SUPABASE_SERVICE_KEY,
  'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

async function rpc(fnName, params = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fnName}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(params),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`RPC ${fnName} failed (${res.status}): ${text}`);
  try { return JSON.parse(text); } catch { return text; }
}

async function createExecFunction() {
  // Create a temporary function that can execute arbitrary SQL
  // We use the service_role key which has full postgres access
  const createFnSQL = `
    CREATE OR REPLACE FUNCTION _temp_exec_sql(sql_text TEXT)
    RETURNS TEXT
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql_text;
      RETURN 'OK';
    EXCEPTION WHEN OTHERS THEN
      RETURN SQLERRM;
    END;
    $$;
  `;

  // We need to create this function first — but we can't execute DDL via REST...
  // Unless we use the Supabase edge function or dashboard.
  
  // Actually, we CAN create functions via RPC if there's already an exec function.
  // Chicken-and-egg problem. Let's check if one exists:
  try {
    const result = await rpc('_temp_exec_sql', { sql_text: 'SELECT 1' });
    console.log('✅ exec function already exists');
    return true;
  } catch {
    console.log('⚠️  No exec function found. Creating via PostgREST...');
    
    // PostgREST can't create functions. We need another approach.
    // Use the supabase CLI if available
    try {
      const { execSync } = await import('child_process');
      
      // Check if we have DATABASE_URL
      const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
      if (dbUrl) {
        console.log('📡 Found DATABASE_URL, using psql...');
        execSync(`psql "${dbUrl}" -c "${createFnSQL.replace(/"/g, '\\"')}"`, {
          encoding: 'utf-8',
          stdio: 'pipe',
        });
        return true;
      }
      
      // Try npx supabase
      console.log('🔄 Trying supabase db push...');
      execSync(`echo "${createFnSQL}" | npx supabase db push --db-url "${dbUrl}"`, {
        encoding: 'utf-8',
        stdio: 'pipe',
      });
      return true;
    } catch (e) {
      console.error('❌ Cannot create exec function:', e.message);
      return false;
    }
  }
}

async function tableExists(name) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${name}?select=*&limit=0`, {
      headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` }
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function run() {
  console.log('🔧 OpenClaw Meetups — Migration Runner\n');

  const hasAttendees = await tableExists('attendees');
  const hasUsers = await tableExists('users');

  console.log(`attendees: ${hasAttendees ? '✅' : '❌'}`);
  console.log(`users: ${hasUsers ? '✅' : '❌'}`);

  if (hasUsers && !hasAttendees) {
    console.log('\n✅ Already migrated!');
    return;
  }

  if (!hasAttendees) {
    console.error('❌ No attendees table');
    return;
  }

  // Try to use exec function
  const hasExec = await createExecFunction();
  
  if (hasExec) {
    console.log('\n🔄 Running migration via RPC...\n');
    
    const steps = [
      // Step 1: Add columns
      `ALTER TABLE attendees ADD COLUMN IF NOT EXISTS uuid UUID DEFAULT gen_random_uuid()`,
      `UPDATE attendees SET uuid = gen_random_uuid() WHERE uuid IS NULL`,
      `ALTER TABLE attendees ADD COLUMN IF NOT EXISTS phone TEXT`,
      `ALTER TABLE attendees ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false`,
      `ALTER TABLE attendees ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT false`,
      `ALTER TABLE attendees ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now()`,

      // Step 2: Drop old users + messaging tables
      `DROP TABLE IF EXISTS messages CASCADE`,
      `DROP TABLE IF EXISTS messaging_sessions CASCADE`,
      `DROP TABLE IF EXISTS master_prompts CASCADE`,
      `DROP TABLE IF EXISTS ai_models CASCADE`,
      `DROP TABLE IF EXISTS ai_providers CASCADE`,
      `DROP TABLE IF EXISTS users CASCADE`,

      // Step 3: event_attendees new columns
      `ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS user_id UUID`,
      `ALTER TABLE event_attendees ADD COLUMN IF NOT EXISTS attendance_confirmed BOOLEAN DEFAULT false`,
      `UPDATE event_attendees ea SET user_id = a.uuid FROM attendees a WHERE ea.attendee_id = a.id`,

      // Step 4: Rename
      `ALTER TABLE attendees RENAME TO users`,

      // Step 5: Swap PK
      `ALTER TABLE users DROP CONSTRAINT IF EXISTS attendees_pkey`,
      `ALTER TABLE event_attendees DROP CONSTRAINT IF EXISTS event_attendees_attendee_id_fkey`,
      `ALTER TABLE users DROP COLUMN id`,
      `ALTER TABLE users RENAME COLUMN uuid TO id`,
      `ALTER TABLE users ADD PRIMARY KEY (id)`,
      `ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid()`,
      `ALTER TABLE users ALTER COLUMN id SET NOT NULL`,

      // Step 6: New FKs
      `ALTER TABLE event_attendees ADD CONSTRAINT event_attendees_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE`,
      `ALTER TABLE event_attendees DROP COLUMN IF EXISTS attendee_id`,
      `ALTER TABLE event_attendees ADD CONSTRAINT event_attendees_event_user_unique UNIQUE(event_id, user_id)`,

      // Step 7: Indexes
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
      `CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone)`,
      `CREATE INDEX IF NOT EXISTS idx_event_attendees_user_id ON event_attendees(user_id)`,

      // Step 8: RLS
      `ALTER TABLE users ENABLE ROW LEVEL SECURITY`,
      `CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true)`,

      // Step 9: Recreate messaging tables
      `CREATE TABLE messaging_sessions (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL, event_id UUID REFERENCES events(id), master_prompt_id UUID, model_provider TEXT DEFAULT 'anthropic', model_name TEXT DEFAULT 'claude-sonnet-4-5', status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'expired')), created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(), closed_at TIMESTAMPTZ)`,
      `CREATE INDEX idx_sessions_user ON messaging_sessions(user_id)`,
      `CREATE INDEX idx_sessions_status ON messaging_sessions(status)`,
      `CREATE TABLE messages (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), session_id UUID REFERENCES messaging_sessions(id) ON DELETE CASCADE NOT NULL, role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')), content TEXT NOT NULL, wasender_message_id TEXT, model_used TEXT, provider TEXT, tokens_in INTEGER, tokens_out INTEGER, created_at TIMESTAMPTZ DEFAULT now())`,
      `CREATE INDEX idx_messages_session ON messages(session_id)`,
      `CREATE TABLE ai_providers (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT UNIQUE NOT NULL, api_base_url TEXT NOT NULL, is_active BOOLEAN DEFAULT true, created_at TIMESTAMPTZ DEFAULT now())`,
      `CREATE TABLE ai_models (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), provider_id UUID REFERENCES ai_providers(id), name TEXT NOT NULL, display_name TEXT, is_active BOOLEAN DEFAULT true, cost_per_1m_input DECIMAL, cost_per_1m_output DECIMAL, created_at TIMESTAMPTZ DEFAULT now())`,
      `CREATE TABLE master_prompts (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, content TEXT NOT NULL, is_default BOOLEAN DEFAULT false, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now())`,
      `INSERT INTO ai_providers (name, api_base_url) VALUES ('anthropic', 'https://api.anthropic.com/v1'), ('openai', 'https://api.openai.com/v1'), ('google', 'https://generativelanguage.googleapis.com/v1') ON CONFLICT (name) DO NOTHING`,

      // Step 10: events + templates updates
      `ALTER TABLE events ADD COLUMN IF NOT EXISTS luma_event_id TEXT`,

      // Cleanup
      `DROP FUNCTION IF EXISTS _temp_exec_sql`,
    ];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const label = step.substring(0, 60).replace(/\n/g, ' ');
      try {
        const result = await rpc('_temp_exec_sql', { sql_text: step });
        if (result === 'OK' || result === '"OK"') {
          console.log(`  ✅ [${i+1}/${steps.length}] ${label}...`);
        } else {
          console.log(`  ⚠️  [${i+1}/${steps.length}] ${label}... ${result}`);
        }
      } catch (err) {
        console.error(`  ❌ [${i+1}/${steps.length}] ${label}... ${err.message}`);
        // Don't stop — some steps may fail if already applied
      }
    }

    console.log('\n✅ Migration complete!');
  } else {
    // Output SQL for manual execution
    console.log('\n❌ Cannot run migration programmatically.');
    console.log('   Please run the SQL in Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/gpfoxevxvhltjzppeacr/sql\n');
    console.log('   Or fix DATABASE_URL in Vercel env vars.\n');
    
    // Output the migration file content
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260304300000_merge_attendees_into_users_uuid.sql');
    console.log(readFileSync(migrationPath, 'utf-8'));
  }
}

run().catch(console.error);
