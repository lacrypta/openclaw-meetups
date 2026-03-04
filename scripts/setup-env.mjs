#!/usr/bin/env node
/**
 * Auto-setup environment variables for OpenClaw Meetups
 * Similar to Prisma migrations - runs automatically before build
 * 
 * Priority:
 * 1. Use existing .env.local if valid
 * 2. Try to generate from `supabase status` (local dev)
 * 3. Fall back to .env.example template
 * 4. For production: use Vercel env vars (no .env.local needed)
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const ENV_LOCAL_PATH = '.env.local';
const ENV_EXAMPLE_PATH = '.env.example';

const REQUIRED_VARS = [
  'SUPABASE_URL',
  'JWT_SECRET',
  'ALLOWED_PUBKEYS'
];

// Either name works: SUPABASE_SERVICE_KEY (local) or SUPABASE_SERVICE_ROLE_KEY (Vercel integration)
const REQUIRED_ONE_OF = [['SUPABASE_SERVICE_KEY', 'SUPABASE_SERVICE_ROLE_KEY']];

/**
 * Check if .env.local exists and has all required variables
 */
function validateEnvFile(path) {
  if (!existsSync(path)) return false;
  
  const content = readFileSync(path, 'utf-8');
  const hasVar = (name) => new RegExp(`^${name}=.+`, 'm').test(content);

  const missingVars = REQUIRED_VARS.filter(v => !hasVar(v));
  const missingOneOf = REQUIRED_ONE_OF.filter(group => !group.some(hasVar));

  const allMissing = [...missingVars, ...missingOneOf.map(g => g.join(' or '))];
  if (allMissing.length > 0) {
    console.warn(`⚠️  Missing variables in ${path}:`, allMissing.join(', '));
    return false;
  }

  return true;
}

/**
 * Try to get env vars from Supabase CLI (local development)
 */
function getSupabaseEnv() {
  try {
    console.log('🔍 Checking local Supabase instance...');
    const output = execSync('npx supabase status -o env', {
      encoding: 'utf-8',
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    if (output && output.includes('API_URL')) {
      console.log('✅ Found running Supabase instance');
      return output;
    }
  } catch (error) {
    console.log('ℹ️  Local Supabase not running (this is OK for production builds)');
  }
  return null;
}

/**
 * Convert supabase status output to .env format
 */
function convertSupabaseEnvToLocal(supabaseEnv) {
  const lines = supabaseEnv.split('\n');
  const envMap = {
    'API_URL': 'SUPABASE_URL',
    'SERVICE_ROLE_KEY': 'SUPABASE_SERVICE_KEY'
  };
  
  let result = '';
  for (const line of lines) {
    const [key, value] = line.split('=');
    if (envMap[key]) {
      result += `${envMap[key]}=${value}\n`;
    }
  }
  
  // Add placeholders for other required vars
  if (!result.includes('JWT_SECRET')) {
    result += 'JWT_SECRET=your-random-secret-here\n';
  }
  if (!result.includes('ALLOWED_PUBKEYS')) {
    result += 'ALLOWED_PUBKEYS=hex-pubkey-1,hex-pubkey-2\n';
  }
  
  return result;
}

/**
 * Main setup function
 */
function setup() {
  console.log('🔧 OpenClaw Meetups - Environment Setup\n');
  
  // Check if we're in production (Vercel)
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    console.log('🚀 Production environment detected');
    console.log('✅ Using Vercel environment variables');
    
    // Validate that required vars exist in process.env
    const missing = REQUIRED_VARS.filter(v => !process.env[v]);
    const missingOneOf = REQUIRED_ONE_OF.filter(group => !group.some(v => process.env[v]));
    const allMissing = [...missing, ...missingOneOf.map(g => g.join(' or '))];
    if (allMissing.length > 0) {
      console.error('❌ Missing required environment variables:', allMissing.join(', '));
      console.error('   Configure them in Vercel dashboard');
      process.exit(1);
    }
    
    console.log('✅ All required variables present\n');
    return;
  }
  
  // Local development
  console.log('💻 Local development environment\n');
  
  // 1. Check existing .env.local
  if (validateEnvFile(ENV_LOCAL_PATH)) {
    console.log('✅ Found valid .env.local');
    console.log('   Using existing configuration\n');
    return;
  }
  
  // 2. Try to generate from Supabase CLI
  const supabaseEnv = getSupabaseEnv();
  if (supabaseEnv) {
    console.log('📝 Generating .env.local from Supabase CLI...');
    const envContent = convertSupabaseEnvToLocal(supabaseEnv);
    writeFileSync(ENV_LOCAL_PATH, envContent);
    console.log('✅ Created .env.local\n');
    return;
  }
  
  // 3. Fall back to .env.example
  if (existsSync(ENV_EXAMPLE_PATH)) {
    console.log('📋 Creating .env.local from .env.example...');
    const exampleContent = readFileSync(ENV_EXAMPLE_PATH, 'utf-8');
    writeFileSync(ENV_LOCAL_PATH, exampleContent);
    console.log('⚠️  Created .env.local - You need to fill in real values!');
    console.log('   Run: npx supabase start\n');
    return;
  }
  
  // 4. No options available
  console.error('❌ Could not set up environment variables');
  console.error('   Please create .env.local manually or run: npx supabase start');
  process.exit(1);
}

setup();
