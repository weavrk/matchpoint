/**
 * "Store Favorite" achievement: worker appears in favorited_by_brands for at least one
 * of these retailer brands (in their market — data is per worker row from source CSV).
 */
export const ELITE_STORE_FAVORITE_BRANDS_DISPLAY = [
  'Ariat',
  'Ralph Lauren',
  'Ralph Lauren Factory Store',
  'Golden Goose',
  'Marc Jacobs',
  'Tecovas',
  'SKIMS',
  'UGG',
  'Rag & Bone',
  'Vineyard Vines',
  'Faherty',
] as const;

const ELITE_CANONICAL = new Set<string>([
  'ariat',
  'ralph lauren',
  'ralph lauren factory store',
  'golden goose',
  'marc jacobs',
  'tecovas',
  'skims',
  'ugg',
  'rag and bone',
  'vineyard vines',
  'faherty',
]);

/** Lowercase, collapse whitespace, treat "&" as "and" for matching CSV variants. */
export function canonicalizeFavoritedBrandName(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function hasEliteStoreFavorite(favoritedByBrands: string[] | null | undefined): boolean {
  if (!favoritedByBrands?.length) return false;
  return favoritedByBrands.some((b) => ELITE_CANONICAL.has(canonicalizeFavoritedBrandName(b)));
}
