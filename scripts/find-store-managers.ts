import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kxfbismfpmjwvemfznvm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI'
);

async function findStoreManagers() {
  const { data, error } = await supabase
    .from('workers')
    .select('id, name, previous_experience');

  if (error) {
    console.error('Error:', error);
    return;
  }

  const storeManagers = data?.filter(w => {
    if (!w.previous_experience || !Array.isArray(w.previous_experience)) return false;
    return w.previous_experience.some((exp: any) =>
      exp.roles?.some((role: string) =>
        role.toLowerCase().includes('store manager') ||
        role.toLowerCase().includes('manager')
      )
    );
  }) || [];

  console.log('Workers with Store Manager experience:');
  console.log('======================================');
  storeManagers.forEach(w => {
    console.log(`\n${w.name} (id: ${w.id})`);
    w.previous_experience?.forEach((exp: any) => {
      const managerRoles = exp.roles?.filter((r: string) => r.toLowerCase().includes('manager'));
      if (managerRoles?.length > 0) {
        console.log(`  - ${exp.company}: ${managerRoles.join(', ')} (${exp.duration})`);
      }
    });
  });
  console.log(`\n\nTotal: ${storeManagers.length} workers with manager experience`);
}

findStoreManagers();
