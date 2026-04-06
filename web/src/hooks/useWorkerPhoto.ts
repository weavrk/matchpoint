import finalPhotos from '../data/finalPhotos.json';

// Cache photo assignments by worker ID - ensures same worker always gets same photo
const workerPhotoCache: Map<string, string> = new Map();

// Track used photos per gender - no repeats until all used
const usedIndices: { male: Set<number>; female: Set<number> } = {
  male: new Set(),
  female: new Set()
};

/**
 * Get a photo for a worker based on gender and worker ID.
 * Same worker ID always returns the same photo (cached).
 * No photo repeats until all photos in that gender pool are used.
 */
export function getWorkerPhoto(gender: 'male' | 'female', workerId?: string): string | null {
  // If we have a cached photo for this worker, return it
  if (workerId && workerPhotoCache.has(workerId)) {
    return workerPhotoCache.get(workerId)!;
  }

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

  const photoPath = `/images/avatars/${gender}/${filename}`;

  // Cache the assignment for this worker
  if (workerId) {
    workerPhotoCache.set(workerId, photoPath);
  }

  return photoPath;
}

/**
 * Reset all photo assignments (useful for testing or page refresh)
 */
export function resetPhotoAssignments(): void {
  usedIndices.male.clear();
  usedIndices.female.clear();
}
