import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://gpfoxevxvhltjzppeacr.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

async function main() {
  const { data: all } = await supabase.from('attendees').select('status, checked_in, email_sent');
  
  const checkedIn = all.filter(a => a.status === 'approved' && a.checked_in === true);
  const noShow = all.filter(a => a.status === 'approved' && a.checked_in === false);
  const waitlist = all.filter(a => a.status === 'waitlist');
  
  const checkedInUnsent = checkedIn.filter(a => !a.email_sent);
  const noShowUnsent = noShow.filter(a => !a.email_sent);
  const waitlistUnsent = waitlist.filter(a => !a.email_sent);
  
  console.log('📊 Contact Counts:\n');
  console.log(`Checked-in: ${checkedIn.length} total, ${checkedInUnsent.length} unsent`);
  console.log(`No-show: ${noShow.length} total, ${noShowUnsent.length} unsent`);
  console.log(`Waitlist: ${waitlist.length} total, ${waitlistUnsent.length} unsent`);
  console.log(`\nTotal: ${all.length} contacts`);
}

main().catch(console.error);
