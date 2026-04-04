import finalPhotos from '../data/finalPhotos.json';

// Track used photos per gender - no repeats until all used
const usedIndices: { male: Set<number>; female: Set<number> } = {
  male: new Set(),
  female: new Set()
};

/**
 * Get a random photo for a worker based on gender.
 * No photo repeats until all photos in that gender pool are used,
 * then the cycle resets. On page reload, assignments start fresh.
 */
export function getWorkerPhoto(gender: 'male' | 'female'): string | null {
  const photos = finalPhotos[gender] as string[];

  if (!photos || photos.length === 0) {
    return null;
  }

  // Reset if all photos have been used
  if (usedIndices[gender].size >= photos.length) {
    usedIndices[gender].clear();
  }

  // Pick a random unused index
  let photoIndex: number;
  do {
    photoIndex = Math.floor(Math.random() * photos.length);
  } while (usedIndices[gender].has(photoIndex));

  // Mark as used
  usedIndices[gender].add(photoIndex);
  const filename = photos[photoIndex];

  return `/images/avatars/${gender}/${filename}`;
}

/**
 * Reset all photo assignments (useful for testing or page refresh)
 */
export function resetPhotoAssignments(): void {
  usedIndices.male.clear();
  usedIndices.female.clear();
}
