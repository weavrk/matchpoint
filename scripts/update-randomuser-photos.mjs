import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kxfbismfpmjwvemfznvm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI'
);

async function fetchAllWorkers() {
  const allWorkers = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('workers')
      .select('id, name, gender')
      .order('id', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error:', error);
      process.exit(1);
    }

    if (data.length === 0) break;
    allWorkers.push(...data);
    offset += limit;

    if (data.length < limit) break;
  }

  return allWorkers;
}

async function updatePhotos() {
  const workers = await fetchAllWorkers();

  // Separate by gender
  const males = workers.filter(w => w.gender === 'male');
  const females = workers.filter(w => w.gender === 'female');

  console.log(`Total: ${workers.length} workers (${males.length} males, ${females.length} females)`);

  let updated = 0;

  // Assign males (154 workers, 100 portraits = some will repeat after 100)
  for (let i = 0; i < males.length; i++) {
    const w = males[i];
    const photoIndex = i % 100;  // 0-99, wraps around
    const newPhoto = `https://randomuser.me/api/portraits/men/${photoIndex}.jpg`;

    const { error } = await supabase
      .from('workers')
      .update({ photo: newPhoto })
      .eq('id', w.id);

    if (!error) updated++;
  }

  console.log(`Updated ${updated} males`);

  // Assign females (1547 workers, 100 portraits = each portrait used ~15 times)
  for (let i = 0; i < females.length; i++) {
    const w = females[i];
    const photoIndex = i % 100;  // 0-99, wraps around
    const newPhoto = `https://randomuser.me/api/portraits/women/${photoIndex}.jpg`;

    const { error } = await supabase
      .from('workers')
      .update({ photo: newPhoto })
      .eq('id', w.id);

    if (!error) updated++;
    if (updated % 200 === 0) console.log(`Progress: ${updated}/${workers.length}`);
  }

  console.log(`Done! Total updated: ${updated}`);

  // Show samples
  const { data: samples } = await supabase
    .from('workers')
    .select('name, gender, photo')
    .limit(6);

  console.log('\nSamples:');
  samples.forEach(w => console.log(`${w.name} (${w.gender}): ${w.photo}`));
}

updatePhotos();
