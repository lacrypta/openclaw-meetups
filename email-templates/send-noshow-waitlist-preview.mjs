import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'claudiomoltbot@gmail.com',
    pass: 'kore sezu yvxy ebfu'
  }
});

const templates = [
  { file: 'no-show.html', subject: '[PREVIEW] OpenClaw Meetup — No-Show Template', name: 'Agustin' },
  { file: 'waitlist.html', subject: '[PREVIEW] OpenClaw Meetup — Waitlist Template', name: 'Agustin' }
];

for (const t of templates) {
  let html = readFileSync(t.file, 'utf8').replace(/\{\{first_name\}\}/g, t.name);
  
  const info = await transporter.sendMail({
    from: '"OpenClaw Meetups" <claudiomoltbot@gmail.com>',
    to: 'webmaster@masize.com',
    subject: t.subject,
    html
  });
  
  console.log(`✅ ${t.file} sent: ${info.messageId}`);
}

process.exit(0);
