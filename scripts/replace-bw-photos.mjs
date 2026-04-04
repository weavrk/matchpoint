import { writeFile, unlink, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { config } from 'dotenv';
import path from 'path';

config();

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const CLOUDINARY_CLOUD = 'dj6tp0f1q';
const AVATARS_DIR = path.join(process.cwd(), 'web/public/images/avatars');

// B&W files detected
const BW_MALE = [
  'pexels_002_cleaned.jpg',
  'pexels_004_cleaned.jpg',
  'pexels_014_cleaned.jpg',
  'pexels_017_cleaned.jpg',
  'pexels_019_cleaned.jpg',
  'pexels_024_cleaned.jpg',
  'randomuser_007_cleaned.jpg',
  'randomuser_016_cleaned.jpg',
  'randomuser_018_cleaned.jpg',
  'randomuser_035_cleaned.jpg',
  'randomuser_075_cleaned.jpg',
];

const BW_FEMALE = [
  'pexels_001_cleaned.jpg', 'pexels_004_cleaned.jpg', 'pexels_005_cleaned.jpg',
  'pexels_008_cleaned.jpg', 'pexels_010_cleaned.jpg', 'pexels_011_cleaned.jpg',
  'pexels_020_cleaned.jpg', 'pexels_022_cleaned.jpg', 'pexels_023_cleaned.jpg',
  'pexels_024_cleaned.jpg', 'pexels_025_cleaned.jpg', 'pexels_026_cleaned.jpg',
  'pexels_028_cleaned.jpg', 'pexels_030_cleaned.jpg', 'pexels_035_cleaned.jpg',
  'pexels_036_cleaned.jpg', 'pexels_038_cleaned.jpg', 'pexels_039_cleaned.jpg',
  'pexels_040_cleaned.jpg', 'pexels_042_cleaned.jpg', 'pexels_043_cleaned.jpg',
  'pexels_044_cleaned.jpg', 'pexels_047_cleaned.jpg', 'pexels_048_cleaned.jpg',
  'pexels_050_cleaned.jpg', 'pexels_051_cleaned.jpg', 'pexels_054_cleaned.jpg',
  'pexels_062_cleaned.jpg', 'pexels_065_cleaned.jpg', 'pexels_072_cleaned.jpg',
  'pexels_076_cleaned.jpg', 'pexels_077_cleaned.jpg', 'pexels_079_cleaned.jpg',
  'pexels_089_cleaned.jpg', 'pexels_099_cleaned.jpg', 'pexels_101_cleaned.jpg',
  'pexels_103_cleaned.jpg', 'pexels_105_cleaned.jpg', 'pexels_108_cleaned.jpg',
  'pexels_110_cleaned.jpg', 'pexels_111_cleaned.jpg', 'pexels_113_cleaned.jpg',
  'pexels_114_cleaned.jpg', 'pexels_126_cleaned.jpg', 'pexels_127_cleaned.jpg',
  'pexels_132_cleaned.jpg', 'pexels_135_cleaned.jpg', 'pexels_136_cleaned.jpg',
  'pexels_137_cleaned.jpg', 'pexels_138_cleaned.jpg', 'pexels_140_cleaned.jpg',
  'pexels_151_cleaned.jpg', 'pexels_155_cleaned.jpg', 'pexels_157_cleaned.jpg',
  'pexels_159_cleaned.jpg', 'pexels_160_cleaned.jpg', 'pexels_161_cleaned.jpg',
  'pexels_166_cleaned.jpg', 'pexels_167_cleaned.jpg', 'pexels_170_cleaned.jpg',
  'pexels_173_cleaned.jpg', 'pexels_175_cleaned.jpg', 'pexels_176_cleaned.jpg',
  'pexels_185_cleaned.jpg', 'pexels_187_cleaned.jpg', 'pexels_188_cleaned.jpg',
  'pexels_190_cleaned.jpg', 'pexels_194_cleaned.jpg', 'pexels_196_cleaned.jpg',
  'pexels_203_cleaned.jpg', 'pexels_209_cleaned.jpg', 'pexels_214_cleaned.jpg',
  'pexels_219_cleaned.jpg', 'pexels_220_cleaned.jpg', 'pexels_222_cleaned.jpg',
  'pexels_228_cleaned.jpg', 'pexels_237_cleaned.jpg', 'pexels_241_cleaned.jpg',
  'pexels_248_cleaned.jpg', 'pexels_251_cleaned.jpg', 'pexels_256_cleaned.jpg',
  'pexels_266_cleaned.jpg', 'pexels_269_cleaned.jpg', 'pexels_270_cleaned.jpg',
  'pexels_275_cleaned.jpg', 'pexels_278_cleaned.jpg', 'pexels_281_cleaned.jpg',
  'pexels_283_cleaned.jpg', 'pexels_285_cleaned.jpg', 'pexels_288_cleaned.jpg',
  'pexels_295_cleaned.jpg', 'pexels_302_cleaned.jpg', 'pexels_303_cleaned.jpg',
  'pexels_304_cleaned.jpg', 'pexels_310_cleaned.jpg', 'pexels_311_cleaned.jpg',
  'pexels_314_cleaned.jpg', 'pexels_315_cleaned.jpg', 'pexels_316_cleaned.jpg',
  'pexels_321_cleaned.jpg', 'pexels_322_cleaned.jpg', 'pexels_329_cleaned.jpg',
  'pexels_334_cleaned.jpg', 'pexels_335_cleaned.jpg', 'pexels_336_cleaned.jpg',
  'pexels_338_cleaned.jpg', 'pexels_339_cleaned.jpg', 'pexels_346_cleaned.jpg',
  'pexels_348_cleaned.jpg', 'pexels_352_cleaned.jpg', 'pexels_354_cleaned.jpg',
  'pexels_355_cleaned.jpg', 'pexels_356_cleaned.jpg', 'pexels_360_cleaned.jpg',
  'pexels_361_cleaned.jpg', 'pexels_364_cleaned.jpg', 'pexels_365_cleaned.jpg',
  'pexels_366_cleaned.jpg', 'pexels_368_cleaned.jpg', 'pexels_369_cleaned.jpg',
  'pexels_371_cleaned.jpg', 'pexels_373_cleaned.jpg', 'pexels_378_cleaned.jpg',
  'pexels_386_cleaned.jpg', 'pexels_387_cleaned.jpg', 'pexels_390_cleaned.jpg',
  'pexels_391_cleaned.jpg', 'pexels_393_cleaned.jpg', 'pexels_395_cleaned.jpg',
  'pexels_396_cleaned.jpg', 'pexels_398_cleaned.jpg', 'pexels_399_cleaned.jpg',
  'pexels_400_cleaned.jpg', 'pexels_401_cleaned.jpg', 'pexels_403_cleaned.jpg',
  'pexels_404_cleaned.jpg', 'pexels_406_cleaned.jpg', 'pexels_407_cleaned.jpg',
  'pexels_410_cleaned.jpg', 'pexels_411_cleaned.jpg', 'pexels_412_cleaned.jpg',
  'pexels_427_cleaned.jpg', 'pexels_428_cleaned.jpg', 'pexels_429_cleaned.jpg',
  'pexels_434_cleaned.jpg', 'pexels_436_cleaned.jpg', 'pexels_437_cleaned.jpg',
  'pexels_439_cleaned.jpg', 'pexels_441_cleaned.jpg', 'pexels_449_cleaned.jpg',
  'pexels_451_cleaned.jpg', 'pexels_452_cleaned.jpg', 'pexels_456_cleaned.jpg',
  'pexels_462_cleaned.jpg', 'pexels_465_cleaned.jpg', 'pexels_474_cleaned.jpg',
  'pexels_477_cleaned.jpg', 'randomuser_006_cleaned.jpg', 'randomuser_019_cleaned.jpg',
  'randomuser_049_cleaned.jpg', 'randomuser_051_cleaned.jpg', 'randomuser_052_cleaned.jpg',
];

function wrapWithCloudinary(url) {
  const encoded = encodeURIComponent(url);
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD}/image/fetch/c_fill,g_face,w_400,h_400,q_auto,f_jpg/${encoded}`;
}

async function downloadImage(url, filepath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const buffer = await response.arrayBuffer();
  await writeFile(filepath, Buffer.from(buffer));
}

let pexelsPageMale = 10; // Start from later pages to get fresh photos
let pexelsPageFemale = 15;
const usedIds = new Set();

async function fetchPexelsPhoto(gender) {
  const query = gender === 'male' ? 'headshot portrait casual friendly smile male' : 'headshot portrait casual friendly smile female';
  const page = gender === 'male' ? pexelsPageMale : pexelsPageFemale;

  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=80&page=${page}&orientation=portrait`;

  const res = await fetch(url, {
    headers: { 'Authorization': PEXELS_API_KEY }
  });

  if (!res.ok) throw new Error(`Pexels API error: ${res.status}`);

  const data = await res.json();

  for (const photo of data.photos) {
    if (!usedIds.has(photo.id)) {
      usedIds.add(photo.id);
      return photo.src.medium;
    }
  }

  // Next page
  if (gender === 'male') pexelsPageMale++;
  else pexelsPageFemale++;

  return fetchPexelsPhoto(gender);
}

async function main() {
  console.log('=== Replacing B&W Photos ===\n');
  console.log(`Male B&W: ${BW_MALE.length}`);
  console.log(`Female B&W: ${BW_FEMALE.length}`);
  console.log(`Total: ${BW_MALE.length + BW_FEMALE.length}\n`);

  let deleted = 0;
  let replaced = 0;

  // Process male
  console.log('Processing male photos...');
  for (const cleanedFile of BW_MALE) {
    const cleanedPath = path.join(AVATARS_DIR, 'male', cleanedFile);
    const originalFile = cleanedFile.replace('_cleaned.jpg', '.jpg');
    const originalPath = path.join(AVATARS_DIR, 'male', originalFile);

    // Delete both files
    try {
      if (existsSync(cleanedPath)) {
        await unlink(cleanedPath);
        deleted++;
      }
      if (existsSync(originalPath)) {
        await unlink(originalPath);
        deleted++;
      }
    } catch (e) {
      console.error(`  Error deleting ${cleanedFile}:`, e.message);
    }

    // Download replacement
    try {
      const pexelsUrl = await fetchPexelsPhoto('male');

      // Download original
      await downloadImage(pexelsUrl, originalPath);

      // Download cleaned (through Cloudinary)
      const cloudinaryUrl = wrapWithCloudinary(pexelsUrl);
      await downloadImage(cloudinaryUrl, cleanedPath);

      replaced++;
      process.stdout.write(`\r  Replaced ${replaced}/${BW_MALE.length}`);
    } catch (e) {
      console.error(`\n  Error replacing ${cleanedFile}:`, e.message);
    }
  }
  console.log(' done');

  // Process female
  console.log('Processing female photos...');
  for (let i = 0; i < BW_FEMALE.length; i++) {
    const cleanedFile = BW_FEMALE[i];
    const cleanedPath = path.join(AVATARS_DIR, 'female', cleanedFile);
    const originalFile = cleanedFile.replace('_cleaned.jpg', '.jpg');
    const originalPath = path.join(AVATARS_DIR, 'female', originalFile);

    // Delete both files
    try {
      if (existsSync(cleanedPath)) {
        await unlink(cleanedPath);
        deleted++;
      }
      if (existsSync(originalPath)) {
        await unlink(originalPath);
        deleted++;
      }
    } catch (e) {
      console.error(`  Error deleting ${cleanedFile}:`, e.message);
    }

    // Download replacement
    try {
      const pexelsUrl = await fetchPexelsPhoto('female');

      // Download original
      await downloadImage(pexelsUrl, originalPath);

      // Download cleaned (through Cloudinary)
      const cloudinaryUrl = wrapWithCloudinary(pexelsUrl);
      await downloadImage(cloudinaryUrl, cleanedPath);

      replaced++;
      if ((i + 1) % 10 === 0) process.stdout.write(`\r  Replaced ${i + 1}/${BW_FEMALE.length}`);
    } catch (e) {
      console.error(`\n  Error replacing ${cleanedFile}:`, e.message);
    }
  }
  console.log(' done');

  console.log(`\n=== Complete ===`);
  console.log(`Deleted: ${deleted} files`);
  console.log(`Replaced: ${replaced} photos (both original + _cleaned)`);
}

main().catch(console.error);
