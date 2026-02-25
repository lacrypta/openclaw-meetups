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

console.log('📧 Enviando test con LOGO OFICIAL La Crypta\n');

await transporter.sendMail({
  from: `"Claudio — OpenClaw (OFFICIAL LOGO)" <${env.GMAIL_USER}>`,
  to: 'webmaster@masize.com',
  subject: '[OFICIAL] Logo desde repo La Crypta — OpenClaw 🎨',
  html: html,
});

console.log('✅ Email enviado con logo oficial');
console.log('\n📦 Fuente: https://github.com/lacrypta/branding/blob/main/title/512-white.png');
console.log('📐 Dimensiones: 512x119');
console.log('\n🎨 URLs:');
console.log('Light: https://files.catbox.moe/b75xsh.png (blanco)');
console.log('Dark: https://files.catbox.moe/udoi7p.png (negro)');
