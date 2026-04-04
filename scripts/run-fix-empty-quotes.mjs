import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kxfbismfpmjwvemfznvm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI'
);

const roles = ['Store Manager', 'Assistant Store Manager', 'Store Team Lead'];

// Fetch workers needing fix
const { data, error } = await supabase
  .from('workers')
  .select('id, name, retailer_quotes, brands_worked')
  .not('retailer_quotes', 'is', null)
  .limit(2000);

if (error) {
  console.error(error);
  process.exit(1);
}

let updated = 0;
let failed = 0;

for (const w of data) {
  if (!w.retailer_quotes || !w.brands_worked || w.brands_worked.length === 0) continue;

  const hasEmptyQuotes = w.retailer_quotes.some(q => !q.brand || !q.role);
  if (!hasEmptyQuotes) continue;

  // Fix the quotes
  let brandIndex = 0;
  const fixedQuotes = w.retailer_quotes.map(q => {
    if (!q.brand || !q.role) {
      const brand = w.brands_worked[brandIndex % w.brands_worked.length].name;
      brandIndex++;
      const role = roles[Math.floor(Math.random() * roles.length)];
      return { ...q, brand, role };
    }
    return q;
  });

  // Update in Supabase
  const { error: updateError } = await supabase
    .from('workers')
    .update({ retailer_quotes: fixedQuotes })
    .eq('id', w.id);

  if (updateError) {
    console.error(`Failed to update ${w.name}:`, updateError);
    failed++;
  } else {
    updated++;
  }
}

console.log(`Updated: ${updated}`);
console.log(`Failed: ${failed}`);
