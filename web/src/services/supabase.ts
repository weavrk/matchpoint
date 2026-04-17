import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kxfbismfpmjwvemfznvm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4ZmJpc21mcG1qd3ZlbWZ6bnZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4NzIzODIsImV4cCI6MjA4OTQ0ODM4Mn0.DB_d_RvlhKNOPDrnEySJPWHvLn3_HacXY3O5xoSS6bI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types matching our Supabase tables
export interface Market {
  id: string;
  name: string;
  state: string;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  title: string;
  category: string;
  description: string | null;
  match_keywords: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface Retailer {
  id: string;
  name: string;
  classification: 'Luxury' | 'Specialty' | 'Big Box';
  created_at: string;
  updated_at: string;
}

export interface JobPosting {
  id: string;
  market_name: string | null;
  company: string | null;
  location: string | null;
  title: string;
  employment_type: string | null;
  salary: string | null;
  benefits: string | null;
  market_id: string;
  retailer_id: string | null;
  role_id: string;
  scraped_at: string;
  source_url: string | null;
  source: string | null;
}

export interface RetailerLive {
  id: number;
  name: string;
  updated_at: string | null;
}

// Markets API
export async function fetchMarkets(): Promise<Market[]> {
  const { data, error } = await supabase
    .from('markets')
    .select('*')
    .order('state')
    .order('name');

  if (error) {
    console.error('Error fetching markets:', error);
    throw error;
  }
  return data || [];
}

export async function addMarket(name: string, state: string): Promise<Market> {
  const { data, error } = await supabase
    .from('markets')
    .insert({ name, state })
    .select()
    .single();

  if (error) {
    console.error('Error adding market:', error);
    throw error;
  }
  return data;
}

export async function deleteMarket(id: string): Promise<void> {
  const { error } = await supabase
    .from('markets')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting market:', error);
    throw error;
  }
}

export async function syncMarkets(markets: { name: string; state: string }[]): Promise<void> {
  // Use upsert approach - first get existing IDs to delete removed ones
  const { data: existing, error: fetchError } = await supabase
    .from('markets')
    .select('id, name, state');

  if (fetchError) {
    console.error('Error fetching existing markets:', fetchError);
    throw fetchError;
  }

  // Delete markets that are no longer in the list
  const newMarketKeys = new Set(markets.map(m => `${m.name}-${m.state}`));
  const toDelete = (existing || []).filter(e => !newMarketKeys.has(`${e.name}-${e.state}`));

  for (const market of toDelete) {
    const { error } = await supabase.from('markets').delete().eq('id', market.id);
    if (error) {
      console.error('Error deleting market:', error);
      throw error;
    }
  }

  // Insert new markets that don't exist yet
  const existingKeys = new Set((existing || []).map(e => `${e.name}-${e.state}`));
  const toInsert = markets.filter(m => !existingKeys.has(`${m.name}-${m.state}`));

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('markets')
      .insert(toInsert.map(m => ({ name: m.name, state: m.state })));

    if (insertError) {
      console.error('Error inserting markets:', insertError);
      throw insertError;
    }
  }
}

// Roles API
export async function fetchRoles(): Promise<Role[]> {
  const { data, error } = await supabase
    .from('roles')
    .select('*')
    .order('title');

  if (error) {
    console.error('Error fetching roles:', error);
    throw error;
  }
  return data || [];
}

// Convert string to Title Case
function toTitleCase(str: string): string {
  return str.toLowerCase().replace(/\b\w/g, char => char.toUpperCase());
}

export async function addRole(title: string, category: string = 'Other'): Promise<Role> {
  const titleCased = toTitleCase(title);
  const { data, error } = await supabase
    .from('roles')
    .insert({ title: titleCased, category })
    .select()
    .single();

  if (error) {
    console.error('Error adding role:', error);
    throw error;
  }
  return data;
}

export async function deleteRole(id: string): Promise<void> {
  const { error } = await supabase
    .from('roles')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting role:', error);
    throw error;
  }
}

export async function addKeywordToRole(roleId: string, keyword: string): Promise<Role> {
  // First get current keywords
  const { data: role, error: fetchError } = await supabase
    .from('roles')
    .select('match_keywords')
    .eq('id', roleId)
    .single();

  if (fetchError) {
    console.error('Error fetching role:', fetchError);
    throw fetchError;
  }

  const currentKeywords = role?.match_keywords || [];
  const normalizedKeyword = keyword.toLowerCase().trim();

  // Don't add duplicates
  if (currentKeywords.includes(normalizedKeyword)) {
    const { data } = await supabase.from('roles').select('*').eq('id', roleId).single();
    return data as Role;
  }

  const { data, error } = await supabase
    .from('roles')
    .update({
      match_keywords: [...currentKeywords, normalizedKeyword],
      updated_at: new Date().toISOString(),
    })
    .eq('id', roleId)
    .select()
    .single();

  if (error) {
    console.error('Error adding keyword to role:', error);
    throw error;
  }
  return data;
}

export async function syncRoles(roles: { title: string; category?: string }[]): Promise<void> {
  // Get existing roles
  const { data: existing, error: fetchError } = await supabase
    .from('roles')
    .select('id, title');

  if (fetchError) {
    console.error('Error fetching existing roles:', fetchError);
    throw fetchError;
  }

  // Delete roles that are no longer in the list
  const newRoleTitles = new Set(roles.map(r => r.title));
  const toDelete = (existing || []).filter(e => !newRoleTitles.has(e.title));

  for (const role of toDelete) {
    const { error } = await supabase.from('roles').delete().eq('id', role.id);
    if (error) {
      console.error('Error deleting role:', error);
      throw error;
    }
  }

  // Insert new roles that don't exist yet
  const existingTitles = new Set((existing || []).map(e => e.title));
  const toInsert = roles.filter(r => !existingTitles.has(r.title));

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('roles')
      .insert(toInsert.map(r => ({
        title: r.title,
        category: r.category || 'Other'
      })));

    if (insertError) {
      console.error('Error inserting roles:', insertError);
      throw insertError;
    }
  }
}

// Retailers API
export async function fetchRetailers(): Promise<Retailer[]> {
  const { data, error } = await supabase
    .from('retailers')
    .select('*')
    .order('classification')
    .order('name');

  if (error) {
    console.error('Error fetching retailers:', error);
    throw error;
  }
  return data || [];
}

export async function addRetailer(name: string, classification: 'Luxury' | 'Specialty' | 'Big Box'): Promise<Retailer> {
  const { data, error } = await supabase
    .from('retailers')
    .insert({ name, classification })
    .select()
    .single();

  if (error) {
    console.error('Error adding retailer:', error);
    throw error;
  }
  return data;
}

export async function updateRetailer(id: string, updates: Partial<Pick<Retailer, 'name' | 'classification'>>): Promise<Retailer> {
  const { data, error } = await supabase
    .from('retailers')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating retailer:', error);
    throw error;
  }
  return data;
}

export async function deleteRetailer(id: string): Promise<void> {
  const { error } = await supabase
    .from('retailers')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting retailer:', error);
    throw error;
  }
}

export async function syncRetailers(retailers: { name: string; classification: 'Luxury' | 'Specialty' | 'Big Box' }[]): Promise<void> {
  // Get existing retailers
  const { data: existing, error: fetchError } = await supabase
    .from('retailers')
    .select('id, name, classification');

  if (fetchError) {
    console.error('Error fetching existing retailers:', fetchError);
    throw fetchError;
  }

  // Delete retailers that are no longer in the list
  const newRetailerNames = new Set(retailers.map(r => r.name));
  const toDelete = (existing || []).filter(e => !newRetailerNames.has(e.name));

  for (const retailer of toDelete) {
    const { error } = await supabase.from('retailers').delete().eq('id', retailer.id);
    if (error) {
      console.error('Error deleting retailer:', error);
      throw error;
    }
  }

  // Update retailers with changed classification
  const existingMap = new Map((existing || []).map(e => [e.name, e]));
  for (const retailer of retailers) {
    const existingRetailer = existingMap.get(retailer.name);
    if (existingRetailer && existingRetailer.classification !== retailer.classification) {
      const { error } = await supabase
        .from('retailers')
        .update({ classification: retailer.classification })
        .eq('id', existingRetailer.id);
      if (error) {
        console.error('Error updating retailer:', error);
        throw error;
      }
    }
  }

  // Insert new retailers that don't exist yet
  const existingNames = new Set((existing || []).map(e => e.name));
  const toInsert = retailers.filter(r => !existingNames.has(r.name));

  if (toInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('retailers')
      .insert(toInsert.map(r => ({ name: r.name, classification: r.classification })));

    if (insertError) {
      console.error('Error inserting retailers:', insertError);
      throw insertError;
    }
  }
}

// Job Postings API
export async function fetchJobPostings(): Promise<JobPosting[]> {
  const { data, error } = await supabase
    .from('job_postings')
    .select('*')
    .order('scraped_at', { ascending: false });

  if (error) {
    console.error('Error fetching job postings:', error);
    throw error;
  }
  return data || [];
}

export interface ScrapedJob {
  title: string;
  company: string;
  location?: string;
  salary?: string;
  benefits?: string;
  employmentType?: string;
  link?: string;
  sourceUrl?: string;
  source?: string;
  market: string;
  marketId: string;
  role: string;
  roleId: string;
}

export async function saveScrapedJobs(jobs: ScrapedJob[], retailers: Retailer[]): Promise<{ saved: number; errors: number; skipped: number }> {
  // Create a map of retailer name to id (case-insensitive)
  const retailerMap = new Map(retailers.map(r => [r.name.toLowerCase(), r.id]));

  // First, fetch existing source_urls from database to dedupe
  const { data: existingJobs, error: fetchError } = await supabase
    .from('job_postings')
    .select('source_url');

  if (fetchError) {
    console.error('Error fetching existing jobs for dedupe:', fetchError);
  }

  const existingUrls = new Set((existingJobs || []).map(j => j.source_url).filter(Boolean));

  // Dedupe jobs - filter out any with source_url already in database
  const newJobs = jobs.filter(job => {
    const url = job.sourceUrl || job.link;
    return url && !existingUrls.has(url);
  });

  const skipped = jobs.length - newJobs.length;
  if (skipped > 0) {
    console.log(`Skipping ${skipped} duplicate jobs (already in database)`);
  }

  let saved = 0;
  let errors = 0;

  // Insert jobs in batches of 50 to avoid hitting limits
  const batchSize = 50;
  for (let i = 0; i < newJobs.length; i += batchSize) {
    const batch = newJobs.slice(i, i + batchSize);

    const jobsToInsert = batch.map(job => {
      // Try to find retailer ID by matching company name
      const retailerId = retailerMap.get(job.company.toLowerCase()) || null;

      return {
        market_name: job.market,
        company: toTitleCase(job.company),
        location: job.location || null,
        title: job.title,
        employment_type: job.employmentType || null,
        salary: job.salary || null,
        benefits: job.benefits || null,
        market_id: job.marketId,
        retailer_id: retailerId,
        role_id: job.roleId,
        role: job.role ? toTitleCase(job.role) : null,
        scraped_at: new Date().toISOString(),
        source_url: job.sourceUrl || null,
        source: job.source || null,
      };
    });

    const { error } = await supabase
      .from('job_postings')
      .insert(jobsToInsert);

    if (error) {
      console.error('Error inserting job batch:', error);
      errors += batch.length;
    } else {
      saved += batch.length;
    }
  }

  console.log(`Saved ${saved} NEW jobs to Supabase, ${errors} errors, ${skipped} skipped (duplicates)`);
  return { saved, errors, skipped };
}

// Retailers Live API
export async function fetchRetailersLive(): Promise<RetailerLive[]> {
  const { data, error } = await supabase
    .from('retailers_live')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching retailers_live:', error);
    throw error;
  }
  return data || [];
}

// ============================================================
// Published Jobs API
// ============================================================

export interface PublishedJobDB {
  id: string;
  job_id: string;
  job_title: string;
  job_type: 'Part-time' | 'Full-time' | 'Either';
  store_location: string | null;
  job_market: string;
  pay_type: 'hourly' | 'salary';
  pay_range: string;
  benefits: string[];
  created_at: string;
  unpublished_at: string | null;
}

// Fetch all published jobs
export async function fetchPublishedJobs(): Promise<PublishedJobDB[]> {
  const { data, error } = await supabase
    .from('jobs_published')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching published jobs:', error);
    throw error;
  }
  return data || [];
}

// Create a new published job
export async function createPublishedJob(job: {
  job_id: string;
  job_title: string;
  job_type: 'Part-time' | 'Full-time' | 'Either';
  store_location?: string;
  job_market: string;
  pay_type: 'hourly' | 'salary';
  pay_range: string;
  benefits: string[];
}): Promise<PublishedJobDB> {
  const { data, error } = await supabase
    .from('jobs_published')
    .insert({
      job_id: job.job_id,
      job_title: job.job_title,
      job_type: job.job_type,
      store_location: job.store_location || null,
      job_market: job.job_market,
      pay_type: job.pay_type,
      pay_range: job.pay_range,
      benefits: job.benefits,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating published job:', error);
    throw error;
  }
  return data;
}

// Unpublish a job (set unpublished_at timestamp)
export async function unpublishJob(jobId: string): Promise<PublishedJobDB> {
  const { data, error } = await supabase
    .from('jobs_published')
    .update({ unpublished_at: new Date().toISOString() })
    .eq('job_id', jobId)
    .select()
    .single();

  if (error) {
    console.error('Error unpublishing job:', error);
    throw error;
  }
  return data;
}

// Delete a published job
export async function deletePublishedJob(jobId: string): Promise<void> {
  const { error } = await supabase
    .from('jobs_published')
    .delete()
    .eq('job_id', jobId);

  if (error) {
    console.error('Error deleting published job:', error);
    throw error;
  }
}

// ============================================================
// WORKERS API
// ============================================================

// Column sets for optimized queries
const WORKER_COLUMNS_CARD = `
  id, name, photo, gender, market, actively_looking, shift_verified, market_favorite, favorited_by_brands,
  shifts_on_reflex, brands_worked, endorsement_counts, shift_experience, invited_back_stores,
  about_me, previous_experience, reflex_activity, retailer_quotes, retailer_summary,
  current_tier, unique_store_count, store_favorite_count, tardy_ratio, tardy_percent, urgent_cancel_ratio, urgent_cancel_percent,
  experience_level
`.replace(/\s+/g, ' ').trim();

const WORKER_COLUMNS_FULL = `
  id, name, photo, gender, market, actively_looking, about_me, previous_experience,
  shift_verified, market_favorite, favorited_by_brands, reflex_activity, shifts_on_reflex, brands_worked,
  retailer_quotes, retailer_summary, endorsement_counts, shift_experience, invited_back_stores,
  tardy_ratio, tardy_percent, urgent_cancel_ratio, urgent_cancel_percent,
  current_tier, unique_store_count, store_favorite_count, interview_transcript, worker_uuid, worker_id
`.replace(/\s+/g, ' ').trim();

const WORKER_COLUMNS_LIST = `
  id, name, photo, gender, market, shift_verified, shifts_on_reflex, actively_looking, current_tier, experience_level
`.replace(/\s+/g, ' ').trim();

// Connection list needs achievement data too (market_favorite, tardy/cancel percents, unique_store_count, reflex_activity)
const WORKER_COLUMNS_CONNECTION = `
  id, name, photo, gender, market, shift_verified, shifts_on_reflex, actively_looking, current_tier,
  market_favorite, favorited_by_brands, store_favorite_count, tardy_percent, urgent_cancel_percent, unique_store_count, reflex_activity, experience_level
`.replace(/\s+/g, ' ').trim();

// Sidebar chips: lightweight columns for WorkerCardChip (achievement data + brands, no heavy text fields)
const WORKER_COLUMNS_SIDEBAR = `
  id, name, photo, gender, market, shift_verified, shifts_on_reflex, actively_looking, current_tier,
  brands_worked, invited_back_stores, unique_store_count, store_favorite_count,
  tardy_ratio, tardy_percent, urgent_cancel_ratio, urgent_cancel_percent,
  reflex_activity, experience_level
`.replace(/\s+/g, ' ').trim();

export interface WorkerRow {
  id: string;
  name: string;
  gender: 'male' | 'female' | null;
  market: string;
  actively_looking: boolean;
  about_me: string | null;
  previous_experience: { company: string; duration: string; roles: string[] }[];
  shift_verified: boolean;
  reflex_activity: {
    shiftsByTier: { luxury: number; elevated: number; mid: number };
    longestRelationship?: { brand: string; flexCount: number };
    tierProgression?: string;
    storeFavoriteCount?: number;
  } | null;
  shifts_on_reflex: number;
  brands_worked: { name: string; tier: 'luxury' | 'elevated' | 'mid' }[];
  retailer_quotes: { quote: string; brand: string; role: string }[] | null;
  retailer_summary: string | null;
  endorsement_counts: Record<string, number> | null;
  shift_experience: Record<string, number> | null;
  invited_back_stores: number;
  unique_store_count: number | null;
  // Reliability metrics
  commitment_score: string | null;
  tardy_ratio: string | null;
  tardy_percent: number | null;
  urgent_cancel_ratio: string | null;
  urgent_cancel_percent: number | null;
  // Tier and IDs
  current_tier: string | null;
  worker_uuid: string | null;
  worker_id: number | null;
  // Interview data
  interview_transcript: { question: string; answer: string }[] | Record<string, unknown> | null;
  photo: string | null;
  // Market favorite
  market_favorite: boolean;
  /** Retailer brands that favorited this worker (from source data). */
  favorited_by_brands: string[] | null;
  /** Number of stores that favorited this worker (plain column, not inside reflex_activity). */
  store_favorite_count: number | null;
  // Experience level for filtering
  experience_level: 'rising' | 'experienced' | 'seasoned' | 'proven_leader' | null;
}

export interface WorkerApplicationRow {
  id: string;
  worker_id: string;
  job_id: string;
  status: 'viewed' | 'liked' | 'applied' | 'not_interested';
  invited: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch all workers (card display - optimized columns)
export async function fetchWorkers(): Promise<WorkerRow[]> {
  const { data, error } = await supabase
    .from('workers')
    .select(WORKER_COLUMNS_CARD)
    .order('name');

  if (error) {
    console.error('Error fetching workers:', error);
    throw error;
  }
  return (data || []) as unknown as WorkerRow[];
}

// Fetch workers with pagination (for lazy loading - list columns only)
export async function fetchWorkersPaginated(offset: number, limit: number): Promise<{ workers: WorkerRow[]; hasMore: boolean }> {
  const { data, error, count } = await supabase
    .from('workers')
    .select(WORKER_COLUMNS_CARD, { count: 'exact' })
    .order('shift_verified', { ascending: false })
    .order('shifts_on_reflex', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching workers:', error);
    throw error;
  }
  return {
    workers: (data || []) as unknown as WorkerRow[],
    hasMore: count ? offset + limit < count : false,
  };
}

// Fetch a single worker by ID (full data for detail view)
export async function fetchWorkerById(id: string): Promise<WorkerRow | null> {
  const { data, error } = await supabase
    .from('workers')
    .select(WORKER_COLUMNS_FULL)
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching worker:', error);
    throw error;
  }
  return data as unknown as WorkerRow | null;
}

// Market aliases: worker market values that should map to app market names
// Key = app market name, Value = array of worker market values that should match
const MARKET_ALIASES: Record<string, string[]> = {
  'Washington': ['DC', 'Baltimore', 'Alexandria'],
  'Los Angeles': ['Camarillo'],
  'Denver': ['Castle Rock', 'Colorado Springs'],
  'Salt Lake City': ['Park City'],
  'Miami': ['Cape Coral', 'Fort Lauderdale', 'St. Petersburg'],
  'Raleigh-Durham': ['Raleigh'],
  'Detroit': ['Grand Rapids'],
  'Knoxville': ['Pigeon Forge'],
  'Pigeon Forge': ['Knoxville'],
  'Austin': ['San Marcos'],
  'Northern New Jersey': ['Newark'],
  // NYC rollup — selecting NYC also returns Long Island, NNJ, Newark workers
  'New York City': ['Long Island', 'Northern New Jersey', 'Newark'],
};

// Fetch workers by market (card display)
// Uses contains matching (%term%) on the full market name so multi-value fields work.
// MARKET_ALIASES lets a single market name pull in workers from adjacent markets.
export async function fetchWorkersByMarket(market: string): Promise<WorkerRow[]> {
  // Use full market name for contains matching — no truncation to avoid collisions
  // (e.g. "Long Island East" must not collapse to "Long Island" and match LI West too)
  const marketPatterns = [market];

  // Add any aliases for this market
  const aliases = MARKET_ALIASES[market];
  if (aliases) {
    marketPatterns.push(...aliases);
  }

  // Build OR query for all patterns — contains search so multi-value fields match
  const orFilters = marketPatterns.map(p => `market.ilike.%${p}%`).join(',');

  const { data, error } = await supabase
    .from('workers')
    .select(WORKER_COLUMNS_CARD)
    .or(orFilters)
    .order('shift_verified', { ascending: false })
    .order('shifts_on_reflex', { ascending: false });

  if (error) {
    console.error('Error fetching workers by market:', error);
    throw error;
  }
  return (data || []) as unknown as WorkerRow[];
}

// ============================================================
// WORKER APPLICATIONS API
// ============================================================

// Fetch applications for a job
export async function fetchApplicationsForJob(jobId: string): Promise<WorkerApplicationRow[]> {
  const { data, error } = await supabase
    .from('jobs_applications')
    .select('*')
    .eq('job_id', jobId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching applications:', error);
    throw error;
  }
  return data || [];
}

// Fetch applications by worker
export async function fetchApplicationsByWorker(workerId: string): Promise<WorkerApplicationRow[]> {
  const { data, error } = await supabase
    .from('jobs_applications')
    .select('*')
    .eq('worker_id', workerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching worker applications:', error);
    throw error;
  }
  return data || [];
}

// Create or update a worker application
export async function upsertWorkerApplication(
  workerId: string,
  jobId: string,
  status: 'viewed' | 'liked' | 'applied' | 'not_interested',
  invited: boolean = false
): Promise<WorkerApplicationRow> {
  const { data, error } = await supabase
    .from('jobs_applications')
    .upsert(
      { worker_id: workerId, job_id: jobId, status, invited },
      { onConflict: 'worker_id,job_id' }
    )
    .select()
    .single();

  if (error) {
    console.error('Error upserting worker application:', error);
    throw error;
  }
  return data;
}

// Invite a worker to a job
export async function inviteWorkerToJob(workerId: string, jobId: string): Promise<WorkerApplicationRow> {
  return upsertWorkerApplication(workerId, jobId, 'viewed', true);
}

// Convert database row to WorkerProfile format used by the app
import type { WorkerProfile, BrandTier } from '../types';

export function workerRowToProfile(row: WorkerRow): WorkerProfile {
  return {
    id: row.id,
    name: row.name,
    photo: row.photo || undefined,
    gender: row.gender || undefined,
    shiftVerified: row.shift_verified,
    shiftsOnReflex: row.shifts_on_reflex,
    brandsWorked: (row.brands_worked as { name: string; tier: BrandTier }[]) || [],
    market: row.market,
    endorsementCounts: row.endorsement_counts,
    invitedBackStores: row.invited_back_stores,
    aboutMe: row.about_me,
    previousExperience: (row.previous_experience as { company: string; duration: string; roles: string[] }[]) || [],
    reflexActivity: row.reflex_activity ? {
      shiftsByTier: row.reflex_activity.shiftsByTier,
      longestRelationship: row.reflex_activity.longestRelationship || null,
      tierProgression: (row.reflex_activity.tierProgression as 'upward' | 'stable') || 'stable',
    } : null,
    activelyLooking: row.actively_looking,
    retailerQuotes: row.retailer_quotes || undefined,
    retailerSummary: row.retailer_summary || undefined,
    // Reliability metrics
    commitmentScore: row.commitment_score,
    tardyRatio: row.tardy_ratio,
    tardyPercent: row.tardy_percent,
    urgentCancelRatio: row.urgent_cancel_ratio,
    urgentCancelPercent: row.urgent_cancel_percent,
    // Tier and IDs
    currentTier: row.current_tier,
    workerUuid: row.worker_uuid,
    workerId: row.worker_id,
    // Interview data
    interviewTranscript: row.interview_transcript,
    // Shift experience (separate from endorsements)
    shiftExperience: row.shift_experience,
    // Unique store count
    uniqueStoreCount: row.unique_store_count,
    storeFavoriteCount: row.store_favorite_count ?? null,
    marketFavorite: row.market_favorite,
    favoritedByBrands: row.favorited_by_brands ?? undefined,
    // Experience level for filtering
    experienceLevel: row.experience_level,
  };
}

// Fetch all workers as WorkerProfile objects
export async function fetchWorkersAsProfiles(): Promise<WorkerProfile[]> {
  const rows = await fetchWorkers();
  return rows.map(workerRowToProfile);
}

// Fetch workers by market as WorkerProfile objects (full card data)
export async function fetchWorkersByMarketAsProfiles(market: string): Promise<WorkerProfile[]> {
  const rows = await fetchWorkersByMarket(market);
  return rows.map(workerRowToProfile);
}

// Fetch workers by market using lightweight sidebar columns (faster)
export async function fetchWorkersByMarketForSidebar(market: string): Promise<WorkerProfile[]> {
  const marketPatterns = [market];
  const aliases = MARKET_ALIASES[market];
  if (aliases) marketPatterns.push(...aliases);

  const orFilters = marketPatterns.map(p => `market.ilike.%${p}%`).join(',');

  const { data, error } = await supabase
    .from('workers')
    .select(WORKER_COLUMNS_SIDEBAR)
    .or(orFilters)
    .order('shift_verified', { ascending: false })
    .order('shifts_on_reflex', { ascending: false });

  if (error) {
    console.error('Error fetching sidebar workers:', error);
    throw error;
  }
  return ((data || []) as unknown as WorkerRow[]).map(workerRowToProfile);
}

// ============================================================
// WORKER CONNECTIONS API
// ============================================================

export interface WorkerConnectionRow {
  id: string;
  worker_id: string;
  market: string;
  chat_id: string | null;
  status: 'liked' | 'invited' | 'accepted' | 'not_interested' | 'removed';
  invited: boolean;
  connected: boolean;
  chat_open: boolean;
  shift_booked: boolean;
  shift_scheduled: boolean;
  saved_for_later: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkerConnectionWithWorker extends WorkerConnectionRow {
  worker: WorkerRow | null;
}

// Fetch all worker connections with joined worker data
export async function fetchWorkerConnections(): Promise<WorkerConnectionWithWorker[]> {
  const { data: connections, error: connError } = await supabase
    .from('worker_connections')
    .select('*')
    .order('created_at', { ascending: false });

  if (connError) {
    console.error('Error fetching worker connections:', connError);
    throw connError;
  }

  if (!connections || connections.length === 0) {
    return [];
  }

  // Batch fetch workers for all connections
  const workerIds = [...new Set(connections.map(c => c.worker_id))];
  const { data: workers, error: workersError } = await supabase
    .from('workers')
    .select(WORKER_COLUMNS_CONNECTION)
    .in('id', workerIds);

  if (workersError) {
    console.error('Error fetching workers for connections:', workersError);
    throw workersError;
  }

  const workerMap = new Map((workers || []).map(w => [(w as any).id, w]));

  return connections.map(conn => ({
    ...conn,
    worker: (workerMap.get(conn.worker_id) as unknown as WorkerRow) || null,
  }));
}

// Update a worker connection status
export async function updateWorkerConnectionStatus(
  connectionId: string,
  updates: Partial<Pick<WorkerConnectionRow, 'status' | 'connected' | 'chat_open' | 'shift_booked' | 'shift_scheduled' | 'saved_for_later'>>
): Promise<WorkerConnectionRow> {
  const { data, error } = await supabase
    .from('worker_connections')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', connectionId)
    .select()
    .single();

  if (error) {
    console.error('Error updating worker connection:', error);
    throw error;
  }
  return data;
}

// Bulk-insert worker connections, skipping any worker_id that already exists
export async function bulkInsertWorkerConnections(
  rows: { worker_id: string; market: string; status: WorkerConnectionRow['status']; connected: boolean; saved_for_later: boolean; image_url?: string | null }[],
): Promise<number> {
  if (rows.length === 0) return 0;

  const now = new Date().toISOString();
  const payload = rows.map(r => ({
    worker_id: r.worker_id,
    market: r.market,
    status: r.status,
    invited: r.status === 'invited',
    connected: r.connected,
    chat_open: false,
    shift_booked: false,
    shift_scheduled: false,
    saved_for_later: r.saved_for_later,
    image_url: r.image_url ?? null,
    created_at: now,
    updated_at: now,
  }));

  const { data, error } = await supabase
    .from('worker_connections')
    .upsert(payload, { onConflict: 'worker_id' })
    .select('id');

  if (error) {
    console.error('Error bulk-inserting connections:', error);
    throw error;
  }

  return data?.length ?? 0;
}

// Delete a worker connection by worker_id
export async function deleteWorkerConnection(workerId: string): Promise<void> {
  const { error } = await supabase
    .from('worker_connections')
    .delete()
    .eq('worker_id', workerId);

  if (error) {
    console.error('Error deleting worker connection:', error);
    throw error;
  }
}
