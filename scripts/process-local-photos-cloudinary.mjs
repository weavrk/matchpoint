import { writeFile, readFile, readdir } from 'fs/promises';
import path from 'path';

const AVATARS_DIR = path.join(process.cwd(), 'web/public/images/avatars');
const CLOUDINARY_CLOUD = 'dj6tp0f1q';
const BATCH_SIZE = 10;
const DELAY_BETWEEN_BATCHES = 500;

// We need to use the upload API for local files, but we can use fetch with base64
// Actually, simpler: we'll re-fetch from the original sources via Cloudinary
// But we don't have the original URLs anymore...

// Alternative: Use Cloudinary's upload API to upload local file, transform, download back
// But that requires signed API access

// Simplest solution: The local files came from URLs we can reconstruct
// RandomUser: https://randomuser.me/api/portraits/men/0-99.jpg or women/0-99.jpg
// Pexels: We wrapped with Cloudinary already

// Let's check what the files look like - if they're 128x128, they're from RandomUser
// If they're larger, they're from Pexels (already Cloudinary processed)

async function getImageDimensions(filepath) {
  // Use sips on macOS to get dimensions
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);

  try {
    const { stdout } = await execAsync(`sips -g pixelWidth -g pixelHeight "${filepath}" 2>/dev/null`);
    const widthMatch = stdout.match(/pixelWidth:\s*(\d+)/);
    const heightMatch = stdout.match(/pixelHeight:\s*(\d+)/);
    if (widthMatch && heightMatch) {
      return { width: parseInt(widthMatch[1]), height: parseInt(heightMatch[1]) };
    }
  } catch (e) {
    // ignore
  }
  return null;
}

async function processGender(gender) {
  const dir = path.join(AVATARS_DIR, gender);
  const files = await readdir(dir);
  const jpgFiles = files.filter(f => f.endsWith('.jpg')).sort();

  console.log(`\n${gender}: ${jpgFiles.length} files`);

  // Check dimensions of first few files
  let small = 0;
  let large = 0;

  for (const file of jpgFiles.slice(0, 10)) {
    const dims = await getImageDimensions(path.join(dir, file));
    if (dims) {
      if (dims.width <= 200) small++;
      else large++;
    }
  }

  console.log(`  Sample: ${small} small (<=200px), ${large} large (>200px)`);

  // For RandomUser images (small), we can reconstruct the URL and re-fetch via Cloudinary
  // The pattern is: 001.jpg -> men/0.jpg, 002.jpg -> men/1.jpg, etc.

  return { total: jpgFiles.length, small, large };
}

async function main() {
  console.log('Analyzing current avatar files...\n');

  const male = await processGender('male');
  const female = await processGender('female');

  console.log('\n---');
  console.log('These files need to be re-downloaded through Cloudinary.');
  console.log('The small ones are from RandomUser (128x128), large ones from Pexels.');
  console.log('\nTo fix this, we need to:');
  console.log('1. For RandomUser: reconstruct URL from index, wrap with Cloudinary, re-download');
  console.log('2. For Pexels: they should already be processed (check if 400x400)');
}

main();
