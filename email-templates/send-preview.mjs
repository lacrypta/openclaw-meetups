import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GMAIL_USER = process.env.GMAIL_USER || 'claudiomoltbot@gmail.com';
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

if (!GMAIL_APP_PASSWORD) {
  console.error('❌ Missing GMAIL_APP_PASSWORD');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
});

const templates = [
  {
    file: 'checked-in.html',
    subject: '[PREVIEW 1/3] Checked-in - ¡Gracias por venir al OpenClaw Meetup! 🚀',
    description: 'Para los 61 que asistieron'
  },
  {
    file: 'no-show.html',
    subject: '[PREVIEW 2/3] No-show - Te perdiste un buen meetup ⚡',
    description: 'Para los 86 que se registraron pero no fueron'
  },
  {
    file: 'waitlist.html',
    subject: '[PREVIEW 3/3] Waitlist - Próximo meetup tenés prioridad ⚡',
    description: 'Para los 33 en lista de espera'
  }
];

const targetEmail = process.argv[2] || 'webmaster@masize.com';

console.log(`📧 Enviando 3 previews a ${targetEmail}\n`);

for (const template of templates) {
  const html = fs.readFileSync(path.join(__dirname, template.file), 'utf-8')
    .replace(/\{\{first_name\}\}/g, 'Agustin');
  
  console.log(`→ ${template.file}`);
  console.log(`  ${template.description}`);
  
  try {
    await transporter.sendMail({
      from: `"Claudio — OpenClaw (PREVIEW)" <${GMAIL_USER}>`,
      to: targetEmail,
      subject: template.subject,
      html: html,
    });
    console.log('  ✅ Enviado\n');
    
    // Wait 2 seconds between emails
    await new Promise(resolve => setTimeout(resolve, 2000));
  } catch (error) {
    console.error('  ❌ Error:', error.message);
  }
}

console.log('✅ Los 3 templates fueron enviados. Revisá tu inbox.');
