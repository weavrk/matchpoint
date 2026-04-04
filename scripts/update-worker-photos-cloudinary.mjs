import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kxfbismfpmjwvemfznvm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI'
);

// Cloudinary fetch URL with face-detection crop
// Format: https://res.cloudinary.com/demo/image/fetch/c_thumb,g_face,h_200,w_200/{source_url}
// Using the demo cloud which allows fetch from any URL
function wrapWithCloudinary(originalUrl) {
  const encoded = encodeURIComponent(originalUrl);
  return `https://res.cloudinary.com/demo/image/fetch/c_thumb,g_face,h_200,w_200,f_auto/${encoded}`;
}

async function updatePhotos() {
  // Fetch all workers with randomuser.me photos
  const { data: workers, error } = await supabase
    .from('workers')
    .select('id, name, photo')
    .like('photo', '%randomuser.me%')
    .limit(2000);

  if (error) {
    console.error('Error fetching workers:', error);
    process.exit(1);
  }

  console.log(`Found ${workers.length} workers to update with face-cropped photos...`);

  let updated = 0;
  let failed = 0;

  for (const w of workers) {
    const newPhoto = wrapWithCloudinary(w.photo);

    const { error: updateError } = await supabase
      .from('workers')
      .update({ photo: newPhoto })
      .eq('id', w.id);

    if (updateError) {
      console.error(`Failed to update ${w.name}:`, updateError.message);
      failed++;
    } else {
      updated++;
    }

    if (updated % 200 === 0) {
      console.log(`Progress: ${updated}/${workers.length}`);
    }
  }

  console.log(`\nDone! Updated: ${updated}, Failed: ${failed}`);

  // Show sample
  const { data: samples } = await supabase
    .from('workers')
    .select('name, photo')
    .limit(3);

  console.log('\nSample URLs:');
  samples.forEach(w => console.log(`${w.name}:\n  ${w.photo}\n`));
}

updatePhotos();
