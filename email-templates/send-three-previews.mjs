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

const templates = [
  { file: 'checked-in.html', subject: '[PREVIEW 1/3] ¡Gracias por venir al OpenClaw Meetup! 🚀' },
  { file: 'no-show.html', subject: '[PREVIEW 2/3] Te perdiste el OpenClaw Meetup — próxima oportunidad 🔥' },
  { file: 'waitlist.html', subject: '[PREVIEW 3/3] Lista de espera — OpenClaw Meetup ⏳' }
];

console.log(`📧 Enviando 3 previews a ${targetEmail}\n`);

for (const template of templates) {
  const html = fs.readFileSync(path.join(__dirname, template.file), 'utf-8')
    .replace(/\{\{first_name\}\}/g, firstName);
  
  await transporter.sendMail({
    from: `"Claudio — OpenClaw Meetups (PREVIEW)" <${env.GMAIL_USER}>`,
    to: targetEmail,
    subject: template.subject,
    html: html,
  });
  
  console.log(`✅ ${template.file} enviado`);
  
  // Esperar 2 segundos entre emails
  await new Promise(resolve => setTimeout(resolve, 2000));
}

console.log('\n🎉 Los 3 previews fueron enviados exitosamente');
