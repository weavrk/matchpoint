import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kxfbismfpmjwvemfznvm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI'
);

function getPhotoIndex(id, maxIndex = 99) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash) % (maxIndex + 1);
}

function generatePhotoUrl(workerId, gender) {
  const index = getPhotoIndex(workerId);
  const genderPath = gender === 'male' ? 'men' : 'women';
  return `https://randomuser.me/api/portraits/${genderPath}/${index}.jpg`;
}

async function updatePhotos() {
  // Fetch workers with old photo format (those not yet updated)
  const { data: workers, error } = await supabase
    .from('workers')
    .select('id, name, gender')
    .like('photo', '/images/%')
    .limit(2000);

  if (error) {
    console.error('Error fetching workers:', error);
    process.exit(1);
  }

  console.log(`Found ${workers.length} workers with old photos to update...`);

  let updated = 0;
  let failed = 0;

  for (const w of workers) {
    const newPhoto = generatePhotoUrl(w.id, w.gender);
    const { error: updateError } = await supabase
      .from('workers')
      .update({ photo: newPhoto })
      .eq('id', w.id);

    if (updateError) {
      console.error(`Failed to update ${w.name}:`, updateError);
      failed++;
    } else {
      updated++;
    }

    if (updated % 100 === 0) {
      console.log(`Progress: ${updated}/${workers.length}`);
    }
  }

  console.log(`\nDone! Updated: ${updated}, Failed: ${failed}`);
}

updatePhotos();
