import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://kxfbismfpmjwvemfznvm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI'
);

// Extract the original randomuser.me URL from cloudinary wrapper
function unwrapCloudinary(url) {
  if (url.includes('res.cloudinary.com')) {
    // Extract the encoded URL after the transformation params
    const match = url.match(/f_auto\/(https%3A.+)$/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }
  return url;
}

async function revertPhotos() {
  // Fetch all workers with cloudinary URLs
  const { data: workers, error } = await supabase
    .from('workers')
    .select('id, name, photo')
    .like('photo', '%cloudinary%')
    .limit(2000);

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log(`Reverting ${workers.length} workers to randomuser.me URLs...`);

  let updated = 0;
  for (const w of workers) {
    const originalUrl = unwrapCloudinary(w.photo);
    const { error: updateError } = await supabase
      .from('workers')
      .update({ photo: originalUrl })
      .eq('id', w.id);

    if (!updateError) updated++;
    if (updated % 200 === 0) console.log(`Progress: ${updated}/${workers.length}`);
  }

  console.log(`Done! Reverted: ${updated}`);

  // Verify
  const { data: sample } = await supabase
    .from('workers')
    .select('name, photo')
    .limit(3);

  console.log('\nSample URLs:');
  sample.forEach(w => console.log(`${w.name}: ${w.photo}`));
}

revertPhotos();
