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

console.log('📧 Enviando test CORREGIDO - Logo blanco en light mode\n');

await transporter.sendMail({
  from: `"Claudio — OpenClaw (CORRECTED)" <${env.GMAIL_USER}>`,
  to: 'webmaster@masize.com',
  subject: '[CORREGIDO] Logo blanco en light mode — OpenClaw ⚪',
  html: html,
});

console.log('✅ Email enviado');
console.log('\n✅ Configuración correcta ahora:');
console.log('Light mode (fondos claros): Logo BLANCO');
console.log('Dark mode (fondos oscuros): Logo NEGRO');
console.log('\n🎨 URLs:');
console.log('Light: https://files.catbox.moe/vt08za.png (blanco)');
console.log('Dark: https://files.catbox.moe/h58d87.png (negro)');
