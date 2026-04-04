import { createClient } from '@supabase/supabase-js';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { config } from 'dotenv';
import path from 'path';

config();

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const CLOUDINARY_CLOUD = 'dj6tp0f1q';

const supabase = createClient(
  'https://kxfbismfpmjwvemfznvm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI'
);

const OUTPUT_DIR = path.join(process.cwd(), 'web/public/images/avatars');
const BATCH_SIZE = 10;
const DELAY_MS = 300;

async function downloadImage(url, filepath) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const buffer = await response.arrayBuffer();
    await writeFile(filepath, Buffer.from(buffer));
    return true;
  } catch (err) {
    console.error(`\nFailed: ${err.message}`);
    return false;
  }
}

function wrapWithCloudinary(url) {
  const encoded = encodeURIComponent(url);
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/fetch/c_fill,g_face,w_400,h_400,q_auto,f_jpg/${encoded}`;
}

async function searchPexels(query, count) {
  const photos = [];
  let page = 1;
  const perPage = 80;

  while (photos.length < count) {
    console.log(`  Fetching "${query}" page ${page}...`);
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}&page=${page}&orientation=portrait`;

    const res = await fetch(url, {
      headers: { 'Authorization': PEXELS_API_KEY }
    });

    if (!res.ok) {
      console.error('Pexels API error:', res.status);
      break;
    }

    const data = await res.json();
    if (!data.photos || data.photos.length === 0) break;

    photos.push(...data.photos.map(p => p.src.medium));
    page++;
    await new Promise(r => setTimeout(r, 500));
  }

  return photos.slice(0, count);
}

async function main() {
  // Ensure directories exist
  const maleDir = path.join(OUTPUT_DIR, 'male');
  const femaleDir = path.join(OUTPUT_DIR, 'female');
  if (!existsSync(maleDir)) await mkdir(maleDir, { recursive: true });
  if (!existsSync(femaleDir)) await mkdir(femaleDir, { recursive: true });

  // ============ STEP 1: Download RandomUser ============
  console.log('\n=== STEP 1: Downloading RandomUser photos ===\n');

  let downloaded = 0;

  // Male RandomUser (100)
  console.log('Downloading 100 male from RandomUser...');
  for (let i = 0; i < 100; i++) {
    const url = `https://randomuser.me/api/portraits/men/${i}.jpg`;
    const filename = `randomuser_${String(i + 1).padStart(3, '0')}.jpg`;
    const filepath = path.join(maleDir, filename);

    if (await downloadImage(url, filepath)) downloaded++;
    if ((i + 1) % 20 === 0) process.stdout.write(`\r  Male: ${i + 1}/100`);
  }
  console.log(' done');

  // Female RandomUser (100)
  console.log('Downloading 100 female from RandomUser...');
  for (let i = 0; i < 100; i++) {
    const url = `https://randomuser.me/api/portraits/women/${i}.jpg`;
    const filename = `randomuser_${String(i + 1).padStart(3, '0')}.jpg`;
    const filepath = path.join(femaleDir, filename);

    if (await downloadImage(url, filepath)) downloaded++;
    if ((i + 1) % 20 === 0) process.stdout.write(`\r  Female: ${i + 1}/100`);
  }
  console.log(' done');

  console.log(`\nRandomUser complete: ${downloaded} photos`);

  // ============ STEP 2: Download Pexels ============
  console.log('\n=== STEP 2: Downloading Pexels photos ===\n');

  // Male Pexels (25)
  console.log('Fetching 25 male headshots from Pexels...');
  const maleUrls = await searchPexels('man portrait headshot', 25);
  console.log(`Got ${maleUrls.length} male URLs`);

  for (let i = 0; i < maleUrls.length; i++) {
    const filename = `pexels_${String(i + 1).padStart(3, '0')}.jpg`;
    const filepath = path.join(maleDir, filename);
    await downloadImage(maleUrls[i], filepath);
    if ((i + 1) % 10 === 0) process.stdout.write(`\r  Downloading male: ${i + 1}/${maleUrls.length}`);
  }
  console.log(' done');

  // Female Pexels (850)
  console.log('Fetching 850 female headshots from Pexels...');
  const femaleUrls = await searchPexels('woman portrait headshot', 850);
  console.log(`Got ${femaleUrls.length} female URLs`);

  for (let i = 0; i < femaleUrls.length; i++) {
    const filename = `pexels_${String(i + 1).padStart(3, '0')}.jpg`;
    const filepath = path.join(femaleDir, filename);
    await downloadImage(femaleUrls[i], filepath);
    if ((i + 1) % 50 === 0) process.stdout.write(`\r  Downloading female: ${i + 1}/${femaleUrls.length}`);
  }
  console.log(' done');

  console.log(`\nPexels complete: ${maleUrls.length} male, ${femaleUrls.length} female`);

  // ============ STEP 3: Run through Cloudinary ============
  console.log('\n=== STEP 3: Processing through Cloudinary ===\n');

  const { readdir } = await import('fs/promises');

  // Process male
  const maleFiles = (await readdir(maleDir)).filter(f => f.endsWith('.jpg') && !f.includes('_cleaned'));
  console.log(`Processing ${maleFiles.length} male photos...`);

  for (let i = 0; i < maleFiles.length; i += BATCH_SIZE) {
    const batch = maleFiles.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (file) => {
      const baseName = file.replace('.jpg', '');
      const cleanedPath = path.join(maleDir, `${baseName}_cleaned.jpg`);

      // Get original URL based on filename
      let originalUrl;
      if (file.startsWith('randomuser_')) {
        const idx = parseInt(file.match(/randomuser_(\d+)/)[1]) - 1;
        originalUrl = `https://randomuser.me/api/portraits/men/${idx}.jpg`;
      } else if (file.startsWith('pexels_')) {
        // For pexels, we need to read from what we downloaded - use the local file via base64
        // Actually, re-fetch from Pexels URL we saved... we don't have them stored
        // Skip cloudinary for pexels for now - we'll process differently
        return;
      } else {
        return; // Skip other files
      }

      const cloudinaryUrl = wrapWithCloudinary(originalUrl);
      await downloadImage(cloudinaryUrl, cleanedPath);
    }));
    process.stdout.write(`\r  Male: ${Math.min(i + BATCH_SIZE, maleFiles.length)}/${maleFiles.length}`);
    await new Promise(r => setTimeout(r, DELAY_MS));
  }
  console.log(' done');

  // Process female
  const femaleFiles = (await readdir(femaleDir)).filter(f => f.endsWith('.jpg') && !f.includes('_cleaned'));
  console.log(`Processing ${femaleFiles.length} female photos...`);

  for (let i = 0; i < femaleFiles.length; i += BATCH_SIZE) {
    const batch = femaleFiles.slice(i, i + BATCH_SIZE);
    await Promise.all(batch.map(async (file) => {
      const baseName = file.replace('.jpg', '');
      const cleanedPath = path.join(femaleDir, `${baseName}_cleaned.jpg`);

      let originalUrl;
      if (file.startsWith('randomuser_')) {
        const idx = parseInt(file.match(/randomuser_(\d+)/)[1]) - 1;
        originalUrl = `https://randomuser.me/api/portraits/women/${idx}.jpg`;
      } else {
        return;
      }

      const cloudinaryUrl = wrapWithCloudinary(originalUrl);
      await downloadImage(cloudinaryUrl, cleanedPath);
    }));
    process.stdout.write(`\r  Female: ${Math.min(i + BATCH_SIZE, femaleFiles.length)}/${femaleFiles.length}`);
    await new Promise(r => setTimeout(r, DELAY_MS));
  }
  console.log(' done');

  // For Pexels photos, we need to process them through Cloudinary using their original URLs
  // We'll store the URLs and process them
  console.log('\nProcessing Pexels photos through Cloudinary...');

  // Re-process male pexels
  for (let i = 0; i < maleUrls.length; i++) {
    const baseName = `pexels_${String(i + 1).padStart(3, '0')}`;
    const cleanedPath = path.join(maleDir, `${baseName}_cleaned.jpg`);
    const cloudinaryUrl = wrapWithCloudinary(maleUrls[i]);
    await downloadImage(cloudinaryUrl, cleanedPath);
    if ((i + 1) % 10 === 0) process.stdout.write(`\r  Male Pexels: ${i + 1}/${maleUrls.length}`);
  }
  console.log(' done');

  for (let i = 0; i < femaleUrls.length; i++) {
    const baseName = `pexels_${String(i + 1).padStart(3, '0')}`;
    const cleanedPath = path.join(femaleDir, `${baseName}_cleaned.jpg`);
    const cloudinaryUrl = wrapWithCloudinary(femaleUrls[i]);
    await downloadImage(cloudinaryUrl, cleanedPath);
    if ((i + 1) % 50 === 0) process.stdout.write(`\r  Female Pexels: ${i + 1}/${femaleUrls.length}`);
  }
  console.log(' done');

  // ============ STEP 4: Update workers table ============
  console.log('\n=== STEP 4: Updating workers table ===\n');

  // Get favorite workers
  const allWorkers = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase
      .from('workers')
      .select('id, gender, store_favorite_count, unique_store_count')
      .range(offset, offset + 999);
    if (!data || data.length === 0) break;
    allWorkers.push(...data);
    offset += 1000;
    if (data.length < 1000) break;
  }

  const favorites = allWorkers.filter(w => {
    if (!w.unique_store_count || w.unique_store_count === 0) return false;
    return (w.store_favorite_count / w.unique_store_count) >= 0.5;
  });

  const males = favorites.filter(w => w.gender === 'male');
  const females = favorites.filter(w => w.gender === 'female');

  console.log(`Assigning photos to ${males.length} males and ${females.length} females...`);

  // Get cleaned files
  const maleCleanedFiles = (await readdir(maleDir))
    .filter(f => f.includes('_cleaned.jpg'))
    .sort();
  const femaleCleanedFiles = (await readdir(femaleDir))
    .filter(f => f.includes('_cleaned.jpg'))
    .sort();

  console.log(`Available: ${maleCleanedFiles.length} male, ${femaleCleanedFiles.length} female cleaned photos`);

  // Assign to workers
  let updated = 0;

  for (let i = 0; i < males.length; i++) {
    const photo = `/images/avatars/male/${maleCleanedFiles[i % maleCleanedFiles.length]}`;
    const { error } = await supabase
      .from('workers')
      .update({ photo })
      .eq('id', males[i].id);
    if (!error) updated++;
  }
  console.log(`Updated ${updated} male workers`);

  for (let i = 0; i < females.length; i++) {
    const photo = `/images/avatars/female/${femaleCleanedFiles[i % femaleCleanedFiles.length]}`;
    const { error } = await supabase
      .from('workers')
      .update({ photo })
      .eq('id', females[i].id);
    if (!error) updated++;
    if ((i + 1) % 100 === 0) process.stdout.write(`\r  Female: ${i + 1}/${females.length}`);
  }
  console.log(' done');

  console.log(`\n=== COMPLETE ===`);
  console.log(`Total workers updated: ${updated}`);
  console.log(`Photos in male/: ${maleCleanedFiles.length} cleaned`);
  console.log(`Photos in female/: ${femaleCleanedFiles.length} cleaned`);
}

main().catch(console.error);
