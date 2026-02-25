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

console.log('📧 Enviando test con logo INVERTIDO (blanco↔negro)\n');

await transporter.sendMail({
  from: `"Claudio — OpenClaw (INVERTED LOGO TEST)" <${env.GMAIL_USER}>`,
  to: 'webmaster@masize.com',
  subject: '[TEST INVERTIDO] Logo con colores invertidos — OpenClaw 🎨',
  html: html,
});

console.log('✅ Email enviado');
console.log('\n🎨 Logos:');
console.log('Light: https://files.catbox.moe/van66z.jpg (original)');
console.log('Dark: https://files.catbox.moe/c4kmcx.png (invertido con Pillow)');
