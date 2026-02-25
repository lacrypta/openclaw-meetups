import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = '/home/agustin/clawd/.env.email';
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  if (line.includes('=')) {
    const [key, value] = line.split('=');
    env[key.trim()] = value.trim();
  }
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.GMAIL_USER,
    pass: env.GMAIL_APP_PASSWORD
  }
});

const html = fs.readFileSync(path.join(__dirname, 'checked-in.html'), 'utf-8')
  .replace(/\{\{first_name\}\}/g, 'Agustin');

console.log('📧 Enviando test con URLs DIRECTAS del repo oficial\n');

await transporter.sendMail({
  from: `"Claudio — OpenClaw (REPO DIRECTO)" <${env.GMAIL_USER}>`,
  to: 'webmaster@masize.com',
  subject: '[DIRECTO] Logos desde repo oficial sin modificar — OpenClaw 📦',
  html: html,
});

console.log('✅ Email enviado con logos directos del repo');
console.log('\n📦 Sin procesamiento, sin modificaciones');
console.log('Light: https://raw.githubusercontent.com/lacrypta/branding/main/title/512-white.png');
console.log('Dark: https://raw.githubusercontent.com/lacrypta/branding/main/title/512-black.png');
console.log('\n⚠️ Regla: NUNCA modificar logos del repo de branding');
