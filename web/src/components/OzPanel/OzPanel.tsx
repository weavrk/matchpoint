import { useState, useEffect, useMemo, useRef } from 'react';
import { X, Search, Pencil, Plus, Loader2, ChevronLeft, ChevronRight, Info, Clipboard } from 'lucide-react';
import {
  fetchMarkets,
  fetchRoles,
  fetchRetailers,
  fetchRetailersLive,
  fetchJobPostings,
  syncMarkets,
  syncRoles,
  syncRetailers,
  saveScrapedJobs,
  addRole,
  addKeywordToRole,
  type Market,
  type Role,
  type Retailer,
  type RetailerLive,
  type JobPosting,
} from '../../services/supabase';
import { ScrapeModal, type ScrapeConfig } from '../ScrapeModal';
import { ScrapeProgressModal, type ScrapeProgressData } from '../ScrapeProgressModal';
import { UnmatchedRolesModal } from '../UnmatchedRolesModal';
import './styles.css';

// Local type for unmatched roles (matches UnmatchedRolesModal's expected shape)
interface UnmatchedRole {
  title: string;
  company: string;
  count: number;
  jobs?: any[];
}

// Local data fallbacks
const MARKETS = [
  { name: 'Austin', state: 'TX' },
  { name: 'Dallas', state: 'TX' },
  { name: 'Houston', state: 'TX' },
  { name: 'New York', state: 'NY' },
  { name: 'Los Angeles', state: 'CA' },
];

const ALL_ROLES = [
  'Sales Associate / Retail Associate',
  'Cashier',
  'Stock Associate / Stocker',
  'Store Manager',
];

const RETAILERS: { name: string; classification: 'Luxury' | 'Specialty' | 'Big Box' }[] = [
  { name: 'Ariat', classification: 'Specialty' },
  { name: 'Nordstrom', classification: 'Luxury' },
  { name: 'Target', classification: 'Big Box' },
];

interface OzPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OzPanel({ isOpen, onClose }: OzPanelProps) {
  // Data state
  const [ozMarkets, setOzMarkets] = useState<{ id?: string; name: string; state: string }[]>([]);
  const [ozRoles, setOzRoles] = useState<{ id?: string; title: string; category?: string; match_keywords?: string[] | null }[]>([]);
  const [ozRetailers, setOzRetailers] = useState<{ id?: string; name: string; classification: 'Luxury' | 'Specialty' | 'Big Box' }[]>([]);
  const [retailersLive, setRetailersLive] = useState<RetailerLive[]>([]);
  const [newMarketState, setNewMarketState] = useState('');

  // Loading and saving states
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Backup state for edit cancellation
  const [backupMarkets, setBackupMarkets] = useState<typeof ozMarkets | null>(null);
  const [backupRoles, setBackupRoles] = useState<typeof ozRoles | null>(null);
  const [backupRetailers, setBackupRetailers] = useState<typeof ozRetailers | null>(null);

  // Edit state
  const [editingSection, setEditingSection] = useState<'markets' | 'roles' | 'retailers' | null>(null);
  const [newItemInput, setNewItemInput] = useState('');
  const [newRetailerClass, setNewRetailerClass] = useState<'Luxury' | 'Specialty' | 'Big Box'>('Specialty');
  const [newRoleCategory, setNewRoleCategory] = useState<'Sales Floor' | 'Sales Support' | 'Back of House' | 'Specialized' | 'Management'>('Sales Floor');

  // Search state
  const [marketsSearch, setMarketsSearch] = useState('');
  const [marketsMatchIndex, setMarketsMatchIndex] = useState(0);
  const [rolesSearch, setRolesSearch] = useState('');
  const [rolesMatchIndex, setRolesMatchIndex] = useState(0);
  const [retailersSearch, setRetailersSearch] = useState('');
  const [retailersMatchIndex, setRetailersMatchIndex] = useState(0);

  // Job postings
  const [jobPostings, setJobPostings] = useState<JobPosting[]>([]);
  const [jpMarketFilter, setJpMarketFilter] = useState<string[]>([]);
  const [jpRoleFilter, setJpRoleFilter] = useState<string[]>([]);
  const [jpRetailerFilter, setJpRetailerFilter] = useState<string[]>([]);
  const [jpClassFilter, setJpClassFilter] = useState<string[]>([]);
  const [jobSortColumn, setJobSortColumn] = useState<'source' | 'market' | 'retailer' | 'role' | 'salary' | 'employment_type'>('market');
  const [jobSortDirection, setJobSortDirection] = useState<'asc' | 'desc'>('asc');

  const [showJobSitesInfo, setShowJobSitesInfo] = useState(false);
  const jobSitesInfoRef = useRef<HTMLDivElement>(null);

  // Scraping state
  const [showScrapeModal, setShowScrapeModal] = useState(false);
  const [showScrapeProgressModal, setShowScrapeProgressModal] = useState(false);
  const [scrapeProgress, setScrapeProgress] = useState<ScrapeProgressData | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [showUnmatchedModal, setShowUnmatchedModal] = useState(false);
  const [unmatchedRoles, setUnmatchedRoles] = useState<UnmatchedRole[]>([]);
  const scrapeAbortRef = useRef<AbortController | null>(null);

  // Load data on mount
  useEffect(() => {
    if (!isOpen) return;

    async function loadData() {
      setIsLoadingData(true);
      try {
        const [marketsData, rolesData, retailersData, retailersLiveData, jobPostingsData] = await Promise.all([
          fetchMarkets(),
          fetchRoles(),
          fetchRetailers(),
          fetchRetailersLive(),
          fetchJobPostings(),
        ]);

        setOzMarkets(marketsData.map((m: Market) => ({
          id: m.id,
          name: m.name,
          state: m.state,
        })));

        setOzRoles(rolesData.map((r: Role) => ({
          id: r.id,
          title: r.title,
          category: r.category,
          match_keywords: r.match_keywords,
        })));

        setOzRetailers(retailersData.map((r: Retailer) => ({
          id: r.id,
          name: r.name,
          classification: r.classification,
        })));

        setRetailersLive(retailersLiveData);
        setJobPostings(jobPostingsData);
      } catch (error) {
        console.error('Failed to load data from Supabase:', error);
        setOzMarkets(MARKETS.map(m => ({ name: m.name, state: m.state })));
        setOzRoles(ALL_ROLES.map(r => ({ title: r })));
        setOzRetailers(RETAILERS);
      }
      setIsLoadingData(false);
    }
    loadData();
  }, [isOpen]);

  // Group markets by state
  const ozMarketsByState = useMemo(() => {
    const grouped = ozMarkets.reduce((acc, market) => {
      if (!acc[market.state]) acc[market.state] = [];
      acc[market.state].push(market.name);
      return acc;
    }, {} as Record<string, string[]>);
    return grouped;
  }, [ozMarkets]);

  const ozSortedStates = useMemo(() => Object.keys(ozMarketsByState).sort(), [ozMarketsByState]);

  // Search matches
  const marketsMatches = useMemo(() => {
    if (!marketsSearch.trim()) return [];
    const search = marketsSearch.toLowerCase();
    return ozMarkets
      .map((m, idx) => ({ ...m, idx }))
      .filter(m => m.name.toLowerCase().includes(search) || m.state.toLowerCase().includes(search));
  }, [ozMarkets, marketsSearch]);

  const rolesMatches = useMemo(() => {
    if (!rolesSearch.trim()) return [];
    const search = rolesSearch.toLowerCase();
    return ozRoles
      .map((r, idx) => ({ ...r, idx }))
      .filter(r => r.title.toLowerCase().includes(search));
  }, [ozRoles, rolesSearch]);

  const retailersMatches = useMemo(() => {
    if (!retailersSearch.trim()) return [];
    const search = retailersSearch.toLowerCase();
    return ozRetailers
      .map((r, idx) => ({ ...r, idx }))
      .filter(r => r.name.toLowerCase().includes(search));
  }, [ozRetailers, retailersSearch]);

  // Reset match index on search change
  useEffect(() => { setMarketsMatchIndex(0); }, [marketsSearch]);
  useEffect(() => { setRolesMatchIndex(0); }, [rolesSearch]);
  useEffect(() => { setRetailersMatchIndex(0); }, [retailersSearch]);

  // Navigation helper
  const navigateMatch = (
    direction: 'prev' | 'next',
    matches: unknown[],
    currentIndex: number,
    setIndex: (n: number) => void
  ) => {
    if (matches.length === 0) return;
    if (direction === 'next') {
      setIndex((currentIndex + 1) % matches.length);
    } else {
      setIndex((currentIndex - 1 + matches.length) % matches.length);
    }
  };

  // Edit functions
  const startEditing = (section: 'markets' | 'roles' | 'retailers') => {
    if (section === 'markets') setBackupMarkets([...ozMarkets]);
    if (section === 'roles') setBackupRoles([...ozRoles]);
    if (section === 'retailers') setBackupRetailers([...ozRetailers]);
    setEditingSection(section);
    setNewItemInput('');
    setNewMarketState('');
  };

  const cancelEditing = () => {
    if (editingSection === 'markets' && backupMarkets) setOzMarkets(backupMarkets);
    if (editingSection === 'roles' && backupRoles) setOzRoles(backupRoles);
    if (editingSection === 'retailers' && backupRetailers) setOzRetailers(backupRetailers);
    setEditingSection(null);
    setNewItemInput('');
    setNewMarketState('');
    setSaveError(null);
  };

  // Save functions
  const saveMarkets = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await syncMarkets(ozMarkets.map(m => ({ name: m.name, state: m.state })));
      setEditingSection(null);
      setBackupMarkets(null);
    } catch (error) {
      console.error('Failed to save markets:', error);
      setSaveError('Failed to save markets. Please try again.');
    }
    setIsSaving(false);
  };

  const saveRoles = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await syncRoles(ozRoles.map(r => ({ title: r.title, category: r.category })));
      setEditingSection(null);
      setBackupRoles(null);
    } catch (error) {
      console.error('Failed to save roles:', error);
      setSaveError('Failed to save roles. Please try again.');
    }
    setIsSaving(false);
  };

  const saveRetailers = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await syncRetailers(ozRetailers.map(r => ({ name: r.name, classification: r.classification })));
      setEditingSection(null);
      setBackupRetailers(null);
    } catch (error) {
      console.error('Failed to save retailers:', error);
      setSaveError('Failed to save retailers. Please try again.');
    }
    setIsSaving(false);
  };

  // Reload job postings
  const loadJobPostings = async () => {
    try {
      const data = await fetchJobPostings();
      setJobPostings(data);
    } catch (error) {
      console.error('Failed to load job postings:', error);
    }
  };

  // Scraping handlers
  const handleRunScrape = async (config: ScrapeConfig) => {
    setShowScrapeModal(false);
    setShowScrapeProgressModal(true);
    setIsScraping(true);
    scrapeAbortRef.current = new AbortController();

    // Get full market/retailer objects from IDs
    const selectedMarkets = ozMarkets.filter(m => m.id && config.markets.includes(m.id));
    const selectedRetailers = ozRetailers.filter(r => r.id && config.retailers.includes(r.id));

    const allScrapedJobs: any[] = [];
    let completedMarkets = 0;

    setScrapeProgress({
      phase: 'scraping',
      currentMarket: '',
      currentRole: '',
      currentPage: 0,
      totalPages: 0,
      marketsCompleted: 0,
      totalMarkets: selectedMarkets.length,
      rolesCompleted: 0,
      totalRoles: 0,
      jobsFound: 0,
      jobsMatched: 0,
      elapsedSeconds: 0,
    });

    for (const market of selectedMarkets) {
      if (scrapeAbortRef.current?.signal.aborted) break;

      for (const retailer of selectedRetailers) {
        if (scrapeAbortRef.current?.signal.aborted) break;

        setScrapeProgress(prev => prev ? {
          ...prev,
          currentMarket: market.name,
          currentRole: retailer.name, // Using currentRole to show retailer being scraped
        } : null);

        try {
          const response = await fetch('/api/scrape', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              market: `${market.name.toLowerCase().replace(/\s+/g, '-')}-${market.state.toLowerCase()}`,
              retailer: retailer.name,
              maxPages: 3,
            }),
            signal: scrapeAbortRef.current?.signal,
          });

          if (response.ok) {
            const data = await response.json();
            if (data.jobs) {
              allScrapedJobs.push(...data.jobs.map((j: any) => ({
                ...j,
                market_id: market.id,
                market_name: market.name,
              })));
            }
          }
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            console.error(`Scrape error for ${market.name} - ${retailer.name}:`, error);
          }
        }

        setScrapeProgress(prev => prev ? {
          ...prev,
          jobsFound: allScrapedJobs.length,
        } : null);
      }

      completedMarkets++;
      setScrapeProgress(prev => prev ? {
        ...prev,
        marketsCompleted: completedMarkets,
      } : null);
    }

    // Process results - find unmatched roles
    if (allScrapedJobs.length > 0) {
      const roleMatches = new Map<string, { matched: boolean; roleId?: string; jobs: any[] }>();

      for (const job of allScrapedJobs) {
        const jobTitle = job.title?.toLowerCase() || '';
        let matched = false;

        for (const role of ozRoles) {
          const titleMatch = role.title.toLowerCase().split('/').some(t =>
            jobTitle.includes(t.trim()) || t.trim().includes(jobTitle)
          );
          const keywordMatch = role.match_keywords?.some(k =>
            jobTitle.includes(k.toLowerCase())
          );

          if (titleMatch || keywordMatch) {
            matched = true;
            job.role_id = role.id;
            break;
          }
        }

        if (!matched) {
          const key = job.title || 'Unknown';
          if (!roleMatches.has(key)) {
            roleMatches.set(key, { matched: false, jobs: [] });
          }
          roleMatches.get(key)!.jobs.push(job);
        }
      }

      const unmatched = Array.from(roleMatches.entries())
        .filter(([, v]) => !v.matched)
        .map(([title, v]) => ({
          title,
          count: v.jobs.length,
          jobs: v.jobs,
          company: v.jobs[0]?.company || 'Unknown'
        }));

      if (unmatched.length > 0) {
        setUnmatchedRoles(unmatched);
        setShowUnmatchedModal(true);
      }

      // Save matched jobs
      const matchedJobs = allScrapedJobs.filter(j => j.role_id);
      if (matchedJobs.length > 0) {
        const retailersWithIds = ozRetailers.filter((r): r is Retailer => !!r.id);
        await saveScrapedJobs(matchedJobs, retailersWithIds);
        await loadJobPostings();
      }
    }

    setScrapeProgress(prev => prev ? { ...prev, phase: 'complete' } : null);
    setIsScraping(false);
  };

  const handleCancelScrape = () => {
    scrapeAbortRef.current?.abort();
    setScrapeProgress(null);
    setShowScrapeProgressModal(false);
    setIsScraping(false);
  };

  // Job sorting
  const handleJobSort = (column: typeof jobSortColumn) => {
    if (jobSortColumn === column) {
      setJobSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setJobSortColumn(column);
      setJobSortDirection('asc');
    }
  };

  // Filtered job postings
  const filteredJobPostings = useMemo(() => {
    let filtered = [...jobPostings];

    if (jpMarketFilter.length > 0) {
      filtered = filtered.filter(j => jpMarketFilter.includes(j.market_name || ''));
    }
    if (jpRoleFilter.length > 0) {
      filtered = filtered.filter(j => {
        const role = ozRoles.find(r => r.id === j.role_id);
        return role && jpRoleFilter.includes(role.title);
      });
    }
    if (jpRetailerFilter.length > 0) {
      filtered = filtered.filter(j => jpRetailerFilter.includes(j.company || ''));
    }
    if (jpClassFilter.length > 0) {
      filtered = filtered.filter(j => {
        const retailer = ozRetailers.find(r => r.name === j.company);
        return retailer && jpClassFilter.includes(retailer.classification);
      });
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = '', bVal = '';
      switch (jobSortColumn) {
        case 'source': aVal = a.source || ''; bVal = b.source || ''; break;
        case 'market': aVal = a.market_name || ''; bVal = b.market_name || ''; break;
        case 'retailer': aVal = a.company || ''; bVal = b.company || ''; break;
        case 'role':
          const aRole = ozRoles.find(r => r.id === a.role_id);
          const bRole = ozRoles.find(r => r.id === b.role_id);
          aVal = aRole?.title || ''; bVal = bRole?.title || '';
          break;
        case 'salary': aVal = a.salary || ''; bVal = b.salary || ''; break;
        case 'employment_type': aVal = a.employment_type || ''; bVal = b.employment_type || ''; break;
      }
      const cmp = aVal.localeCompare(bVal);
      return jobSortDirection === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }, [jobPostings, jpMarketFilter, jpRoleFilter, jpRetailerFilter, jpClassFilter, jobSortColumn, jobSortDirection, ozRoles, ozRetailers]);

  // Unique values for filters
  const uniqueMarkets = useMemo(() => [...new Set(jobPostings.map(j => j.market_name).filter((m): m is string => Boolean(m)))].sort(), [jobPostings]);
  const uniqueRetailers = useMemo(() => [...new Set(jobPostings.map(j => j.company).filter((c): c is string => Boolean(c)))].sort(), [jobPostings]);
  const uniqueClasses = ['Luxury', 'Specialty', 'Big Box'];

  // Close job sites info on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (jobSitesInfoRef.current && !jobSitesInfoRef.current.contains(event.target as Node)) {
        setShowJobSitesInfo(false);
      }
    }
    if (showJobSitesInfo) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showJobSitesInfo]);

  if (!isOpen) return null;

  return (
    <div className="oz-panel-overlay" onClick={onClose}>
      <div className="oz-panel" onClick={(e) => e.stopPropagation()}>
        <div className="oz-panel-header">
          <h1>Oz</h1>
          <button className="oz-panel-close" onClick={onClose}>
            <X size={28} />
          </button>
        </div>

        <div className="oz-panel-content">
          {isLoadingData ? (
            <div className="oz-loading">
              <Loader2 size={32} className="oz-spinner" />
              <p>Loading data from Supabase...</p>
            </div>
          ) : (
            <>
              {/* Markets Section */}
              <section className="oz-section oz-section-markets">
                <div className={`oz-section-header${editingSection === 'markets' ? ' oz-section-header--editing' : ''}`}>
                  <h2 className="section-title">Markets ({ozMarkets.length}) <span className="section-title-sub">Live Only</span></h2>
                  <div className="oz-section-actions">
                    <div className="oz-search-control">
                      <Search size={18} className="oz-search-icon" />
                      <input
                        type="text"
                        className="oz-search-input"
                        placeholder="Search..."
                        value={marketsSearch}
                        onChange={(e) => setMarketsSearch(e.target.value)}
                      />
                      {marketsSearch && (
                        <>
                          <button className="oz-search-clear" onClick={() => setMarketsSearch('')}>
                            <X size={18} />
                          </button>
                          <div className="oz-search-nav">
                            <button
                              className="oz-search-nav-btn"
                              onClick={() => navigateMatch('prev', marketsMatches, marketsMatchIndex, setMarketsMatchIndex)}
                              disabled={marketsMatches.length === 0}
                            >
                              <ChevronLeft size={14} />
                            </button>
                            <span className="oz-search-count">
                              {marketsMatches.length > 0 ? `${marketsMatchIndex + 1}/${marketsMatches.length}` : '0'}
                            </span>
                            <button
                              className="oz-search-nav-btn"
                              onClick={() => navigateMatch('next', marketsMatches, marketsMatchIndex, setMarketsMatchIndex)}
                              disabled={marketsMatches.length === 0}
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    {editingSection === 'markets' ? (
                      <>
                        <span className="oz-section-divider" />
                        <input
                          type="text"
                          className="oz-header-input oz-city-input"
                          placeholder="City"
                          value={newItemInput}
                          onChange={(e) => setNewItemInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newItemInput.trim() && newMarketState.trim()) {
                              setOzMarkets([...ozMarkets, { name: newItemInput.trim(), state: newMarketState.trim().toUpperCase() }]);
                              setNewItemInput('');
                              setNewMarketState('');
                            }
                          }}
                        />
                        <input
                          type="text"
                          className="oz-header-input oz-state-input"
                          placeholder="State"
                          value={newMarketState}
                          onChange={(e) => setNewMarketState(e.target.value)}
                          maxLength={4}
                        />
                        <button
                          className="oz-header-add-btn"
                          onClick={() => {
                            if (newItemInput.trim() && newMarketState.trim()) {
                              setOzMarkets([...ozMarkets, { name: newItemInput.trim(), state: newMarketState.trim().toUpperCase() }]);
                              setNewItemInput('');
                              setNewMarketState('');
                            }
                          }}
                        >
                          <Plus size={14} />
                          Add
                        </button>
                        <button className="oz-save-btn" onClick={saveMarkets} disabled={isSaving}>
                          {isSaving ? <Loader2 size={14} className="oz-spinner" /> : null}
                          {isSaving ? 'Saving...' : 'Save to Database'}
                        </button>
                        <button className="oz-cancel-btn" onClick={cancelEditing} disabled={isSaving}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button className="oz-edit-btn" onClick={() => startEditing('markets')}>
                        <Pencil size={16} />
                        Edit
                      </button>
                    )}
                  </div>
                </div>
                {saveError && editingSection === 'markets' && (
                  <p className="oz-save-error">{saveError}</p>
                )}
                <p className="oz-header-footnotes">
                  *Need to determine how to handle regions like Central New Jersey<br />
                  *Need to determine how to handle not live markets
                </p>
                <div className="oz-section-body">
                  <div className="oz-markets-by-state">
                    {ozSortedStates.map(state => (
                      <div key={state} className="oz-state-group">
                        <h3 className="oz-state-header">{state}</h3>
                        <div className="oz-state-cities">
                          {ozMarketsByState[state].map((city, idx) => {
                            const marketIdx = ozMarkets.findIndex(m => m.name === city && m.state === state);
                            const matchIdx = marketsMatches.findIndex(m => m.idx === marketIdx);
                            const isMatch = matchIdx !== -1;
                            const isCurrentMatch = isMatch && matchIdx === marketsMatchIndex;
                            return editingSection === 'markets' ? (
                              <span key={idx} className="oz-chip oz-chip-inline">
                                {city}
                                <button
                                  className="oz-chip-remove"
                                  onClick={() => setOzMarkets(ozMarkets.filter((_, i) => i !== marketIdx))}
                                >
                                  <X size={14} />
                                </button>
                              </span>
                            ) : (
                              <span
                                key={idx}
                                className={`oz-city-item${isMatch ? ' oz-search-match' : ''}${isCurrentMatch ? ' oz-search-current' : ''}`}
                              >
                                {city}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Roles Section */}
              <section className="oz-section">
                <div className={`oz-section-header${editingSection === 'roles' ? ' oz-section-header--editing' : ''}`}>
                  <h2 className="section-title">Roles ({ozRoles.length})</h2>
                  <div className="oz-section-actions">
                    <div className="oz-search-control">
                      <Search size={18} className="oz-search-icon" />
                      <input
                        type="text"
                        className="oz-search-input"
                        placeholder="Search..."
                        value={rolesSearch}
                        onChange={(e) => setRolesSearch(e.target.value)}
                      />
                      {rolesSearch && (
                        <>
                          <button className="oz-search-clear" onClick={() => setRolesSearch('')}>
                            <X size={18} />
                          </button>
                          <div className="oz-search-nav">
                            <button
                              className="oz-search-nav-btn"
                              onClick={() => navigateMatch('prev', rolesMatches, rolesMatchIndex, setRolesMatchIndex)}
                              disabled={rolesMatches.length === 0}
                            >
                              <ChevronLeft size={14} />
                            </button>
                            <span className="oz-search-count">
                              {rolesMatches.length > 0 ? `${rolesMatchIndex + 1}/${rolesMatches.length}` : '0'}
                            </span>
                            <button
                              className="oz-search-nav-btn"
                              onClick={() => navigateMatch('next', rolesMatches, rolesMatchIndex, setRolesMatchIndex)}
                              disabled={rolesMatches.length === 0}
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    {editingSection === 'roles' ? (
                      <>
                        <span className="oz-section-divider" />
                        <input
                          type="text"
                          className="oz-header-input"
                          placeholder="Role title"
                          value={newItemInput}
                          onChange={(e) => setNewItemInput(e.target.value)}
                        />
                        <select
                          className="oz-header-select"
                          value={newRoleCategory}
                          onChange={(e) => setNewRoleCategory(e.target.value as typeof newRoleCategory)}
                        >
                          <option value="Sales Floor">Sales Floor</option>
                          <option value="Sales Support">Sales Support</option>
                          <option value="Back of House">Back of House</option>
                          <option value="Specialized">Specialized</option>
                          <option value="Management">Management</option>
                        </select>
                        <button
                          className="oz-header-add-btn"
                          onClick={() => {
                            if (newItemInput.trim()) {
                              setOzRoles([...ozRoles, { title: newItemInput.trim(), category: newRoleCategory }]);
                              setNewItemInput('');
                            }
                          }}
                        >
                          <Plus size={14} />
                          Add
                        </button>
                        <button className="oz-save-btn" onClick={saveRoles} disabled={isSaving}>
                          {isSaving ? <Loader2 size={14} className="oz-spinner" /> : null}
                          {isSaving ? 'Saving...' : 'Save to Database'}
                        </button>
                        <button className="oz-cancel-btn" onClick={cancelEditing} disabled={isSaving}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button className="oz-edit-btn" onClick={() => startEditing('roles')}>
                        <Pencil size={16} />
                        Edit
                      </button>
                    )}
                  </div>
                </div>
                {saveError && editingSection === 'roles' && (
                  <p className="oz-save-error">{saveError}</p>
                )}
                <div className="oz-section-body">
                  <div className="oz-chips-display">
                    {ozRoles.map((role, idx) => {
                      const matchIdx = rolesMatches.findIndex(r => r.idx === idx);
                      const isMatch = matchIdx !== -1;
                      const isCurrentMatch = isMatch && matchIdx === rolesMatchIndex;
                      return editingSection === 'roles' ? (
                        <span key={idx} className="oz-chip">
                          {role.title}
                          <button
                            className="oz-chip-remove"
                            onClick={() => setOzRoles(ozRoles.filter((_, i) => i !== idx))}
                          >
                            <X size={14} />
                          </button>
                        </span>
                      ) : (
                        <span
                          key={idx}
                          className={`oz-chip oz-chip-readonly${isMatch ? ' oz-search-match' : ''}${isCurrentMatch ? ' oz-search-current' : ''}`}
                        >
                          {role.title}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </section>

              {/* Retailers Section */}
              <section className="oz-section">
                <div className={`oz-section-header${editingSection === 'retailers' ? ' oz-section-header--editing' : ''}`}>
                  <h2 className="section-title">Retailers ({ozRetailers.length})</h2>
                  <div className="oz-section-actions">
                    <div className="oz-search-control">
                      <Search size={18} className="oz-search-icon" />
                      <input
                        type="text"
                        className="oz-search-input"
                        placeholder="Search..."
                        value={retailersSearch}
                        onChange={(e) => setRetailersSearch(e.target.value)}
                      />
                      {retailersSearch && (
                        <>
                          <button className="oz-search-clear" onClick={() => setRetailersSearch('')}>
                            <X size={18} />
                          </button>
                          <div className="oz-search-nav">
                            <button
                              className="oz-search-nav-btn"
                              onClick={() => navigateMatch('prev', retailersMatches, retailersMatchIndex, setRetailersMatchIndex)}
                              disabled={retailersMatches.length === 0}
                            >
                              <ChevronLeft size={14} />
                            </button>
                            <span className="oz-search-count">
                              {retailersMatches.length > 0 ? `${retailersMatchIndex + 1}/${retailersMatches.length}` : '0'}
                            </span>
                            <button
                              className="oz-search-nav-btn"
                              onClick={() => navigateMatch('next', retailersMatches, retailersMatchIndex, setRetailersMatchIndex)}
                              disabled={retailersMatches.length === 0}
                            >
                              <ChevronRight size={14} />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                    {editingSection === 'retailers' ? (
                      <>
                        <span className="oz-section-divider" />
                        <input
                          type="text"
                          className="oz-header-input"
                          placeholder="Retailer name"
                          value={newItemInput}
                          onChange={(e) => setNewItemInput(e.target.value)}
                        />
                        <select
                          className="oz-header-select"
                          value={newRetailerClass}
                          onChange={(e) => setNewRetailerClass(e.target.value as typeof newRetailerClass)}
                        >
                          <option value="Luxury">Luxury</option>
                          <option value="Specialty">Specialty</option>
                          <option value="Big Box">Big Box</option>
                        </select>
                        <button
                          className="oz-header-add-btn"
                          onClick={() => {
                            if (newItemInput.trim()) {
                              setOzRetailers([...ozRetailers, { name: newItemInput.trim(), classification: newRetailerClass }]);
                              setNewItemInput('');
                            }
                          }}
                        >
                          <Plus size={14} />
                          Add
                        </button>
                        <button className="oz-save-btn" onClick={saveRetailers} disabled={isSaving}>
                          {isSaving ? <Loader2 size={14} className="oz-spinner" /> : null}
                          {isSaving ? 'Saving...' : 'Save to Database'}
                        </button>
                        <button className="oz-cancel-btn" onClick={cancelEditing} disabled={isSaving}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button className="oz-edit-btn" onClick={() => startEditing('retailers')}>
                        <Pencil size={16} />
                        Edit
                      </button>
                    )}
                  </div>
                </div>
                {saveError && editingSection === 'retailers' && (
                  <p className="oz-save-error">{saveError}</p>
                )}
                <div className="oz-section-body">
                  <div className="oz-retailers-grid">
                    {['Luxury', 'Specialty', 'Big Box'].map(classification => (
                      <div key={classification} className="oz-retailer-group">
                        <h3 className="oz-retailer-class-header">{classification}</h3>
                        <div className="oz-retailer-list">
                          {ozRetailers
                            .filter(r => r.classification === classification)
                            .map((retailer, idx) => {
                              const globalIdx = ozRetailers.findIndex(r => r.name === retailer.name);
                              const matchIdx = retailersMatches.findIndex(r => r.idx === globalIdx);
                              const isMatch = matchIdx !== -1;
                              const isCurrentMatch = isMatch && matchIdx === retailersMatchIndex;
                              return editingSection === 'retailers' ? (
                                <span key={idx} className="oz-chip oz-chip-inline">
                                  {retailer.name}
                                  <button
                                    className="oz-chip-remove"
                                    onClick={() => setOzRetailers(ozRetailers.filter((_, i) => i !== globalIdx))}
                                  >
                                    <X size={14} />
                                  </button>
                                </span>
                              ) : (
                                <span
                                  key={idx}
                                  className={`oz-retailer-item${isMatch ? ' oz-search-match' : ''}${isCurrentMatch ? ' oz-search-current' : ''}`}
                                >
                                  {retailer.name}
                                </span>
                              );
                            })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Retailers Live Section */}
              <section className="oz-section">
                <div className="oz-section-header">
                  <h2 className="section-title">Retailers Live ({retailersLive.length})</h2>
                </div>
                <div className="oz-section-body">
                  <div className="oz-tag-grid">
                    {retailersLive.map(r => (
                      <span key={r.id} className="oz-tag">{r.name}</span>
                    ))}
                  </div>
                  {retailersLive.length === 0 && (
                    <p className="oz-no-data">No retailers live data found.</p>
                  )}
                </div>
              </section>

              {/* Job Postings Section */}
              <section className="oz-section oz-section-jobs">
                <div className="oz-section-header">
                  <h2 className="section-title">
                    Job Postings ({filteredJobPostings.length})
                    <div className="oz-job-sites-info-wrapper" ref={jobSitesInfoRef}>
                      <button
                        className="oz-job-sites-info-btn"
                        onClick={() => setShowJobSitesInfo(!showJobSitesInfo)}
                      >
                        <Info size={16} />
                      </button>
                      {showJobSitesInfo && (
                        <div className="oz-job-sites-info-bubble">
                          <p><strong>Indeed:</strong> Working via ScraperAPI proxy</p>
                          <p><strong>Glassdoor:</strong> Blocked by Cloudflare</p>
                          <p><strong>LinkedIn:</strong> Not implemented</p>
                        </div>
                      )}
                    </div>
                  </h2>
                  <div className="oz-section-actions">
                    <button
                      className="oz-scrape-btn"
                      onClick={() => setShowScrapeModal(true)}
                      disabled={isScraping}
                    >
                      {isScraping ? 'Scraping...' : 'Run Scraper'}
                    </button>
                  </div>
                </div>
                <div className="oz-section-body">
                  {/* Filters */}
                  <div className="oz-job-filters">
                    <div className="oz-filter-group">
                      <label>Market</label>
                      <select
                        value={jpMarketFilter[0] || ''}
                        onChange={(e) => setJpMarketFilter(e.target.value ? [e.target.value] : [])}
                      >
                        <option value="">All Markets</option>
                        {uniqueMarkets.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div className="oz-filter-group">
                      <label>Role</label>
                      <select
                        value={jpRoleFilter[0] || ''}
                        onChange={(e) => setJpRoleFilter(e.target.value ? [e.target.value] : [])}
                      >
                        <option value="">All Roles</option>
                        {ozRoles.map(r => (
                          <option key={r.title} value={r.title}>{r.title}</option>
                        ))}
                      </select>
                    </div>
                    <div className="oz-filter-group">
                      <label>Retailer</label>
                      <select
                        value={jpRetailerFilter[0] || ''}
                        onChange={(e) => setJpRetailerFilter(e.target.value ? [e.target.value] : [])}
                      >
                        <option value="">All Retailers</option>
                        {uniqueRetailers.map(r => (
                          <option key={r} value={r}>{r}</option>
                        ))}
                      </select>
                    </div>
                    <div className="oz-filter-group">
                      <label>Classification</label>
                      <select
                        value={jpClassFilter[0] || ''}
                        onChange={(e) => setJpClassFilter(e.target.value ? [e.target.value] : [])}
                      >
                        <option value="">All Classifications</option>
                        {uniqueClasses.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    {(jpMarketFilter.length > 0 || jpRoleFilter.length > 0 || jpRetailerFilter.length > 0 || jpClassFilter.length > 0) && (
                      <button
                        className="oz-clear-filters"
                        onClick={() => {
                          setJpMarketFilter([]);
                          setJpRoleFilter([]);
                          setJpRetailerFilter([]);
                          setJpClassFilter([]);
                        }}
                      >
                        Clear filters
                      </button>
                    )}
                  </div>

                  {/* Table */}
                  {filteredJobPostings.length === 0 ? (
                    <p className="oz-no-jobs">No job postings found. Run the scraper to fetch jobs.</p>
                  ) : (
                    <div className="oz-jobs-table-wrapper">
                      <table className="oz-jobs-table">
                        <thead>
                          <tr>
                            <th className="oz-sortable-header" onClick={() => handleJobSort('source')}>
                              Source {jobSortColumn === 'source' && (jobSortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="oz-sortable-header" onClick={() => handleJobSort('market')}>
                              Market {jobSortColumn === 'market' && (jobSortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="oz-sortable-header" onClick={() => handleJobSort('retailer')}>
                              Retailer {jobSortColumn === 'retailer' && (jobSortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="oz-sortable-header" onClick={() => handleJobSort('role')}>
                              Role {jobSortColumn === 'role' && (jobSortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="oz-sortable-header" onClick={() => handleJobSort('salary')}>
                              Salary {jobSortColumn === 'salary' && (jobSortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                            <th className="oz-sortable-header" onClick={() => handleJobSort('employment_type')}>
                              Type {jobSortColumn === 'employment_type' && (jobSortDirection === 'asc' ? '↑' : '↓')}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredJobPostings.map(job => {
                            const role = ozRoles.find(r => r.id === job.role_id);
                            return (
                              <tr key={job.id}>
                                <td className="oz-job-source">
                                  {job.source || '—'}
                                  {job.source_url && (
                                    <button
                                      className="oz-job-source-link"
                                      onClick={() => navigator.clipboard.writeText(job.source_url!)}
                                      title="Copy URL"
                                    >
                                      <Clipboard size={14} />
                                    </button>
                                  )}
                                </td>
                                <td>{job.market_name || '—'}</td>
                                <td>{job.company || '—'}</td>
                                <td>{role?.title || '—'}</td>
                                <td>{job.salary || '—'}</td>
                                <td>{job.employment_type || '—'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </section>
            </>
          )}
        </div>
      </div>

      {/* Scrape Modal */}
      <ScrapeModal
        isOpen={showScrapeModal}
        onClose={() => setShowScrapeModal(false)}
        markets={ozMarkets.filter((m): m is Market => !!m.id)}
        roles={ozRoles.filter((r): r is Role => !!r.id)}
        retailers={ozRetailers.filter((r): r is Retailer => !!r.id)}
        onRunScrape={handleRunScrape}
      />

      {/* Scrape Progress Modal */}
      <ScrapeProgressModal
        isOpen={showScrapeProgressModal}
        onClose={() => setShowScrapeProgressModal(false)}
        onCancel={handleCancelScrape}
        progress={scrapeProgress}
      />

      {/* Unmatched Roles Modal */}
      <UnmatchedRolesModal
        isOpen={showUnmatchedModal}
        onClose={() => {
          setShowUnmatchedModal(false);
          setUnmatchedRoles([]);
        }}
        unmatchedRoles={unmatchedRoles}
        existingRoles={ozRoles.filter((r): r is { id: string; title: string; category: string } =>
          !!r.id && !!r.category
        )}
        onAddRoles={async (newRoles, originalTitles) => {
          for (let i = 0; i < newRoles.length; i++) {
            const role = newRoles[i];
            const originalTitle = originalTitles?.[i] || role.title;
            try {
              const savedRole = await addRole(role.title, role.category);
              setOzRoles(prev => [...prev, savedRole]);

              const unmatchedEntry = unmatchedRoles.find(
                ur => ur.title.toLowerCase() === originalTitle.toLowerCase()
              );
              if (unmatchedEntry && unmatchedEntry.jobs && unmatchedEntry.jobs.length > 0) {
                const jobs = unmatchedEntry.jobs;
                const jobsToSave = jobs.map((job: any) => ({
                  ...job,
                  role: savedRole.title,
                  roleId: savedRole.id,
                }));
                const retailersWithIds = ozRetailers.filter((r): r is Retailer => !!r.id);
                await saveScrapedJobs(jobsToSave, retailersWithIds);
                await loadJobPostings();
              }
            } catch (err) {
              console.error('Failed to add role:', role.title, err);
            }
          }
        }}
        onMapRoles={async (mappings) => {
          for (const mapping of mappings) {
            try {
              await addKeywordToRole(mapping.existingRoleId, mapping.unmatchedTitle);
              const existingRole = ozRoles.find(r => r.id === mapping.existingRoleId);
              if (existingRole) {
                const unmatchedEntry = unmatchedRoles.find(
                  ur => ur.title.toLowerCase() === mapping.unmatchedTitle.toLowerCase()
                );
                if (unmatchedEntry && unmatchedEntry.jobs && unmatchedEntry.jobs.length > 0) {
                  const jobs = unmatchedEntry.jobs;
                  const jobsToSave = jobs.map((job: any) => ({
                    ...job,
                    role: existingRole.title,
                    roleId: existingRole.id,
                  }));
                  const retailersWithIds = ozRetailers.filter((r): r is Retailer => !!r.id);
                  await saveScrapedJobs(jobsToSave, retailersWithIds);
                  await loadJobPostings();
                }
              }
              const updatedRoles = await fetchRoles();
              setOzRoles(updatedRoles);
            } catch (err) {
              console.error('Failed to add keyword:', mapping.unmatchedTitle, err);
            }
          }
        }}
        onIgnoreRoles={(titles) => {
          console.log('Ignored roles:', titles);
        }}
      />
    </div>
  );
}

export default OzPanel;
