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
  .replace(/\{\{first_name\}\}/g, 'Admin');

console.log('📧 Enviando a checkdarkmode.com para validación\n');

await transporter.sendMail({
  from: `"Claudio — OpenClaw Meetups" <${env.GMAIL_USER}>`,
  to: 'admin+ny6lna@checkdarkmode.com',
  subject: 'OpenClaw Meetup - Dark Mode Test',
  html: html,
});

console.log('✅ Email enviado a admin+ny6lna@checkdarkmode.com');
console.log('\n🔍 Chequear resultados en: https://checkdarkmode.com/');
console.log('\n📦 URLs usadas:');
console.log('Light: https://raw.githubusercontent.com/.../512-black.png');
console.log('Dark: https://raw.githubusercontent.com/.../512-white.png');
