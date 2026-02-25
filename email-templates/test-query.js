import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || 'https://gpfoxevxvhltjzppeacr.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

async function main() {
  const { data, error } = await supabase
    .from('attendees')
    .select('*')
    .match({ status: 'approved', checked_in: true })
    .is('email_sent', null)
    .limit(3);
  
  if (error) {
    console.error('Error:', error);
  } else {
    console.log(`Found ${data?.length || 0} contacts:`);
    data?.forEach(c => console.log(`  ${c.email} (${c.first_name})`));
  }
}

main().catch(console.error);
