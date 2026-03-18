import { WorkerProfile, JobSpec, MatchedWorker } from './types';

// Brand mappings based on Reflex brand tiers (ELEVATED, LUXURY, MID only)
const EXPERIENCE_BRAND_MAP: Record<string, string[]> = {
  'footwear': [
    'Nike', 'Foot Locker', 'Finish Line', 'Champs Sports', 'Adidas', 'Puma',
    'Vans', 'New Balance', 'Steve Madden', 'Cole Haan', 'Stuart Weitzman',
    'Christian Louboutin', 'Golden Goose', 'Allbirds', 'UGG', 'Clarks', 'Sperry',
    'Johnston & Murphy', 'Tecovas', 'Lucchese', 'Frye'
  ],
  'apparel': [
    // MID
    'Gap', 'H&M', 'Zara', 'Forever 21', 'Old Navy', 'Banana Republic', 'Express',
    'American Eagle', 'Hollister', 'Abercrombie & Fitch', 'PacSun', 'UNIQLO',
    'Ann Taylor', 'LOFT', 'Chico\'s', 'White House Black Market', 'Talbots',
    // ELEVATED
    'Nordstrom', 'Madewell', 'J. Crew', 'Free People', 'Anthropologie', 'Levi\'s',
    'Club Monaco', 'Mango', 'Aritzia', 'Everlane', 'Reformation', 'Faherty',
    'Bonobos', 'Vineyard Vines', 'Tommy Hilfiger',
    // LUXURY
    'Neiman Marcus', 'Saks Fifth Avenue', 'Bloomingdale\'s', 'Nordstrom',
    'Theory', 'Vince', 'Rag & Bone', 'Alice + Olivia', 'Tory Burch',
    'Kate Spade', 'Coach', 'Michael Kors', 'Burberry', 'Gucci', 'Louis Vuitton'
  ],
  'beauty': [
    'Sephora', 'Ulta Beauty', 'MAC Cosmetics', 'Bath & Body Works',
    'Estee Lauder', 'Clinique', 'Bobbi Brown', 'Origins', 'La Mer',
    'Tom Ford', 'Jo Malone', 'Le Labo', 'Glossier', 'Bare Minerals', 'Aveda'
  ],
  'sporting goods': [
    'Nike', 'Adidas', 'Under Armour', 'Lululemon', 'Athleta', 'Fabletics',
    'REI', 'Patagonia', 'North Face', 'Columbia', 'Vuori', 'Alo Yoga',
    'Outdoor Voices', 'Free People Movement'
  ],
  'home': [
    'Pottery Barn', 'Williams-Sonoma', 'Crate & Barrel', 'West Elm',
    'Restoration Hardware', 'HomeGoods', 'TJ Maxx', 'Marshalls'
  ],
  'general retail': [
    'Nordstrom Rack', 'Ross', 'Kohl\'s', 'JCPenney', 'Macy\'s',
    'Dillard\'s', 'Belk', 'Lord & Taylor'
  ],
  'accessories': [
    'Coach', 'Kate Spade', 'Tory Burch', 'Michael Kors', 'Louis Vuitton',
    'Gucci', 'Kendra Scott', 'Gorjana', 'Pandora', 'Swarovski',
    'David Yurman', 'Tiffany & Co', 'Ray Ban', 'Warby Parker', 'Sunglass Hut'
  ]
};

function expandedBrands(experienceTypes: string[], explicitBrands: string[]): Set<string> {
  const set = new Set(explicitBrands.map(b => b.toLowerCase()));
  for (const t of experienceTypes) {
    for (const b of EXPERIENCE_BRAND_MAP[t.toLowerCase()] ?? []) {
      set.add(b.toLowerCase());
    }
  }
  return set;
}

export function matchWorkers(allWorkers: WorkerProfile[], spec: JobSpec): MatchedWorker[] {
  const specTypes  = new Set(spec.experienceTypes.map(t => t.toLowerCase()));
  const brandPool  = expandedBrands(spec.experienceTypes, spec.brands);

  const scored: MatchedWorker[] = allWorkers.map(worker => {
    let score = 0;
    const reasons: string[] = [];

    // Market (40 pts)
    if (worker.market.toLowerCase() === spec.market.toLowerCase()) {
      score += 40;
      reasons.push(`Based in ${worker.market}`);
    }

    // Experience type (15 pts each, max 30)
    const matchedTypes = worker.experienceTypes.filter(t => specTypes.has(t.toLowerCase()));
    if (matchedTypes.length > 0) {
      score += Math.min(30, matchedTypes.length * 15);
      reasons.push(`${matchedTypes.join(' & ')} experience`);
    }

    // Brand overlap (7 pts each, max 20)
    const matchedBrands = worker.brandsWorked.filter(b => brandPool.has(b.toLowerCase()));
    if (matchedBrands.length > 0) {
      score += Math.min(20, matchedBrands.length * 7);
      reasons.push(`Worked at: ${matchedBrands.slice(0, 3).join(', ')}`);
    }

    // FT/PT (15 pts)
    // spec uses 'FT'/'PT'/'Both'; workers use 'Full-Time'/'Part-Time'/'Part-Time, Full-Time'
    const workerOpenToBoth = worker.preference === 'Part-Time, Full-Time';
    const prefMatch =
      spec.preference === 'Both' ||
      workerOpenToBoth ||
      (spec.preference === 'FT' && worker.preference === 'Full-Time') ||
      (spec.preference === 'PT' && worker.preference === 'Part-Time');
    if (prefMatch) {
      score += 15;
      reasons.push(workerOpenToBoth ? 'Open to FT or PT' : `Seeking ${worker.preference}`);
    }

    // Shift verified bonus (10 pts)
    if (worker.shiftVerified) {
      score += 10;
      reasons.push('Shift Verified ✓');
    }

    // Depth bonus (up to 5 pts)
    score += Math.min(5, Math.floor(worker.shiftsOnReflex / 10));

    return { ...worker, matchScore: score, matchReasons: reasons };
  });

  return scored
    .filter(w => w.matchScore > 0)
    .sort((a, b) => {
      // Within 5 pts, prefer shift verified
      if (Math.abs(a.matchScore - b.matchScore) <= 5 && a.shiftVerified !== b.shiftVerified) {
        return a.shiftVerified ? -1 : 1;
      }
      return b.matchScore - a.matchScore;
    });
}
