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
  classification: 'Luxury' | 'Mid' | 'Big Box';
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
    .order('category')
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

export async function addRetailer(name: string, classification: 'Luxury' | 'Mid' | 'Big Box'): Promise<Retailer> {
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

export async function syncRetailers(retailers: { name: string; classification: 'Luxury' | 'Mid' | 'Big Box' }[]): Promise<void> {
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

  console.log(`Saved ${saved} jobs to Supabase, ${errors} errors, ${skipped} skipped (duplicates)`);
  return { saved, errors, skipped };
}
