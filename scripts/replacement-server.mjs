import express from 'express';
import cors from 'cors';
import { writeFile, unlink, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { config } from 'dotenv';
import path from 'path';

config();

const app = express();
app.use(cors());
app.use(express.json());

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const CLOUDINARY_CLOUD = 'dj6tp0f1q';
const AVATARS_DIR = path.join(process.cwd(), 'web/public/images/avatars');

// Track which Pexels photos we've already used to avoid duplicates
let usedPexelsIds = new Set();
let pexelsPageMale = 1;
let pexelsPageFemale = 1;

function wrapWithCloudinary(url) {
  const encoded = encodeURIComponent(url);
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/fetch/c_fill,g_face,w_400,h_400,q_auto,f_jpg/${encoded}`;
}

async function fetchPexelsPhoto(gender) {
  const query = gender === 'male' ? 'headshot portrait casual friendly smile male' : 'headshot portrait casual friendly smile female';
  const page = gender === 'male' ? pexelsPageMale : pexelsPageFemale;

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=80&page=${page}&orientation=portrait`;

  const res = await fetch(url, {
    headers: { 'Authorization': PEXELS_API_KEY }
  });

  if (!res.ok) {
    throw new Error(`Pexels API error: ${res.status}`);
  }

  const data = await res.json();

  // Find a photo we haven't used yet
  for (const photo of data.photos) {
    if (!usedPexelsIds.has(photo.id)) {
      usedPexelsIds.add(photo.id);
      return photo.src.medium;
    }
  }

  // If all photos on this page are used, go to next page
  if (gender === 'male') pexelsPageMale++;
  else pexelsPageFemale++;

  // Recursive call to get from next page
  return fetchPexelsPhoto(gender);
}

async function downloadImage(url, filepath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const buffer = await response.arrayBuffer();
  await writeFile(filepath, Buffer.from(buffer));
}

app.post('/replace-photos', async (req, res) => {
  const { male = [], female = [] } = req.body;
  const total = male.length + female.length;

  console.log(`\nReplacing ${total} photos (${male.length} male, ${female.length} female)...`);

  let replaced = 0;
  const errors = [];

  // Replace male photos
  for (const filename of male) {
    try {
      const filepath = path.join(AVATARS_DIR, 'male', filename);

      // Get new photo from Pexels
      const pexelsUrl = await fetchPexelsPhoto('male');
      const cloudinaryUrl = wrapWithCloudinary(pexelsUrl);

      // Download through Cloudinary
      await downloadImage(cloudinaryUrl, filepath);

      replaced++;
      console.log(`  Replaced male: ${filename}`);
    } catch (err) {
      errors.push(`male/${filename}: ${err.message}`);
      console.error(`  Error replacing male/${filename}:`, err.message);
    }
  }

  // Replace female photos
  for (const filename of female) {
    try {
      const filepath = path.join(AVATARS_DIR, 'female', filename);

      // Get new photo from Pexels
      const pexelsUrl = await fetchPexelsPhoto('female');
      const cloudinaryUrl = wrapWithCloudinary(pexelsUrl);

      // Download through Cloudinary
      await downloadImage(cloudinaryUrl, filepath);

      replaced++;
      console.log(`  Replaced female: ${filename}`);
    } catch (err) {
      errors.push(`female/${filename}: ${err.message}`);
      console.error(`  Error replacing female/${filename}:`, err.message);
    }
  }

  console.log(`\nDone! Replaced ${replaced}/${total} photos.`);

  res.json({ replaced, total, errors });
});

// Expected files based on our download counts
const EXPECTED_MALE = [
  ...Array.from({ length: 100 }, (_, i) => `randomuser_${String(i + 1).padStart(3, '0')}_cleaned.jpg`),
  ...Array.from({ length: 25 }, (_, i) => `pexels_${String(i + 1).padStart(3, '0')}_cleaned.jpg`)
];

const EXPECTED_FEMALE = [
  ...Array.from({ length: 100 }, (_, i) => `randomuser_${String(i + 1).padStart(3, '0')}_cleaned.jpg`),
  ...Array.from({ length: 480 }, (_, i) => `pexels_${String(i + 1).padStart(3, '0')}_cleaned.jpg`)
];

app.post('/fill-missing', async (req, res) => {
  console.log('\n=== Filling Missing Photos ===');

  // Find missing files
  const missingMale = [];
  const missingFemale = [];

  for (const file of EXPECTED_MALE) {
    const filepath = path.join(AVATARS_DIR, 'male', file);
    if (!existsSync(filepath)) {
      missingMale.push(file);
    }
  }

  for (const file of EXPECTED_FEMALE) {
    const filepath = path.join(AVATARS_DIR, 'female', file);
    if (!existsSync(filepath)) {
      missingFemale.push(file);
    }
  }

  const total = missingMale.length + missingFemale.length;
  console.log(`Missing: ${missingMale.length} male, ${missingFemale.length} female (${total} total)`);

  if (total === 0) {
    return res.json({ filled: 0, total: 0, message: 'No missing photos found!' });
  }

  let filled = 0;
  let rateLimited = false;
  const errors = [];

  // Fill male photos
  for (const filename of missingMale) {
    if (rateLimited) break;
    try {
      const filepath = path.join(AVATARS_DIR, 'male', filename);
      const originalPath = filepath.replace('_cleaned.jpg', '.jpg');

      const pexelsUrl = await fetchPexelsPhoto('male');
      const cloudinaryUrl = wrapWithCloudinary(pexelsUrl);

      // Download both original and cleaned
      await downloadImage(pexelsUrl, originalPath);
      await downloadImage(cloudinaryUrl, filepath);

      filled++;
      console.log(`  Filled male: ${filename} (${filled}/${total})`);
    } catch (err) {
      if (err.message.includes('429')) {
        rateLimited = true;
        console.log('  Rate limited by Pexels!');
      } else {
        errors.push(`male/${filename}: ${err.message}`);
        console.error(`  Error filling male/${filename}:`, err.message);
      }
    }
  }

  // Fill female photos
  for (const filename of missingFemale) {
    if (rateLimited) break;
    try {
      const filepath = path.join(AVATARS_DIR, 'female', filename);
      const originalPath = filepath.replace('_cleaned.jpg', '.jpg');

      const pexelsUrl = await fetchPexelsPhoto('female');
      const cloudinaryUrl = wrapWithCloudinary(pexelsUrl);

      // Download both original and cleaned
      await downloadImage(pexelsUrl, originalPath);
      await downloadImage(cloudinaryUrl, filepath);

      filled++;
      console.log(`  Filled female: ${filename} (${filled}/${total})`);
    } catch (err) {
      if (err.message.includes('429')) {
        rateLimited = true;
        console.log('  Rate limited by Pexels!');
      } else {
        errors.push(`female/${filename}: ${err.message}`);
        console.error(`  Error filling female/${filename}:`, err.message);
      }
    }
  }

  console.log(`\nDone! Filled ${filled}/${total} photos.${rateLimited ? ' (Rate limited)' : ''}`);

  res.json({ filled, total, rateLimited, errors });
});

// Export final photos to JSON for the app
app.post('/export-final', async (req, res) => {
  const { male = [], female = [] } = req.body;

  console.log(`\n=== Exporting Final Photos ===`);
  console.log(`Final set: ${male.length} male, ${female.length} female`);

  try {
    const jsonPath = path.join(process.cwd(), 'web/src/data/finalPhotos.json');
    const data = JSON.stringify({ male, female }, null, 2);
    await writeFile(jsonPath, data);

    console.log(`Saved to ${jsonPath}`);
    res.json({ success: true, male: male.length, female: female.length });
  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Repopulate workers with curated final photos
app.post('/repopulate-workers', async (req, res) => {
  const { male = [], female = [] } = req.body;

  console.log(`\n=== Repopulating Workers ===`);
  console.log(`Final set: ${male.length} male, ${female.length} female`);

  if (male.length === 0 && female.length === 0) {
    return res.status(400).json({ error: 'No photos in final set' });
  }

  try {
    // Import Supabase
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      'https://kxfbismfpmjwvemfznvm.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI'
    );

    // Get all workers that need photos (favorites with >=50% rate)
    const { data: workers, error: fetchError } = await supabase
      .from('workers')
      .select('id, name')
      .gte('store_favorite_count', 1)
      .order('id');

    if (fetchError) throw fetchError;

    console.log(`Found ${workers.length} workers to update`);

    // Determine gender by name heuristics (simple approach)
    // We'll use a basic split - odd IDs get male pool, even get female pool
    // Or better: use the name to guess gender
    const femaleNames = ['maria', 'sarah', 'jessica', 'jennifer', 'ashley', 'amanda', 'stephanie', 'nicole', 'elizabeth', 'megan', 'lauren', 'emily', 'rachel', 'samantha', 'katherine', 'lisa', 'michelle', 'kim', 'amy', 'angela', 'melissa', 'anna', 'christina', 'kelly', 'julie', 'karen', 'laura', 'andrea', 'heather', 'diana', 'patricia', 'linda', 'barbara', 'susan', 'nancy', 'betty', 'dorothy', 'sandra', 'ashley', 'kimberly', 'donna', 'carol', 'ruth', 'sharon', 'helen', 'deborah', 'stephanie', 'sophia', 'olivia', 'emma', 'ava', 'isabella', 'mia', 'charlotte', 'amelia', 'harper', 'evelyn', 'abigail', 'ella', 'scarlett', 'grace', 'chloe', 'victoria', 'madison', 'luna', 'penelope', 'layla', 'riley', 'zoey', 'nora', 'lily', 'eleanor', 'hannah', 'lillian', 'addison', 'aubrey', 'ellie', 'stella', 'natalie', 'zoe', 'leah', 'hazel', 'violet', 'aurora', 'savannah', 'audrey', 'brooklyn', 'bella', 'claire', 'skylar', 'lucy', 'paisley', 'everly', 'anna', 'caroline', 'nova', 'genesis', 'emilia', 'kennedy', 'samantha', 'maya', 'willow', 'kinsley', 'naomi', 'aaliyah', 'elena', 'sarah', 'ariana', 'allison', 'gabriella', 'alice', 'madelyn', 'cora', 'ruby', 'eva', 'serenity', 'autumn', 'adeline', 'hailey', 'gianna', 'valentina', 'isla', 'eliana', 'quinn', 'nevaeh', 'ivy', 'sadie', 'piper', 'lydia', 'alexa', 'josephine', 'emery', 'julia', 'delilah', 'arianna', 'vivian', 'kaylee', 'sophie', 'brielle', 'madeline'];

    let maleIdx = 0;
    let femaleIdx = 0;
    let updated = 0;

    for (const worker of workers) {
      const firstName = worker.name.split(' ')[0].toLowerCase();
      const isFemale = femaleNames.includes(firstName);

      let photoFile;
      if (isFemale && female.length > 0) {
        photoFile = `/images/avatars/female/${female[femaleIdx % female.length]}`;
        femaleIdx++;
      } else if (!isFemale && male.length > 0) {
        photoFile = `/images/avatars/male/${male[maleIdx % male.length]}`;
        maleIdx++;
      } else if (female.length > 0) {
        // Fallback to female if no male photos
        photoFile = `/images/avatars/female/${female[femaleIdx % female.length]}`;
        femaleIdx++;
      } else {
        photoFile = `/images/avatars/male/${male[maleIdx % male.length]}`;
        maleIdx++;
      }

      const { error: updateError } = await supabase
        .from('workers')
        .update({ photo: photoFile })
        .eq('id', worker.id);

      if (!updateError) updated++;

      if (updated % 100 === 0) {
        console.log(`  Updated ${updated}/${workers.length}...`);
      }
    }

    console.log(`\nDone! Updated ${updated} workers.`);
    res.json({ updated, total: workers.length });

  } catch (err) {
    console.error('Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = 3456;
app.listen(PORT, () => {
  console.log(`\n=== Photo Replacement Server ===`);
  console.log(`Running on http://localhost:${PORT}`);
  console.log(`\nOpen review-portraits.html in your browser,`);
  console.log(`select photos to replace, and click "Replace Selected".`);
  console.log(`\nEndpoints:`);
  console.log(`  POST /replace-photos - Replace selected photos`);
  console.log(`  POST /fill-missing   - Fill in any missing photos`);
  console.log(`\nUsing prompts: "social media profile pic color photo male/female"`);
});
