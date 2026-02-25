import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://gpfoxevxvhltjzppeacr.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
);

async function main() {
  const { data } = await supabase
    .from('attendees')
    .select('status, checked_in, email_sent, first_name, email')
    .limit(5);
  
  console.log('Sample data:');
  data?.forEach(c => console.log(JSON.stringify(c)));
}

main().catch(console.error);
