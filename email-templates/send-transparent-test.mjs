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

console.log('📧 Enviando test con logos TRANSPARENTES\n');

await transporter.sendMail({
  from: `"Claudio — OpenClaw (TRANSPARENT TEST)" <${env.GMAIL_USER}>`,
  to: 'webmaster@masize.com',
  subject: '[TEST TRANSPARENTE] Logo con fondo transparente — OpenClaw ✨',
  html: html,
});

console.log('✅ Email enviado');
console.log('\n✨ Cambios aplicados:');
console.log('- Fondo blanco removido → PNG transparente');
console.log('- Forma del logo: 100% mantenida');
console.log('- Dimensiones: 740x175 (exactas)');
console.log('\n🎨 URLs:');
console.log('Light: https://files.catbox.moe/h58d87.png (fondo transparente)');
console.log('Dark: https://files.catbox.moe/vt08za.png (invertido + transparente)');
