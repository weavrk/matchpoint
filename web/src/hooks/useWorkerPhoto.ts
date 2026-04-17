import finalPhotos from '../data/finalPhotos.json';

/**
 * Deterministic hash of a string to a positive integer.
 * Same input always produces the same output.
 */
function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h) + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/**
 * Get a photo for a worker based on gender and worker ID.
 * Deterministic: same worker ID always returns the same photo.
 */
export function getWorkerPhoto(gender: 'male' | 'female', workerId?: string): string | null {
  const photos = finalPhotos[gender] as string[];

  if (!photos || photos.length === 0) {
    return null;
  }

  // Deterministic index from worker ID
  const index = workerId ? hashString(workerId) % photos.length : 0;
  const filename = photos[index];

  return `/images/avatars/${gender}/${filename}`;
}

/**
 * Reset all photo assignments (no-op now that assignments are deterministic)
 */
export function resetPhotoAssignments(): void {
  // No-op — assignments are deterministic by worker ID
}
