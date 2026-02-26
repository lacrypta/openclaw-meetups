import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
import { readFileSync } from 'fs';

const supabase = createClient(
  'https://gpfoxevxvhltjzppeacr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZm94ZXZ4dmhsdGp6cHBlYWNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk1OTE0MCwiZXhwIjoyMDg3NTM1MTQwfQ.X8tx2vL4523qbgUTaxc_FGstPjJstUmdQJ-c1YdGYk8'
);

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', port: 465, secure: true,
  auth: { user: 'claudiomoltbot@gmail.com', pass: 'kore sezu yvxy ebfu' }
});

const { data } = await supabase.from('attendees').select('*');

// Pick one sample from each group
const checkedIn = data.filter(a => a.status === 'approved' && a.checked_in_at);
const noShow = data.filter(a => a.status === 'approved' && !a.checked_in_at);
const waitlist = data.filter(a => a.status !== 'approved');
console.log('Waitlist statuses:', [...new Set(waitlist.map(a => a.status))]);

const samples = [
  { group: 'CHECKED-IN', person: checkedIn[1], template: 'checked-in-v2.html', subject: 'Gracias por venir al OpenClaw Meetup' },
  { group: 'NO-SHOW', person: noShow[0], template: 'no-show.html', subject: 'Te perdiste el OpenClaw Meetup — Resumen' },
  { group: 'WAITLIST', person: waitlist[0], template: 'waitlist.html', subject: 'OpenClaw Meetup — Próximos eventos' }
];

for (const s of samples) {
  let html = readFileSync(s.template, 'utf8')
    .replace(/\{\{first_name\}\}/g, s.person.first_name || 'Amigo')
    .replace(/\{\{email\}\}/g, encodeURIComponent(s.person.email));
  
  const subjectWithSample = `[SAMPLE: ${s.group}] ${s.subject}`;
  
  console.log(`\n📧 ${s.group}:`);
  console.log(`   Persona real: ${s.person.first_name} ${s.person.last_name || ''} <${s.person.email}>`);
  console.log(`   Template: ${s.template}`);
  console.log(`   Subject: ${subjectWithSample}`);
  console.log(`   Enviando a: webmaster@masize.com (NO al destinatario real)`);
  
  const info = await transporter.sendMail({
    from: '"OpenClaw Meetups" <claudiomoltbot@gmail.com>',
    to: 'webmaster@masize.com',
    subject: subjectWithSample,
    html
  });
  
  console.log(`   ✅ Enviado: ${info.messageId}`);
}

console.log('\n=== RESUMEN ===');
console.log(`Checked-in: ${checkedIn.length} personas`);
console.log(`No-show: ${noShow.length} personas`);
console.log(`Waitlist: ${waitlist.length} personas`);
console.log(`Total: ${data.length}`);
console.log('\n⚠️  Estos emails se enviaron SOLO a webmaster@masize.com como muestra.');
console.log('Los nombres y variables se reemplazaron con datos reales de la base.');

