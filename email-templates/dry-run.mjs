import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gpfoxevxvhltjzppeacr.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdwZm94ZXZ4dmhsdGp6cHBlYWNyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTk1OTE0MCwiZXhwIjoyMDg3NTM1MTQwfQ.X8tx2vL4523qbgUTaxc_FGstPjJstUmdQJ-c1YdGYk8'
);

// Get all attendees grouped by status
const { data, error } = await supabase
  .from('attendees')
  .select('id, first_name, last_name, email, status, email_sent, email_sent_at, email_type')
  .order('status');

if (error) { console.error('Error:', error); process.exit(1); }

// Group by status
const groups = {};
for (const a of data) {
  const s = a.status || 'unknown';
  if (!groups[s]) groups[s] = [];
  groups[s].push(a);
}

console.log('=== RESUMEN DE ENVÍO ===\n');
console.log(`Total attendees: ${data.length}`);
console.log('');

for (const [status, attendees] of Object.entries(groups).sort()) {
  const alreadySent = attendees.filter(a => a.email_sent);
  const noEmail = attendees.filter(a => !a.email);
  const toSend = attendees.filter(a => !a.email_sent && a.email);
  
  console.log(`--- ${status.toUpperCase()} (${attendees.length}) ---`);
  console.log(`  Ya enviados: ${alreadySent.length}`);
  console.log(`  Sin email: ${noEmail.length}`);
  console.log(`  A enviar: ${toSend.length}`);
  console.log('');
}

// Template mapping
const templateMap = {
  'checked-in': 'checked-in-v2.html',
  'approved': 'no-show.html',
  'waitlisted': 'waitlist.html'
};

console.log('=== TEMPLATE MAPPING ===\n');
for (const [status, file] of Object.entries(templateMap)) {
  const count = (groups[status] || []).filter(a => !a.email_sent && a.email).length;
  console.log(`  ${status} → ${file} (${count} emails)`);
}

// Show sample recipients per group (first 3 of each)
console.log('\n=== MUESTRAS POR GRUPO ===\n');
for (const [status, attendees] of Object.entries(groups).sort()) {
  const toSend = attendees.filter(a => !a.email_sent && a.email);
  console.log(`--- ${status.toUpperCase()} (primeros 3 de ${toSend.length}) ---`);
  for (const a of toSend.slice(0, 3)) {
    console.log(`  ${a.first_name} ${a.last_name || ''} <${a.email}>`);
  }
  console.log('');
}

// Check for issues
console.log('=== VALIDACIÓN ===\n');
const noEmailCount = data.filter(a => !a.email).length;
const duplicateEmails = data.map(a => a.email).filter((e, i, arr) => e && arr.indexOf(e) !== i);
const invalidEmails = data.filter(a => a.email && !a.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/));

console.log(`  ❓ Sin email: ${noEmailCount}`);
console.log(`  🔁 Emails duplicados: ${duplicateEmails.length} (${[...new Set(duplicateEmails)].join(', ') || 'ninguno'})`);
console.log(`  ⚠️  Emails inválidos: ${invalidEmails.length}`);
if (invalidEmails.length > 0) {
  for (const a of invalidEmails) console.log(`    → ${a.first_name}: ${a.email}`);
}

const alreadySentTotal = data.filter(a => a.email_sent).length;
console.log(`  ✅ Ya enviados previamente: ${alreadySentTotal}`);
console.log(`  📧 Total a enviar mañana: ${data.filter(a => !a.email_sent && a.email).length}`);

