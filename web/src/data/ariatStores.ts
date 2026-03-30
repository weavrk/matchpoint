/** Prototype: Ariat store locations the signed-in DM can post against (TX, AZ, NM, CA, NV, OK, AL, LA). */
export interface AriatStoreOption {
  id: string;
  state: string;
  /** Short label in the dropdown */
  label: string;
  /** Full line sent as the confirmed address */
  displayName: string;
  lat: string;
  lon: string;
}

const rows: Omit<AriatStoreOption, 'id'>[] = [
  // Texas
  { state: 'Texas', label: 'Mule Alley, Fort Worth Stockyards', displayName: 'Ariat, Mule Alley, Fort Worth Stockyards, Fort Worth, TX 76164, USA', lat: '32.7880', lon: '-97.3480' },
  { state: 'Texas', label: 'The Domain, Austin', displayName: 'Ariat, The Domain, Austin, TX 78758, USA', lat: '30.4022', lon: '-97.7255' },
  { state: 'Texas', label: 'San Marcos Premium Outlets', displayName: 'Ariat Outlet, San Marcos Premium Outlets, San Marcos, TX 78666, USA', lat: '29.8686', lon: '-97.9389' },
  { state: 'Texas', label: 'Highland Park Village, Dallas', displayName: 'Ariat, Highland Park Village, Dallas, TX 75205, USA', lat: '32.8350', lon: '-96.8067' },
  { state: 'Texas', label: 'The Galleria, Houston', displayName: 'Ariat, The Galleria, Houston, TX 77056, USA', lat: '29.7406', lon: '-95.4621' },
  // Arizona
  { state: 'Arizona', label: 'Scottsdale Fashion Square', displayName: 'Ariat, Scottsdale Fashion Square, Scottsdale, AZ 85251, USA', lat: '33.5041', lon: '-111.9289' },
  { state: 'Arizona', label: 'Biltmore Fashion Park, Phoenix', displayName: 'Ariat, Biltmore Fashion Park, Phoenix, AZ 85016, USA', lat: '33.5196', lon: '-112.0287' },
  // New Mexico
  { state: 'New Mexico', label: 'ABQ Uptown, Albuquerque', displayName: 'Ariat, ABQ Uptown, Albuquerque, NM 87110, USA', lat: '35.1042', lon: '-106.5678' },
  // California
  { state: 'California', label: 'South Coast Plaza, Costa Mesa', displayName: 'Ariat, South Coast Plaza, Costa Mesa, CA 92626, USA', lat: '33.6911', lon: '-117.8884' },
  { state: 'California', label: 'The Grove, Los Angeles', displayName: 'Ariat, The Grove, Los Angeles, CA 90036, USA', lat: '34.0722', lon: '-118.3577' },
  { state: 'California', label: 'Fashion Valley, San Diego', displayName: 'Ariat, Fashion Valley, San Diego, CA 92108, USA', lat: '32.7679', lon: '-117.1665' },
  { state: 'California', label: 'Arden Fair, Sacramento', displayName: 'Ariat, Arden Fair, Sacramento, CA 95815, USA', lat: '38.5996', lon: '-121.4277' },
  // Nevada
  { state: 'Nevada', label: 'Fashion Show, Las Vegas', displayName: 'Ariat, Fashion Show Mall, Las Vegas, NV 89109, USA', lat: '36.1281', lon: '-115.1710' },
  { state: 'Nevada', label: 'Downtown Summerlin, Las Vegas', displayName: 'Ariat, Downtown Summerlin, Las Vegas, NV 89135, USA', lat: '36.1813', lon: '-115.2550' },
  // Oklahoma
  { state: 'Oklahoma', label: 'Classen Curve, Oklahoma City', displayName: 'Ariat, Classen Curve, Oklahoma City, OK 73118, USA', lat: '35.5280', lon: '-97.5290' },
  // Alabama
  { state: 'Alabama', label: 'The Summit, Birmingham', displayName: 'Ariat, The Summit, Birmingham, AL 35243, USA', lat: '33.3885', lon: '-86.7258' },
  // Louisiana
  { state: 'Louisiana', label: 'Lakeside Shopping Center, Metairie', displayName: 'Ariat, Lakeside Shopping Center, Metairie, LA 70002, USA', lat: '30.0153', lon: '-90.0850' },
];

const STATE_ORDER = [
  'Texas',
  'Arizona',
  'New Mexico',
  'California',
  'Nevada',
  'Oklahoma',
  'Alabama',
  'Louisiana',
] as const;

let idCounter = 0;
export const ARIAT_STORE_OPTIONS: AriatStoreOption[] = STATE_ORDER.flatMap((state) =>
  rows
    .filter((r) => r.state === state)
    .map((r) => ({ ...r, id: `ariat-${idCounter++}` }))
);

/** State → stores for optgroups */
export function ariatStoresByState(): { state: string; stores: AriatStoreOption[] }[] {
  return STATE_ORDER.map((state) => ({
    state,
    stores: ARIAT_STORE_OPTIONS.filter((s) => s.state === state),
  })).filter((g) => g.stores.length > 0);
}

/** Precomputed groups for UI (static list). */
export const ARIAT_STORE_GROUPS = ariatStoresByState();
