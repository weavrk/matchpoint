import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kxfbismfpmjwvemfznvm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI'
);

// randomuser.me provides portraits up to index 99 for each gender
// We'll use a hash of the worker ID to get a consistent but varied index
function getPhotoIndex(id, maxIndex = 99) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash) % (maxIndex + 1);
}

// Generate randomuser.me URL based on gender and a consistent index
function generatePhotoUrl(workerId, gender) {
  const index = getPhotoIndex(workerId);
  const genderPath = gender === 'male' ? 'men' : 'women';
  return `https://randomuser.me/api/portraits/${genderPath}/${index}.jpg`;
}

async function updatePhotos() {
  // Fetch all workers
  const { data: workers, error } = await supabase
    .from('workers')
    .select('id, name, gender')
    .order('name');

  if (error) {
    console.error('Error fetching workers:', error);
    process.exit(1);
  }

  console.log(`Updating photos for ${workers.length} workers...`);

  let updated = 0;
  let failed = 0;

  // Update in batches of 50
  const batchSize = 50;
  for (let i = 0; i < workers.length; i += batchSize) {
    const batch = workers.slice(i, i + batchSize);

    const updates = batch.map(w => ({
      id: w.id,
      photo: generatePhotoUrl(w.id, w.gender)
    }));

    // Use upsert to update each worker
    for (const update of updates) {
      const { error: updateError } = await supabase
        .from('workers')
        .update({ photo: update.photo })
        .eq('id', update.id);

      if (updateError) {
        console.error(`Failed to update ${update.id}:`, updateError);
        failed++;
      } else {
        updated++;
      }
    }

    // Progress update
    console.log(`Progress: ${Math.min(i + batchSize, workers.length)}/${workers.length}`);
  }

  console.log(`\nDone! Updated: ${updated}, Failed: ${failed}`);

  // Verify a few samples
  console.log('\nSample results:');
  const { data: samples } = await supabase
    .from('workers')
    .select('name, gender, photo')
    .limit(5);

  samples.forEach(w => console.log(`${w.name} (${w.gender}): ${w.photo}`));
}

updatePhotos();
