import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

const supabase = createClient(
  'https://kxfbismfpmjwvemfznvm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI'
);

async function searchPexels(query, perPage = 80, page = 1) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&orientation=square`;

  const res = await fetch(url, {
    headers: { 'Authorization': PEXELS_API_KEY }
  });

  if (!res.ok) {
    console.error('Pexels API error:', res.status, await res.text());
    return [];
  }

  const data = await res.json();
  // Get medium size portrait URLs
  return data.photos.map(p => p.src.medium);
}

async function fetchPhotos(query, count) {
  const photos = [];
  let page = 1;

  while (photos.length < count) {
    console.log(`Fetching ${query} page ${page}...`);
    const batch = await searchPexels(query, 80, page);
    if (batch.length === 0) break;
    photos.push(...batch);
    page++;

    // Rate limit: 200 req/hour, so be gentle
    await new Promise(r => setTimeout(r, 500));
  }

  return photos.slice(0, count);
}

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

async function main() {
  if (!PEXELS_API_KEY) {
    console.error('PEXELS_API_KEY not found in .env');
    process.exit(1);
  }

  const workers = await fetchAllWorkers();
  const males = workers.filter(w => w.gender === 'male');
  const females = workers.filter(w => w.gender === 'female');

  console.log(`Workers: ${workers.length} total (${males.length} males, ${females.length} females)`);

  // Fetch photos from Pexels
  console.log('\nFetching female headshots...');
  const femalePhotos = await fetchPhotos('professional woman headshot portrait', females.length + 100);
  console.log(`Got ${femalePhotos.length} female photos`);

  console.log('\nFetching male headshots...');
  const malePhotos = await fetchPhotos('professional man headshot portrait', males.length + 50);
  console.log(`Got ${malePhotos.length} male photos`);

  if (femalePhotos.length < females.length) {
    console.log(`Warning: Only ${femalePhotos.length} female photos for ${females.length} workers - will repeat`);
  }
  if (malePhotos.length < males.length) {
    console.log(`Warning: Only ${malePhotos.length} male photos for ${males.length} workers - will repeat`);
  }

  // Update workers
  console.log('\nUpdating workers...');
  let updated = 0;

  for (let i = 0; i < males.length; i++) {
    const w = males[i];
    const photo = malePhotos[i % malePhotos.length];

    const { error } = await supabase
      .from('workers')
      .update({ photo })
      .eq('id', w.id);

    if (!error) updated++;
  }
  console.log(`Updated ${updated} males`);

  for (let i = 0; i < females.length; i++) {
    const w = females[i];
    const photo = femalePhotos[i % femalePhotos.length];

    const { error } = await supabase
      .from('workers')
      .update({ photo })
      .eq('id', w.id);

    if (!error) updated++;
    if (updated % 200 === 0) console.log(`Progress: ${updated}/${workers.length}`);
  }

  console.log(`\nDone! Updated ${updated} workers`);

  // Check uniqueness
  const allPhotos = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase.from('workers').select('photo').range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allPhotos.push(...data.map(w => w.photo));
    offset += 1000;
    if (data.length < 1000) break;
  }

  const unique = new Set(allPhotos);
  console.log(`Unique photos: ${unique.size} / ${allPhotos.length}`);

  // Show samples
  const { data: samples } = await supabase.from('workers').select('name, gender, photo').limit(5);
  console.log('\nSamples:');
  samples.forEach(w => console.log(`${w.name} (${w.gender}): ${w.photo.substring(0, 60)}...`));
}

main();
