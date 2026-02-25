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

// Variables de test
const testUser = {
  first_name: 'Agustin',
  email: 'webmaster@masize.com'
};

const html = fs.readFileSync(path.join(__dirname, 'checked-in.html'), 'utf-8')
  .replace(/\{\{first_name\}\}/g, testUser.first_name)
  .replace(/\{\{email\}\}/g, testUser.email);

console.log('📧 Enviando test con variables dinámicas de Tally\n');

await transporter.sendMail({
  from: `"Claudio — OpenClaw Meetups" <${env.GMAIL_USER}>`,
  to: testUser.email,
  subject: '[TEST] Tally con variables precargadas — OpenClaw',
  html: html,
});

console.log('✅ Email enviado');
console.log('\n🔗 Link de Tally con variables:');
console.log(`https://tally.so/r/J964LY?name=${testUser.first_name}&email=${testUser.email}`);
console.log('\n💡 Al hacer click, el form debería tener precargados:');
console.log(`- Nombre: ${testUser.first_name}`);
console.log(`- Email: ${testUser.email}`);
