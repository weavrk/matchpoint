import { createClient } from '@supabase/supabase-js';
import { writeFile, mkdir, rm } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

const supabase = createClient(
  'https://kxfbismfpmjwvemfznvm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI'
);

const OUTPUT_DIR = path.join(process.cwd(), 'web/public/images/avatars');
const CLOUDINARY_CLOUD = 'dj6tp0f1q';
const BATCH_SIZE = 10;
const DELAY_BETWEEN_BATCHES = 500;

// Wrap any URL with Cloudinary face detection
function wrapWithCloudinary(url) {
  // If already a Cloudinary URL, extract the original and re-wrap
  if (url.includes('res.cloudinary.com')) {
    const match = url.match(/\/fetch\/[^/]+\/(.+)$/);
    if (match) {
      url = decodeURIComponent(match[1]);
    }
  }
  const encoded = encodeURIComponent(url);
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/fetch/c_fill,g_face,w_400,h_400,q_auto,f_jpg/${encoded}`;
}

// Extract original source URL from any format
function getOriginalUrl(url) {
  if (!url) return null;

  // Already a local path - can't recover
  if (url.startsWith('/images/')) return null;

  // Cloudinary fetch URL - extract original
  if (url.includes('res.cloudinary.com')) {
    const match = url.match(/\/fetch\/[^/]+\/(.+)$/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
  }

  // Direct URL (Pexels, RandomUser, etc.)
  if (url.startsWith('http')) {
    return url;
  }

  return null;
}

async function fetchFavoriteWorkers() {
  const allWorkers = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from('workers')
      .select('id, photo, gender, store_favorite_count, unique_store_count')
      .range(offset, offset + 999);

    if (error) {
      console.error('Error fetching workers:', error);
      process.exit(1);
    }

    if (!data || data.length === 0) break;
    allWorkers.push(...data);
    offset += 1000;
    if (data.length < 1000) break;
  }

  // Filter to favorites >= 50%
  return allWorkers.filter(w => {
    if (!w.unique_store_count || w.unique_store_count === 0) return false;
    return (w.store_favorite_count / w.unique_store_count) >= 0.5;
  });
}

async function downloadImage(url, filepath) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const buffer = await response.arrayBuffer();
    await writeFile(filepath, Buffer.from(buffer));
    return true;
  } catch (err) {
    console.error(`\nFailed to download: ${err.message}`);
    return false;
  }
}

async function main() {
  // Clear and recreate output directories
  const maleDir = path.join(OUTPUT_DIR, 'male');
  const femaleDir = path.join(OUTPUT_DIR, 'female');

  console.log('Clearing existing photos...');
  if (existsSync(maleDir)) await rm(maleDir, { recursive: true });
  if (existsSync(femaleDir)) await rm(femaleDir, { recursive: true });

  await mkdir(maleDir, { recursive: true });
  await mkdir(femaleDir, { recursive: true });
  console.log('Created fresh male/ and female/ directories');

  console.log('\nFetching favorite workers from workers (>=50%)...');
  const workers = await fetchFavoriteWorkers();

  const males = workers.filter(w => w.gender === 'male');
  const females = workers.filter(w => w.gender === 'female');
  console.log(`Found ${workers.length} workers (${males.length} male, ${females.length} female)`);

  // Build map of unique photos per gender
  const malePhotos = new Map();
  const femalePhotos = new Map();

  let maleIdx = 1;
  let femaleIdx = 1;
  let skippedLocalPaths = 0;

  for (const w of workers) {
    const originalUrl = getOriginalUrl(w.photo);
    if (!originalUrl) {
      skippedLocalPaths++;
      continue;
    }

    const gender = w.gender === 'male' ? 'male' : 'female';
    const photoMap = gender === 'male' ? malePhotos : femalePhotos;

    if (!photoMap.has(originalUrl)) {
      const idx = gender === 'male' ? maleIdx++ : femaleIdx++;
      const filename = `${String(idx).padStart(3, '0')}.jpg`;
      photoMap.set(originalUrl, {
        filename,
        cloudinaryUrl: wrapWithCloudinary(originalUrl),
        localPath: `/images/avatars/${gender}/${filename}`,
        workerIds: []
      });
    }
    photoMap.get(originalUrl).workerIds.push(w.id);
  }

  if (skippedLocalPaths > 0) {
    console.log(`\nWarning: Skipped ${skippedLocalPaths} workers with local paths (no original URL)`);
  }

  console.log(`\nUnique photos to download (via Cloudinary):`);
  console.log(`  Male: ${malePhotos.size}`);
  console.log(`  Female: ${femalePhotos.size}`);
  console.log(`  Total: ${malePhotos.size + femalePhotos.size}`);

  // Show sample Cloudinary URL
  const sampleUrl = Array.from(malePhotos.values())[0]?.cloudinaryUrl || Array.from(femalePhotos.values())[0]?.cloudinaryUrl;
  if (sampleUrl) {
    console.log(`\nSample Cloudinary URL:\n  ${sampleUrl.substring(0, 120)}...`);
  }

  // Download unique photos
  console.log('\n--- Downloading photos via Cloudinary ---\n');

  let downloaded = 0;
  let failed = 0;

  // Process male photos
  const maleEntries = Array.from(malePhotos.entries());
  for (let i = 0; i < maleEntries.length; i += BATCH_SIZE) {
    const batch = maleEntries.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async ([originalUrl, info]) => {
      const filepath = path.join(maleDir, info.filename);
      const success = await downloadImage(info.cloudinaryUrl, filepath);
      if (success) downloaded++;
      else failed++;
    }));

    process.stdout.write(`\rMale: ${Math.min(i + BATCH_SIZE, maleEntries.length)}/${maleEntries.length}`);
    if (i + BATCH_SIZE < maleEntries.length) {
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES));
    }
  }
  if (maleEntries.length > 0) console.log(' done');

  // Process female photos
  const femaleEntries = Array.from(femalePhotos.entries());
  for (let i = 0; i < femaleEntries.length; i += BATCH_SIZE) {
    const batch = femaleEntries.slice(i, i + BATCH_SIZE);

    await Promise.all(batch.map(async ([originalUrl, info]) => {
      const filepath = path.join(femaleDir, info.filename);
      const success = await downloadImage(info.cloudinaryUrl, filepath);
      if (success) downloaded++;
      else failed++;
    }));

    process.stdout.write(`\rFemale: ${Math.min(i + BATCH_SIZE, femaleEntries.length)}/${femaleEntries.length}`);
    if (i + BATCH_SIZE < femaleEntries.length) {
      await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES));
    }
  }
  if (femaleEntries.length > 0) console.log(' done');

  console.log(`\nDownload complete!`);
  console.log(`  Downloaded: ${downloaded}`);
  console.log(`  Failed: ${failed}`);

  // Update database (workers table, not workers_full)
  console.log('\n--- Updating workers table ---\n');

  let updated = 0;
  const allPhotoMaps = [
    { map: malePhotos, gender: 'male' },
    { map: femalePhotos, gender: 'female' }
  ];

  for (const { map } of allPhotoMaps) {
    for (const [url, info] of map.entries()) {
      for (const workerId of info.workerIds) {
        const { error } = await supabase
          .from('workers')
          .update({ photo: info.localPath })
          .eq('id', workerId);

        if (!error) updated++;

        if (updated % 100 === 0) {
          process.stdout.write(`\rUpdated ${updated} records`);
        }
      }
    }
  }

  console.log(`\n\nDone! Updated ${updated} worker records.`);
  console.log(`\nPhotos saved to:`);
  console.log(`  ${maleDir} (${malePhotos.size} files)`);
  console.log(`  ${femaleDir} (${femalePhotos.size} files)`);
}

main();
