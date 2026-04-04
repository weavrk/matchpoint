import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

const supabase = createClient(
  'https://kxfbismfpmjwvemfznvm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI'
);

// Generate all 100 randomuser.me URLs for a gender
function getRandomUserUrls(gender) {
  const folder = gender === 'male' ? 'men' : 'women';
  const urls = [];
  for (let i = 0; i < 100; i++) {
    urls.push(`https://randomuser.me/api/portraits/${folder}/${i}.jpg`);
  }
  return urls;
}

async function searchPexels(query, perPage = 80, page = 1) {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&orientation=portrait`;

  const res = await fetch(url, {
    headers: { 'Authorization': PEXELS_API_KEY }
  });

  if (!res.ok) {
    console.error('Pexels API error:', res.status, await res.text());
    return [];
  }

  const data = await res.json();
  return data.photos.map(p => p.src.medium);
}

async function fetchPexelsPhotos(query, count) {
  const photos = [];
  let page = 1;

  while (photos.length < count) {
    console.log(`  Fetching "${query}" page ${page}...`);
    const batch = await searchPexels(query, 80, page);
    if (batch.length === 0) break;
    photos.push(...batch);
    page++;
    await new Promise(r => setTimeout(r, 500));
  }

  return photos.slice(0, count);
}

async function fetchAllWorkers() {
  const allWorkers = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('workers')
      .select('id, name, gender')
      .order('id', { ascending: true })
      .range(offset, offset + 999);

    if (error) {
      console.error('Error:', error);
      process.exit(1);
    }

    if (!data || data.length === 0) break;
    allWorkers.push(...data);
    offset += 1000;
    if (data.length < 1000) break;
  }

  return allWorkers;
}

async function main() {
  const workers = await fetchAllWorkers();
  const males = workers.filter(w => w.gender === 'male');
  const females = workers.filter(w => w.gender === 'female');

  console.log(`Workers: ${workers.length} total (${males.length} males, ${females.length} females)`);

  // Step 1: Get all 100 randomuser.me photos per gender (guaranteed good headshots)
  console.log('\nStep 1: Getting randomuser.me photos (100 per gender)...');
  const maleRandomUser = getRandomUserUrls('male');     // 100 photos
  const femaleRandomUser = getRandomUserUrls('female'); // 100 photos

  // Step 2: Get additional Pexels photos for females (need 1547 - 100 = 1447 more)
  const femalesNeeded = females.length - 100;
  console.log(`\nStep 2: Need ${femalesNeeded} more female photos from Pexels...`);

  // Use simple search terms
  const pexelsFemale = await fetchPexelsPhotos('female headshot', femalesNeeded + 200);
  console.log(`Got ${pexelsFemale.length} female photos from Pexels`);

  // Step 3: Get additional Pexels photos for males (need 154 - 100 = 54 more)
  const malesNeeded = males.length - 100;
  console.log(`\nStep 3: Need ${malesNeeded} more male photos from Pexels...`);

  const pexelsMale = await fetchPexelsPhotos('male headshot', malesNeeded + 50);
  console.log(`Got ${pexelsMale.length} male photos from Pexels`);

  // Combine: randomuser first, then pexels
  const allMalePhotos = [...maleRandomUser, ...pexelsMale];
  const allFemalePhotos = [...femaleRandomUser, ...pexelsFemale];

  console.log(`\nTotal available: ${allMalePhotos.length} male, ${allFemalePhotos.length} female`);

  // Step 4: Update workers
  console.log('\nStep 4: Updating workers...');
  let updated = 0;

  for (let i = 0; i < males.length; i++) {
    const w = males[i];
    const photo = allMalePhotos[i] || allMalePhotos[i % allMalePhotos.length];

    const { error } = await supabase
      .from('workers')
      .update({ photo })
      .eq('id', w.id);

    if (!error) updated++;
  }
  console.log(`Updated ${males.length} males`);

  for (let i = 0; i < females.length; i++) {
    const w = females[i];
    const photo = allFemalePhotos[i] || allFemalePhotos[i % allFemalePhotos.length];

    const { error } = await supabase
      .from('workers')
      .update({ photo })
      .eq('id', w.id);

    if (!error) updated++;
    if ((updated) % 300 === 0) console.log(`Progress: ${updated}/${workers.length}`);
  }

  console.log(`\nDone! Updated ${updated} workers`);

  // Verify
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
}

main();
