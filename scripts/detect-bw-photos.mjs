import { readdir } from 'fs/promises';
import { execSync } from 'child_process';
import path from 'path';

const AVATARS_DIR = path.join(process.cwd(), 'web/public/images/avatars');

// Detect if image is B&W by checking color saturation
// Uses sips to get image data and ImageMagick if available, otherwise a simple heuristic
async function isBlackAndWhite(filepath) {
  try {
    // Use Python with PIL to check saturation
    const result = execSync(`python3 -c "
from PIL import Image
import sys

img = Image.open('${filepath}').convert('RGB')
pixels = list(img.getdata())
total_saturation = 0
sample_size = min(1000, len(pixels))
step = max(1, len(pixels) // sample_size)

for i in range(0, len(pixels), step):
    r, g, b = pixels[i]
    max_c = max(r, g, b)
    min_c = min(r, g, b)
    if max_c > 0:
        saturation = (max_c - min_c) / max_c
        total_saturation += saturation

avg_saturation = total_saturation / sample_size
print('BW' if avg_saturation < 0.1 else 'COLOR')
"`, { encoding: 'utf-8' }).trim();

    return result === 'BW';
  } catch (err) {
    console.error(`Error checking ${filepath}:`, err.message);
    return false;
  }
}

async function checkGender(gender) {
  const dir = path.join(AVATARS_DIR, gender);
  const files = (await readdir(dir)).filter(f => f.includes('_cleaned.jpg'));

  console.log(`\nChecking ${files.length} ${gender} photos...`);

  const bwFiles = [];

  for (let i = 0; i < files.length; i++) {
    const filepath = path.join(dir, files[i]);
    const isBW = await isBlackAndWhite(filepath);

    if (isBW) {
      bwFiles.push(files[i]);
    }

    if ((i + 1) % 50 === 0) {
      process.stdout.write(`\r  Checked ${i + 1}/${files.length}, found ${bwFiles.length} B&W`);
    }
  }

  console.log(`\r  Checked ${files.length}/${files.length}, found ${bwFiles.length} B&W`);

  return bwFiles;
}

async function main() {
  console.log('Detecting black & white photos...\n');

  const maleBW = await checkGender('male');
  const femaleBW = await checkGender('female');

  console.log('\n=== B&W Photos Found ===');
  console.log(`Male: ${maleBW.length}`);
  maleBW.forEach(f => console.log(`  ${f}`));
  console.log(`Female: ${femaleBW.length}`);
  femaleBW.forEach(f => console.log(`  ${f}`));

  console.log(`\nTotal B&W: ${maleBW.length + femaleBW.length}`);
}

main().catch(console.error);
