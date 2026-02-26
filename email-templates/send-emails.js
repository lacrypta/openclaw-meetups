/**
 * Send personalized follow-up emails to OpenClaw Meetup attendees
 * Usage: node send-emails.js [checked-in|no-show|waitlist] [--dry-run] [--limit N] [--concurrency N] [--retries N]
 * 
 * Optimizations:
 * - Connection pooling (reuses SMTP connections)
 * - Auto-retry on transient failures (default: 3 retries with exponential backoff)
 * - Configurable concurrency (default: 3 parallel sends)
 * - Timestamped logging with per-email timing
 * - Failed emails logged to send-failed.json for easy retry
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://gpfoxevxvhltjzppeacr.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_KEY');
  process.exit(1);
}

// SMTP Configuration
let SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, EMAIL_FROM;

async function loadSmtpConfig() {
  try {
    const { data, error } = await supabase
      .from('email_integrations')
      .select('*')
      .eq('is_default', true)
      .single();

    if (data && data.config) {
      const config = JSON.parse(data.config);
      log(`✅ Loaded SMTP config from email_integrations (${data.name})`);
      SMTP_HOST = config.host;
      SMTP_PORT = config.port;
      SMTP_SECURE = config.secure;
      SMTP_USER = config.username;
      SMTP_PASS = config.password;
      EMAIL_FROM = config.from_email;
      return true;
    }
  } catch (err) {
    log(`⚠️  Failed to load SMTP from Supabase: ${err.message}`);
  }

  // Fallback to environment variables
  log('📋 Fallback: using SMTP config from environment variables');
  SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
  SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
  SMTP_SECURE = process.env.SMTP_SECURE !== 'false';
  SMTP_USER = process.env.SMTP_USER;
  SMTP_PASS = process.env.SMTP_PASS;
  EMAIL_FROM = process.env.EMAIL_FROM || SMTP_USER;

  if (!SMTP_USER || !SMTP_PASS) {
    console.error('❌ Missing SMTP credentials (not in Supabase or env vars)');
    process.exit(1);
  }
  
  return true;
}

// Parse args
const args = process.argv.slice(2);
const segment = args.find(a => ['checked-in', 'no-show', 'waitlist'].includes(a)) || 'checked-in';
const dryRun = args.includes('--dry-run');

function getArgValue(flag, defaultVal) {
  const idx = args.indexOf(flag);
  return idx >= 0 ? parseInt(args[idx + 1]) : defaultVal;
}

const limit = getArgValue('--limit', null);
const concurrency = getArgValue('--concurrency', 3);
const maxRetries = getArgValue('--retries', 3);

// Setup
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Timestamped logging
function log(msg) {
  const ts = new Date().toISOString().replace('T', ' ').slice(0, 19);
  console.log(`[${ts}] ${msg}`);
}

// Segment configs
const SEGMENTS = {
  'checked-in': {
    filter: { status: 'approved', checked_in: true },
    template: 'checked-in.html',
    subject: '¡Gracias por venir al OpenClaw Meetup! 🚀',
    emailType: 'checked-in',
  },
  'no-show': {
    filter: { status: 'approved', checked_in: false },
    template: 'no-show.html',
    subject: 'Te perdiste un buen meetup (pero seguimos en contacto) ⚡',
    emailType: 'no-show',
  },
  'waitlist': {
    filter: { status: 'waitlist' },
    template: 'waitlist.html',
    subject: 'Próximo OpenClaw Meetup — tenés prioridad ⚡',
    emailType: 'waitlist',
  },
};

const config = SEGMENTS[segment];

// Retry with exponential backoff
async function sendWithRetry(transporter, mailOptions, retries) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await transporter.sendMail(mailOptions);
      return { success: true, attempts: attempt };
    } catch (err) {
      if (attempt === retries) {
        return { success: false, attempts: attempt, error: err.message };
      }
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 8000); // 1s, 2s, 4s, max 8s
      log(`  ⚠️  Attempt ${attempt}/${retries} failed: ${err.message}. Retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// Process a single contact
async function processContact(transporter, contact, template, stats) {
  const start = Date.now();
  const firstName = contact.first_name || contact.name.split(' ')[0];
  const fullName = contact.name || `${contact.first_name} ${contact.last_name}`.trim();
  const html = template
    .replace(/\{\{first_name\}\}/g, firstName)
    .replace(/\{\{name\}\}/g, encodeURIComponent(fullName))
    .replace(/\{\{email\}\}/g, encodeURIComponent(contact.email));

  if (dryRun) {
    log(`→ ${contact.email} (${firstName}) [DRY RUN]`);
    return;
  }

  const result = await sendWithRetry(transporter, {
    from: `"Claudio — OpenClaw" <${EMAIL_FROM}>`,
    to: contact.email,
    subject: config.subject,
    html: html,
  }, maxRetries);

  const elapsed = Date.now() - start;

  if (result.success) {
    // Mark as sent
    await supabase
      .from('attendees')
      .update({
        email_sent: true,
        email_sent_at: new Date().toISOString(),
        email_type: config.emailType,
      })
      .eq('id', contact.id);

    log(`✅ ${contact.email} (${firstName}) — ${elapsed}ms${result.attempts > 1 ? ` (${result.attempts} attempts)` : ''}`);
    stats.sent++;
    stats.totalTime += elapsed;
  } else {
    log(`❌ ${contact.email} (${firstName}) — FAILED after ${result.attempts} attempts: ${result.error} (${elapsed}ms)`);
    stats.failed++;
    stats.failures.push({
      id: contact.id,
      email: contact.email,
      name: contact.name,
      error: result.error,
      attempts: result.attempts,
      elapsed_ms: elapsed,
    });
  }
}

// Chunked parallel execution
async function processInBatches(transporter, contacts, template, stats) {
  for (let i = 0; i < contacts.length; i += concurrency) {
    const batch = contacts.slice(i, i + concurrency);
    const batchNum = Math.floor(i / concurrency) + 1;
    const totalBatches = Math.ceil(contacts.length / concurrency);
    
    log(`📦 Batch ${batchNum}/${totalBatches} (${batch.length} emails)`);
    
    await Promise.all(
      batch.map(contact => processContact(transporter, contact, template, stats))
    );

    // Small delay between batches to avoid hammering SMTP
    if (i + concurrency < contacts.length) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

async function main() {
  const globalStart = Date.now();

  await loadSmtpConfig();

  // Resolve SMTP host to IPv4
  const dns = await import('node:dns');
  let smtpIp = SMTP_HOST;
  try {
    const { address } = await dns.promises.lookup(SMTP_HOST, { family: 4 });
    smtpIp = address;
    log(`📡 Resolved ${SMTP_HOST} → ${smtpIp} (IPv4)`);
  } catch (e) {
    log(`⚠️  DNS lookup failed, using hostname: ${e.message}`);
  }

  const useSecure = SMTP_PORT === 465;

  // Connection pooling: reuses connections across sends
  const transporter = nodemailer.createTransport({
    host: smtpIp,
    port: SMTP_PORT,
    secure: useSecure,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
    tls: {
      servername: SMTP_HOST,
    },
    pool: true,           // Enable connection pooling
    maxConnections: concurrency,  // Match concurrency
    maxMessages: 100,     // Messages per connection before reconnect
    rateDelta: 1000,      // 1 second window
    rateLimit: 5,         // Max 5 messages per second
  });

  log(`\n📧 OpenClaw Meetup Email Campaign`);
  log(`Segment: ${segment}`);
  log(`Template: ${config.template}`);
  log(`Subject: ${config.subject}`);
  log(`Dry run: ${dryRun ? 'YES' : 'NO'}`);
  log(`Concurrency: ${concurrency}`);
  log(`Max retries: ${maxRetries}`);
  if (limit) log(`Limit: ${limit}`);
  log('');

  // Load template
  const templatePath = path.join(__dirname, config.template);
  const template = fs.readFileSync(templatePath, 'utf-8');

  // Fetch contacts
  let query = supabase
    .from('attendees')
    .select('*')
    .match(config.filter)
    .eq('email_sent', false)
    .order('registered_at', { ascending: false, nullsFirst: false });

  if (limit) query = query.limit(limit);

  const { data: contacts, error } = await query;

  if (error) {
    console.error('❌ Supabase error:', error);
    process.exit(1);
  }

  if (!contacts || contacts.length === 0) {
    log('✅ No contacts to send (all already sent or empty segment)');
    return;
  }

  log(`📋 Found ${contacts.length} contacts to send\n`);

  const stats = { sent: 0, failed: 0, totalTime: 0, failures: [] };

  // Send in parallel batches
  await processInBatches(transporter, contacts, template, stats);

  // Close pool
  transporter.close();

  const totalElapsed = Date.now() - globalStart;
  const avgTime = stats.sent > 0 ? Math.round(stats.totalTime / stats.sent) : 0;

  log(`\n📊 Summary:`);
  log(`  ✅ Sent: ${stats.sent}`);
  log(`  ❌ Failed: ${stats.failed}`);
  log(`  📋 Total: ${contacts.length}`);
  log(`  ⏱️  Total time: ${(totalElapsed / 1000).toFixed(1)}s`);
  log(`  ⚡ Avg per email: ${avgTime}ms`);
  log(`  🚀 Throughput: ${(stats.sent / (totalElapsed / 1000) * 60).toFixed(1)} emails/min`);

  // Save failures to file for easy retry
  if (stats.failures.length > 0) {
    const failPath = path.join(__dirname, 'send-failed.json');
    fs.writeFileSync(failPath, JSON.stringify(stats.failures, null, 2));
    log(`\n💾 Failed emails saved to: ${failPath}`);
    log(`   Retry with: node send-emails.js ${segment} --limit ${stats.failures.length}`);
  }
}

main().catch(console.error);
