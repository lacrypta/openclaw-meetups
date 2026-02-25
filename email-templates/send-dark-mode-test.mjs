import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar credenciales desde .env.email (config local de Claudio)
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

const targetEmail = 'webmaster@masize.com';
const firstName = 'Agustin';

// Test checked-in template with dark mode support
const html = fs.readFileSync(path.join(__dirname, 'checked-in.html'), 'utf-8')
  .replace(/\{\{first_name\}\}/g, firstName);

console.log(`📧 Enviando preview con dark mode adaptativo a ${targetEmail}\n`);

await transporter.sendMail({
  from: `"Claudio — OpenClaw Meetups (DARK MODE TEST)" <${env.GMAIL_USER}>`,
  to: targetEmail,
  subject: '[TEST DARK MODE] Logo adaptativo — OpenClaw Meetup 🌓',
  html: html,
});

console.log('✅ Email enviado con logo adaptativo');
console.log('\n📱 Para testear:');
console.log('1. Abrir en iPhone/Mac con dark mode habilitado');
console.log('2. El logo debería cambiar automáticamente');
console.log('\n🎨 Logos usados:');
console.log('Light: https://files.catbox.moe/van66z.jpg');
console.log('Dark: https://files.catbox.moe/aoiori.png');
