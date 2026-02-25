/**
 * Send personalized follow-up emails to OpenClaw Meetup attendees
 * Usage: node send-emails.js [--segment checked-in|no-show|waitlist] [--dry-run] [--limit N]
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

// SMTP Configuration
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '465');
const SMTP_SECURE = process.env.SMTP_SECURE !== 'false'; // true by default
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || SMTP_USER;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_KEY');
  process.exit(1);
}

if (!SMTP_USER || !SMTP_PASS) {
  console.error('❌ Missing SMTP_USER or SMTP_PASS');
  process.exit(1);
}

// Parse args
const args = process.argv.slice(2);
const segment = args.find(a => ['checked-in', 'no-show', 'waitlist'].includes(a)) || 'checked-in';
const dryRun = args.includes('--dry-run');
const limitIndex = args.indexOf('--limit');
const limit = limitIndex >= 0 ? parseInt(args[limitIndex + 1]) : null;

// Setup
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: SMTP_SECURE,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

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

async function main() {
  console.log(`\n📧 OpenClaw Meetup Email Campaign`);
  console.log(`Segment: ${segment}`);
  console.log(`Template: ${config.template}`);
  console.log(`Subject: ${config.subject}`);
  console.log(`Dry run: ${dryRun ? 'YES' : 'NO'}`);
  if (limit) console.log(`Limit: ${limit}`);
  console.log('');

  // Load template
  const templatePath = path.join(__dirname, config.template);
  const template = fs.readFileSync(templatePath, 'utf-8');

  // Fetch contacts
  let query = supabase
    .from('attendees')
    .select('*')
    .match(config.filter)
    .eq('email_sent', false); // Only unsent

  if (limit) query = query.limit(limit);

  const { data: contacts, error } = await query;

  if (error) {
    console.error('❌ Supabase error:', error);
    process.exit(1);
  }

  if (!contacts || contacts.length === 0) {
    console.log('✅ No contacts to send (all already sent or empty segment)');
    return;
  }

  console.log(`📋 Found ${contacts.length} contacts to send\n`);

  let sent = 0;
  let failed = 0;

  for (const contact of contacts) {
    const firstName = contact.first_name || contact.name.split(' ')[0];
    const html = template.replace(/\{\{first_name\}\}/g, firstName);

    console.log(`→ ${contact.email} (${firstName})`);

    if (dryRun) {
      console.log('  [DRY RUN] Would send email');
      continue;
    }

    try {
      await transporter.sendMail({
        from: `"Claudio — OpenClaw" <${EMAIL_FROM}>`,
        to: contact.email,
        subject: config.subject,
        html: html,
      });

      // Mark as sent in Supabase
      await supabase
        .from('attendees')
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString(),
          email_type: config.emailType,
        })
        .eq('luma_id', contact.luma_id);

      console.log('  ✅ Sent');
      sent++;

      // Rate limit: 2 seconds between sends
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error('  ❌ Failed:', error.message);
      failed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`  Sent: ${sent}`);
  console.log(`  Failed: ${failed}`);
  console.log(`  Total: ${contacts.length}`);
}

main().catch(console.error);
