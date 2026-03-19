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
  title: string;
  retailer_id: string;
  market_id: string;
  role_id: string;
  source: string;
  source_url: string | null;
  salary_min: number | null;
  salary_max: number | null;
  employment_type: string | null;
  posted_date: string | null;
  scraped_at: string;
  created_at: string;
  updated_at: string;
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

export async function addRole(title: string, category: string = 'Other', description: string | null = null): Promise<Role> {
  const { data, error } = await supabase
    .from('roles')
    .insert({ title, category, description })
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
