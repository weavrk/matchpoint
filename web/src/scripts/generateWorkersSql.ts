/**
 * Generate SQL INSERT statements for workers
 * Run: npx tsx src/scripts/generateWorkersSql.ts > ../Downloads/workers_insert.sql
 */

import { SAMPLE_WORKERS } from '../data/workers';

function escapeSQL(str: string | null | undefined): string {
  if (str === null || str === undefined) return 'NULL';
  return `'${str.replace(/'/g, "''")}'`;
}

function toJSON(obj: unknown): string {
  if (obj === null || obj === undefined) return 'NULL';
  return `'${JSON.stringify(obj).replace(/'/g, "''")}'::jsonb`;
}

console.log('-- Workers INSERT statements');
console.log('-- Generated from SAMPLE_WORKERS');
console.log('');

for (const worker of SAMPLE_WORKERS) {
  const sql = `INSERT INTO workers (
  id, name, photo, market,
  shift_verified, shifts_on_reflex, invited_back_stores,
  on_time_rating, commitment_score,
  preference, actively_looking, target_brands, about,
  brands_worked, endorsements, previous_experience,
  work_style, reliability, availability, reflex_activity, retailer_quotes
) VALUES (
  ${escapeSQL(worker.id)},
  ${escapeSQL(worker.name)},
  ${escapeSQL(worker.photo)},
  ${escapeSQL(worker.market)},
  ${worker.shiftVerified},
  ${worker.shiftsOnReflex},
  ${worker.invitedBackStores},
  ${worker.onTimeRating ? escapeSQL(worker.onTimeRating) : 'NULL'},
  ${worker.commitmentScore ? escapeSQL(worker.commitmentScore) : 'NULL'},
  ${escapeSQL(worker.preference)},
  ${worker.activelyLooking},
  ${worker.targetBrands ? toJSON(worker.targetBrands) : 'NULL'},
  ${escapeSQL(worker.about)},
  ${toJSON(worker.brandsWorked)},
  ${toJSON(worker.endorsements)},
  ${toJSON(worker.previousExperience)},
  ${toJSON(worker.workStyle)},
  ${worker.reliability ? toJSON(worker.reliability) : 'NULL'},
  ${toJSON(worker.availability)},
  ${worker.reflexActivity ? toJSON(worker.reflexActivity) : 'NULL'},
  ${worker.retailerQuotes ? toJSON(worker.retailerQuotes) : 'NULL'}
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  photo = EXCLUDED.photo,
  market = EXCLUDED.market,
  shift_verified = EXCLUDED.shift_verified,
  shifts_on_reflex = EXCLUDED.shifts_on_reflex,
  invited_back_stores = EXCLUDED.invited_back_stores,
  on_time_rating = EXCLUDED.on_time_rating,
  commitment_score = EXCLUDED.commitment_score,
  preference = EXCLUDED.preference,
  actively_looking = EXCLUDED.actively_looking,
  target_brands = EXCLUDED.target_brands,
  about = EXCLUDED.about,
  brands_worked = EXCLUDED.brands_worked,
  endorsements = EXCLUDED.endorsements,
  previous_experience = EXCLUDED.previous_experience,
  work_style = EXCLUDED.work_style,
  reliability = EXCLUDED.reliability,
  availability = EXCLUDED.availability,
  reflex_activity = EXCLUDED.reflex_activity,
  retailer_quotes = EXCLUDED.retailer_quotes;`;

  console.log(sql);
  console.log('');
}

console.log('-- Migration complete: ' + SAMPLE_WORKERS.length + ' workers');
