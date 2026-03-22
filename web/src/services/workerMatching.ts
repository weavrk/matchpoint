import type { WorkerProfile, JobSpec, MatchedWorker, BrandTier } from '../types';

export function matchWorkers(workers: WorkerProfile[], spec: JobSpec): MatchedWorker[] {
  const specTiers = new Set(spec.brandTier);

  const scored: MatchedWorker[] = workers.map((worker) => {
    let score = 0;
    const reasons: string[] = [];

    // Market match (40 pts)
    if (worker.market.toLowerCase() === spec.market.toLowerCase()) {
      score += 40;
      reasons.push(`Based in ${worker.market}`);
    }

    // Brand tier match (25 pts max)
    const matchedTiers = worker.brandsWorked
      .map((b) => b.tier)
      .filter((tier) => specTiers.has(tier));
    if (matchedTiers.length > 0) {
      score += Math.min(25, matchedTiers.length * 10);
      const tierNames = [...new Set(matchedTiers)].map(tierLabel).join(', ');
      reasons.push(`${tierNames} experience`);
    }

    // FT/PT preference (15 pts)
    if (
      spec.preference === 'Both' ||
      worker.preference === 'Both' ||
      worker.preference === spec.preference
    ) {
      score += 15;
      reasons.push(worker.preference === 'Both' ? 'Open to FT or PT' : `Seeking ${worker.preference}`);
    }

    // Shift verified bonus (10 pts)
    if (worker.shiftVerified) {
      score += 10;
      reasons.push('Shift Verified');
    }

    // Depth bonus based on shifts (up to 5 pts)
    score += Math.min(5, Math.floor(worker.shiftsOnReflex / 10));

    // Endorsements bonus (up to 5 pts)
    score += Math.min(5, worker.endorsements.length);

    return { ...worker, matchScore: score, matchReasons: reasons };
  });

  return scored
    .filter((w) => w.matchScore > 0)
    .sort((a, b) => {
      // Within 5 pts, prefer shift verified
      if (Math.abs(a.matchScore - b.matchScore) <= 5 && a.shiftVerified !== b.shiftVerified) {
        return a.shiftVerified ? -1 : 1;
      }
      return b.matchScore - a.matchScore;
    });
}

function tierLabel(tier: BrandTier): string {
  switch (tier) {
    case 'luxury':
      return 'Luxury';
    case 'elevated':
      return 'Elevated';
    case 'mid':
      return 'Specialty';
  }
}
