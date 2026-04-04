import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kxfbismfpmjwvemfznvm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI'
);

// Generate URL for 100k-faces based on index (0-99999)
function get100kFaceUrl(index) {
  const padded = String(index).padStart(6, '0');
  const folder = Math.floor(index / 1000);  // 0-9 for 0-9999
  return `https://ozgrozer.github.io/100k-faces/0/${folder}/${padded}.jpg`;
}

async function fetchAllWorkers() {
  const allWorkers = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data, error } = await supabase
      .from('workers')
      .select('id, name')
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

  console.log(`Updating ${workers.length} workers with unique AI-generated photos...`);

  let updated = 0;

  // Assign each worker a unique photo index starting from 1
  for (let i = 0; i < workers.length; i++) {
    const w = workers[i];
    const photoIndex = i + 1;  // Start from 1, go up to 1701+
    const newPhoto = get100kFaceUrl(photoIndex);

    const { error: updateError } = await supabase
      .from('workers')
      .update({ photo: newPhoto })
      .eq('id', w.id);

    if (!updateError) updated++;
    if (updated % 200 === 0) console.log(`Progress: ${updated}/${workers.length}`);
  }

  console.log(`Done! Updated: ${updated}`);

  // Verify uniqueness
  const allPhotos = await fetchAllPhotos();
  const uniquePhotos = new Set(allPhotos);
  console.log(`\nUnique photos: ${uniquePhotos.size} / ${allPhotos.length} workers`);

  // Show samples
  const { data: samples } = await supabase.from('workers').select('name, photo').limit(5);
  console.log('\nSample URLs:');
  samples.forEach(w => console.log(`${w.name}: ${w.photo}`));
}

async function fetchAllPhotos() {
  const photos = [];
  let offset = 0;
  const limit = 1000;

  while (true) {
    const { data } = await supabase
      .from('workers')
      .select('photo')
      .range(offset, offset + limit - 1);

    if (!data || data.length === 0) break;
    photos.push(...data.map(w => w.photo));
    offset += limit;

    if (data.length < limit) break;
  }

  return photos;
}

updatePhotos();
