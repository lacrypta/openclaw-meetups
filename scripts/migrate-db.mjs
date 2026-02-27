#!/usr/bin/env node
/**
 * Auto-migrate Supabase database - like Prisma migrations
 * Runs automatically before dev/build
 * 
 * Behavior:
 * - Local dev: applies migrations to local Supabase (requires `supabase start`)
 * - Production: applies migrations to remote Supabase via DATABASE_URL
 * - CI/CD: can be run with --linked flag (uses supabase link)
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Load .env.local so DATABASE_URL is available outside of Next.js
config({ path: '.env.local' });

const MIGRATIONS_DIR = './supabase/migrations';
const REQUIRED_CONTAINER = 'supabase_db';

/**
 * Check if there are any migrations to apply
 */
function hasMigrations() {
  if (!existsSync(MIGRATIONS_DIR)) {
    console.log('ℹ️  No migrations directory found');
    return false;
  }
  
  const files = readdirSync(MIGRATIONS_DIR).filter(f => f.endsWith('.sql'));
  if (files.length === 0) {
    console.log('ℹ️  No SQL migrations found');
    return false;
  }
  
  console.log(`📄 Found ${files.length} migration file(s)`);
  return true;
}

/**
 * Check if local Supabase is running
 */
function isSupabaseRunning() {
  try {
    const output = execSync('docker ps --format "{{.Names}}"', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return output.includes(REQUIRED_CONTAINER);
  } catch (error) {
    return false;
  }
}

/**
 * Apply migrations to local Supabase
 */
function migrateLocal() {
  try {
    console.log('🔄 Applying migrations to local Supabase...');
    execSync('npx supabase db push', {
      encoding: 'utf-8',
      stdio: 'inherit'
    });
    console.log('✅ Local migrations applied successfully\n');
    return true;
  } catch (error) {
    console.error('❌ Failed to apply local migrations');
    if (error.message.includes('No such container')) {
      console.error('   Run: npx supabase start');
    }
    return false;
  }
}

/**
 * Ensure the URL uses the direct connection (port 5432) instead of the
 * pgbouncer pooler (port 6543) which doesn't support prepared statements
 * needed by supabase db push.
 */
function toDirectConnection(dbUrl) {
  return dbUrl.replace(/pooler\.supabase\.com:6543/, 'pooler.supabase.com:5432');
}

/**
 * Apply migrations to remote Supabase (production)
 */
function migrateRemote(dbUrl) {
  const directUrl = toDirectConnection(dbUrl);
  try {
    console.log('🔄 Applying migrations to remote Supabase...');
    execSync(`npx supabase db push --db-url "${directUrl}"`, {
      encoding: 'utf-8',
      stdio: 'inherit'
    });
    console.log('✅ Remote migrations applied successfully\n');
    return true;
  } catch (error) {
    console.error('❌ Failed to apply remote migrations');
    return false;
  }
}

/**
 * Get database connection URL for production
 */
function getDatabaseUrl() {
  // Try different env var names
  const candidates = [
    'DATABASE_URL',
    'SUPABASE_DB_URL',
    'POSTGRES_URL',
    'DB_CONNECTION_STRING'
  ];
  
  for (const name of candidates) {
    if (process.env[name]) {
      return process.env[name];
    }
  }
  
  // Construct from SUPABASE_URL if available
  if (process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)) {
    console.log('⚠️  No DATABASE_URL found - you need to set it for production migrations');
    console.log('   Get it from Supabase Dashboard → Settings → Database → Connection string');
    return null;
  }
  
  return null;
}

/**
 * Main migration function
 */
function migrate() {
  console.log('🔧 OpenClaw Meetups - Database Migration\n');
  
  // Check if we have migrations
  if (!hasMigrations()) {
    console.log('✅ No migrations to apply\n');
    return;
  }
  
  // Check environment
  const isProduction = process.env.VERCEL || process.env.NODE_ENV === 'production';
  const isCI = process.env.CI === 'true';
  
  if (isProduction) {
    console.log('🚀 Production environment detected');
    console.log('ℹ️  Skipping auto-migrations in production/Vercel builds');
    console.log('   Run migrations manually: npx supabase db push --db-url <DATABASE_URL>\n');
    return;
  } else {
    console.log('💻 Local development environment\n');
    
    // Check if Supabase is running
    if (!isSupabaseRunning()) {
      console.log('⚠️  Local Supabase is not running');
      console.log('   This is OK if you\'re using a remote database');
      console.log('   To use local Supabase, run: npx supabase start\n');
      
      // Check if there's a DATABASE_URL for fallback
      const dbUrl = getDatabaseUrl();
      if (dbUrl) {
        console.log('📡 Found DATABASE_URL - using remote database\n');
        if (!migrateRemote(dbUrl)) {
          process.exit(1);
        }
      } else {
        console.log('ℹ️  Skipping migrations (no local or remote database configured)\n');
      }
      return;
    }
    
    // Apply to local
    if (!migrateLocal()) {
      process.exit(1);
    }
  }
}

migrate();
