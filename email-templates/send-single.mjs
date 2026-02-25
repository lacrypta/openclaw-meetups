import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GMAIL_USER = process.env.GMAIL_USER || 'claudiomoltbot@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

if (!GMAIL_APP_PASSWORD) {
  console.error('❌ Missing GMAIL_APP_PASSWORD');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
});

const targetEmail = process.argv[2] || 'webmaster@masize.com';
const html = fs.readFileSync(path.join(__dirname, 'checked-in.html'), 'utf-8')
  .replace(/\{\{first_name\}\}/g, 'Agustin');

console.log(`📧 Enviando preview checked-in a ${targetEmail}\n`);

await transporter.sendMail({
  from: `"Claudio — OpenClaw (PREVIEW)" <${GMAIL_USER}>`,
  to: targetEmail,
  subject: '[PREVIEW] ¡Gracias por venir al OpenClaw Meetup! 🚀',
  html: html,
});

console.log('✅ Enviado');
