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

console.log('📧 Enviando test FINAL con colores CORREGIDOS\n');

await transporter.sendMail({
  from: `"Claudio — OpenClaw Meetups" <${env.GMAIL_USER}>`,
  to: 'webmaster@masize.com',
  subject: '✅ FINAL - Logo adaptativo corregido — OpenClaw',
  html: html,
});

console.log('✅ Email enviado con configuración correcta');
console.log('\n🎨 Configuración CORRECTA:');
console.log('Light mode (fondo claro) → Logo NEGRO (512-black.png)');
console.log('Dark mode (fondo oscuro) → Logo BLANCO (512-white.png)');
console.log('\n📦 URLs directas del repo oficial (sin modificaciones)');
