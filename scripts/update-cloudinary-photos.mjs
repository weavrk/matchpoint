import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kxfbismfpmjwvemfznvm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI'
);

const CLOUD_NAME = 'dj6tp0f1q';

function wrapWithCloudinary(originalUrl) {
  const encoded = encodeURIComponent(originalUrl);
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/c_thumb,g_face,h_200,w_200,f_auto/${encoded}`;
}

async function updatePhotos() {
  // Fetch workers with randomuser.me URLs (not yet wrapped)
  const { data: workers, error } = await supabase
    .from('workers')
    .select('id, name, photo')
    .like('photo', 'https://randomuser.me%')
    .limit(2000);

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`Updating ${workers.length} workers with Cloudinary face detection...`);

  let updated = 0;
  for (const w of workers) {
    const newPhoto = wrapWithCloudinary(w.photo);
    const { error: updateError } = await supabase
      .from('workers')
      .update({ photo: newPhoto })
      .eq('id', w.id);

    if (!updateError) updated++;
    if (updated % 200 === 0) console.log(`Progress: ${updated}/${workers.length}`);
  }

  console.log(`Done! Updated: ${updated}`);

  // Verify with sample
  const { data: sample } = await supabase
    .from('workers')
    .select('name, photo')
    .limit(3);

  console.log('\nSample URLs:');
  sample.forEach(w => console.log(`${w.name}: ${w.photo}`));
}

updatePhotos();
