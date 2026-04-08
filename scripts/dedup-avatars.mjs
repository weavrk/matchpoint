/**
 * Remove source avatar images that are visual duplicates of images already in finalPhotos.json.
 * Also removes dupes within the source pool itself (keeps one copy).
 *
 * Uses perceptual hashing (average hash) via sharp.
 * Final array stays untouched.
 *
 * Usage: node scripts/dedup-avatars.mjs [--dry-run]
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const AVATARS_DIR = path.join(ROOT, 'web/public/images/avatars');
const FINAL_PATH = path.join(ROOT, 'web/src/data/finalPhotos.json');
const DRY_RUN = process.argv.includes('--dry-run');

const HASH_SIZE = 8; // 8x8 = 64-bit hash
const HAMMING_THRESHOLD = 5; // distance <= 5 = visual dupe

// Compute average hash for an image
async function computeAHash(filePath) {
  try {
    const buf = await sharp(filePath)
      .resize(HASH_SIZE, HASH_SIZE, { fit: 'fill' })
      .grayscale()
      .raw()
      .toBuffer();

    const pixels = [...buf];
    const avg = pixels.reduce((a, b) => a + b, 0) / pixels.length;
    // 64-bit hash as BigInt
    let hash = 0n;
    for (let i = 0; i < pixels.length; i++) {
      if (pixels[i] >= avg) hash |= 1n << BigInt(i);
    }
    return hash;
  } catch {
    return null; // skip corrupt images
  }
}

function hammingDistance(a, b) {
  let xor = a ^ b;
  let dist = 0;
  while (xor > 0n) {
    dist += Number(xor & 1n);
    xor >>= 1n;
  }
  return dist;
}

async function main() {
  const finalPhotos = JSON.parse(fs.readFileSync(FINAL_PATH, 'utf-8'));
  const finalSet = new Set([
    ...finalPhotos.male.map(f => path.join(AVATARS_DIR, 'male', f)),
    ...finalPhotos.female.map(f => path.join(AVATARS_DIR, 'female', f)),
  ]);

  console.log(`Final set: ${finalSet.size} photos (untouched)`);
  if (DRY_RUN) console.log('DRY RUN — no files will be deleted\n');

  let totalDeleted = 0;

  for (const gender of ['male', 'female']) {
    const dir = path.join(AVATARS_DIR, gender);
    const allFiles = fs.readdirSync(dir)
      .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
      .map(f => path.join(dir, f));

    const finalFiles = allFiles.filter(f => finalSet.has(f));
    const sourceFiles = allFiles.filter(f => !finalSet.has(f));

    console.log(`\n${gender}: ${finalFiles.length} final, ${sourceFiles.length} source`);

    // Hash all final images
    console.log(`  Hashing ${finalFiles.length} final images...`);
    const finalHashes = [];
    for (const f of finalFiles) {
      const h = await computeAHash(f);
      if (h !== null) finalHashes.push({ file: f, hash: h });
    }

    // Hash source and check against final + already-seen source hashes
    console.log(`  Hashing ${sourceFiles.length} source images...`);
    const keptSourceHashes = []; // source images we keep (not dupes)
    let dupOfFinal = 0;
    let dupOfSource = 0;
    let deleted = 0;

    for (const f of sourceFiles) {
      const h = await computeAHash(f);
      if (h === null) continue;

      // Check against final
      const isDupOfFinal = finalHashes.some(fh => hammingDistance(h, fh.hash) <= HAMMING_THRESHOLD);
      if (isDupOfFinal) {
        dupOfFinal++;
        if (!DRY_RUN) fs.unlinkSync(f);
        deleted++;
        continue;
      }

      // Check against already-kept source images
      const isDupOfSource = keptSourceHashes.some(sh => hammingDistance(h, sh.hash) <= HAMMING_THRESHOLD);
      if (isDupOfSource) {
        dupOfSource++;
        if (!DRY_RUN) fs.unlinkSync(f);
        deleted++;
        continue;
      }

      keptSourceHashes.push({ file: f, hash: h });
    }

    console.log(`  Dupes of final: ${dupOfFinal}`);
    console.log(`  Dupes within source: ${dupOfSource}`);
    console.log(`  ${DRY_RUN ? 'Would delete' : 'Deleted'}: ${deleted}`);
    console.log(`  Remaining source: ${keptSourceHashes.length}`);
    totalDeleted += deleted;
  }

  console.log(`\nTotal ${DRY_RUN ? 'would delete' : 'deleted'}: ${totalDeleted}`);
}

main().catch(console.error);
