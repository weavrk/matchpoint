import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kxfbismfpmjwvemfznvm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI'
);

const roles = ['Store Manager', 'Assistant Store Manager', 'Store Team Lead'];

// Fetch all workers
const { data, error } = await supabase
  .from('workers')
  .select('id, name, retailer_quotes, brands_worked')
  .not('retailer_quotes', 'is', null)
  .limit(2000);

if (error) {
  console.error(error);
  process.exit(1);
}

let needsFix = 0;
let totalEmptyQuotes = 0;
const sqlStatements = [];

data.forEach(w => {
  if (!w.retailer_quotes || !w.brands_worked || w.brands_worked.length === 0) return;

  const hasEmptyQuotes = w.retailer_quotes.some(q => !q.brand || !q.role);
  if (!hasEmptyQuotes) return;

  needsFix++;

  // Fix the quotes
  let brandIndex = 0;
  const fixedQuotes = w.retailer_quotes.map(q => {
    if (!q.brand || !q.role) {
      totalEmptyQuotes++;
      // Pick a brand from their brands_worked (cycle through)
      const brand = w.brands_worked[brandIndex % w.brands_worked.length].name;
      brandIndex++;
      // Pick a random role
      const role = roles[Math.floor(Math.random() * roles.length)];
      return { ...q, brand, role };
    }
    return q;
  });

  // Generate SQL
  const quotesJson = JSON.stringify(fixedQuotes).replace(/'/g, "''");
  sqlStatements.push(`UPDATE workers SET retailer_quotes = '${quotesJson}' WHERE id = '${w.id}';`);
});

console.log(`Workers needing fix: ${needsFix}`);
console.log(`Total quotes needing attribution: ${totalEmptyQuotes}`);
console.log(`\n-- SQL Statements:\n`);
sqlStatements.forEach(s => console.log(s));
