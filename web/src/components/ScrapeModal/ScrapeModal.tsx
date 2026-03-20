import { useState, useRef, useEffect } from 'react';
import { X, Search, Check, ChevronDown, Loader2 } from 'lucide-react';
import './ScrapeModal.css';

export interface ScrapeProgress {
  phase: 'initializing' | 'launching' | 'navigating' | 'scraping' | 'filtering' | 'complete';
  currentMarket: string;
  currentRole: string;
  currentPage: number;
  totalPages: number;
  marketsCompleted: number;
  totalMarkets: number;
  rolesCompleted: number;
  totalRoles: number;
  jobsFound: number;
  jobsMatched: number;
  elapsedSeconds: number;
}

// Simplified types for the modal - only the fields we need
interface SimpleMarket {
  id: string;
  name: string;
  state: string;
}

interface SimpleRole {
  id: string;
  title: string;
}

interface SimpleRetailer {
  id: string;
  name: string;
  classification: 'Luxury' | 'Mid' | 'Big Box';
}

interface ScrapeModalProps {
  isOpen: boolean;
  onClose: () => void;
  markets: SimpleMarket[];
  roles: SimpleRole[];
  retailers: SimpleRetailer[];
  onRunScrape: (config: ScrapeConfig) => void;
  isScraping?: boolean;
  scrapeProgress?: ScrapeProgress | null;
  onCancelScrape?: () => void;
}

export interface ScrapeConfig {
  jobSite: string;
  markets: string[];
  roles: string[];
  retailers: string[];
  retailerClassifications: ('Luxury' | 'Mid' | 'Big Box')[];
}

const JOB_SITES = ['Indeed + Glassdoor'];

// Helper to format seconds as M:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ScrapeModal({ isOpen, onClose, markets, roles, retailers, onRunScrape, isScraping = false, scrapeProgress = null, onCancelScrape }: ScrapeModalProps) {
  // Selected values
  const [selectedJobSite, setSelectedJobSite] = useState<string>('');
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedRetailers, setSelectedRetailers] = useState<string[]>([]);
  const [selectedClassifications, setSelectedClassifications] = useState<('Luxury' | 'Mid' | 'Big Box')[]>([]);

  // Search values
  const [marketSearch, setMarketSearch] = useState('');
  const [retailerSearch, setRetailerSearch] = useState('');

  // Dropdown open state
  const [marketsDropdownOpen, setMarketsDropdownOpen] = useState(false);
  const [retailersDropdownOpen, setRetailersDropdownOpen] = useState(false);

  // Refs for click outside
  const marketsRef = useRef<HTMLDivElement>(null);
  const retailersRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (marketsRef.current && !marketsRef.current.contains(event.target as Node)) {
        setMarketsDropdownOpen(false);
      }
      if (retailersRef.current && !retailersRef.current.contains(event.target as Node)) {
        setRetailersDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset state when modal opens - with defaults
  useEffect(() => {
    if (isOpen) {
      setSelectedJobSite('Indeed + Glassdoor');
      setSelectedMarkets([]);
      setSelectedRoles(roles.map(r => r.id));
      setSelectedRetailers([]);
      setSelectedClassifications(['Luxury', 'Mid', 'Big Box']);
      setMarketSearch('');
      setRetailerSearch('');
    }
  }, [isOpen, roles]);

  if (!isOpen) return null;

  // Filter options by search and sort alphabetically by name
  const filteredMarkets = markets
    .filter(m => `${m.name}, ${m.state}`.toLowerCase().includes(marketSearch.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const filteredRetailers = retailers
    .filter(r => r.name.toLowerCase().includes(retailerSearch.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Handlers
  const handleSelectAllMarkets = () => {
    setSelectedMarkets(markets.map(m => m.id));
  };

  const handleRemoveAllMarkets = () => {
    setSelectedMarkets([]);
  };

  const handleToggleMarket = (id: string) => {
    setSelectedMarkets(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    setMarketsDropdownOpen(false);
    setMarketSearch('');
  };

  const handleSelectAllRoles = () => {
    setSelectedRoles(roles.map(r => r.id));
  };

  const handleRemoveAllRoles = () => {
    setSelectedRoles([]);
  };

  const handleToggleRole = (id: string) => {
    setSelectedRoles(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleToggleRetailer = (id: string) => {
    setSelectedRetailers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    setRetailersDropdownOpen(false);
    setRetailerSearch('');
  };

  const handleRemoveRetailer = (id: string) => {
    setSelectedRetailers(prev => prev.filter(x => x !== id));
  };

  const handleToggleClassification = (classification: 'Luxury' | 'Mid' | 'Big Box') => {
    setSelectedClassifications(prev =>
      prev.includes(classification)
        ? prev.filter(x => x !== classification)
        : [...prev, classification]
    );
  };

  const handleRunScrape = () => {
    onRunScrape({
      jobSite: selectedJobSite,
      markets: selectedMarkets,
      roles: selectedRoles,
      retailers: selectedRetailers,
      retailerClassifications: selectedClassifications,
    });
    // Don't close - let isScraping prop control the UI state
  };

  const canRunScrape = selectedJobSite && selectedMarkets.length > 0 && selectedRoles.length > 0;

  return (
    <div className="scrape-modal-overlay" onClick={onClose}>
      <div className="scrape-modal" onClick={e => e.stopPropagation()}>
        <div className="scrape-modal-header">
          <h2>Run Scrape</h2>
          <button className="scrape-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="scrape-modal-body">
          {/* Job Site - Single Select Chips */}
          <div className="scrape-field">
            <label className="scrape-field-label">Job Site</label>
            <div className="scrape-chips-single">
              {JOB_SITES.map(site => (
                <button
                  key={site}
                  className={`scrape-chip-single ${selectedJobSite === site ? 'selected' : ''}`}
                  onClick={() => setSelectedJobSite(site)}
                >
                  {site}
                </button>
              ))}
            </div>
          </div>

          {/* Markets - Dropdown with multi-select */}
          <div className="scrape-field" ref={marketsRef}>
            <label className="scrape-field-label">Markets</label>
            <div className="scrape-dropdown-container">
              <div className="scrape-dropdown-header">
                <div className="scrape-dropdown-search">
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Search markets..."
                    value={marketSearch}
                    onChange={e => setMarketSearch(e.target.value)}
                    onFocus={() => setMarketsDropdownOpen(true)}
                  />
                </div>
                <div className="scrape-dropdown-actions">
                  <button onClick={handleSelectAllMarkets} disabled={selectedMarkets.length === markets.length}>Select All</button>
                  <button onClick={handleRemoveAllMarkets} disabled={selectedMarkets.length === 0}>Remove All</button>
                </div>
                <button
                  className="scrape-dropdown-toggle"
                  onClick={() => setMarketsDropdownOpen(!marketsDropdownOpen)}
                >
                  <ChevronDown size={16} className={marketsDropdownOpen ? 'open' : ''} />
                </button>
              </div>
              {marketsDropdownOpen && (
                <div className="scrape-dropdown-list">
                  {filteredMarkets.map(market => (
                    <button
                      key={market.id}
                      className={`scrape-dropdown-option ${selectedMarkets.includes(market.id) ? 'selected' : ''}`}
                      onClick={() => handleToggleMarket(market.id)}
                    >
                      <span className="scrape-option-check">
                        {selectedMarkets.includes(market.id) && <Check size={14} />}
                      </span>
                      {market.name}, {market.state}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {/* Selected markets chips */}
            {selectedMarkets.length > 0 && (
              <div className="scrape-selected-chips">
                {selectedMarkets.length === markets.length ? (
                  <span className="scrape-chip-selected">
                    All Markets
                    <button onClick={handleRemoveAllMarkets}><X size={12} /></button>
                  </span>
                ) : (
                  selectedMarkets.map(id => {
                    const market = markets.find(m => m.id === id);
                    return market ? (
                      <span key={id} className="scrape-chip-selected">
                        {market.name}, {market.state}
                        <button onClick={() => handleToggleMarket(id)}><X size={12} /></button>
                      </span>
                    ) : null;
                  })
                )}
              </div>
            )}
          </div>

          {/* Retailers - Dropdown + Classification toggles */}
          <div className="scrape-field" ref={retailersRef}>
            <label className="scrape-field-label">Retailers (Filter)</label>
            <p className="scrape-field-hint">Scrapes will only return jobs from selected retailers</p>

            {/* Retailer search dropdown */}
            <div className="scrape-dropdown-container">
              <div className="scrape-dropdown-header">
                <div className="scrape-dropdown-search">
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Search retailers..."
                    value={retailerSearch}
                    onChange={e => setRetailerSearch(e.target.value)}
                    onFocus={() => setRetailersDropdownOpen(true)}
                  />
                </div>
                <div className="scrape-dropdown-actions">
                  {(['Luxury', 'Mid', 'Big Box'] as const).map(classification => (
                    <button
                      key={classification}
                      disabled={selectedClassifications.includes(classification)}
                      onClick={() => handleToggleClassification(classification)}
                    >
                      {classification}
                    </button>
                  ))}
                </div>
                <button
                  className="scrape-dropdown-toggle"
                  onClick={() => setRetailersDropdownOpen(!retailersDropdownOpen)}
                >
                  <ChevronDown size={16} className={retailersDropdownOpen ? 'open' : ''} />
                </button>
              </div>
              {retailersDropdownOpen && (
                <div className="scrape-dropdown-list">
                  {filteredRetailers.map(retailer => (
                    <button
                      key={retailer.id}
                      className={`scrape-dropdown-option ${selectedRetailers.includes(retailer.id) ? 'selected' : ''}`}
                      onClick={() => handleToggleRetailer(retailer.id)}
                    >
                      {retailer.name}
                      <span className="scrape-retailer-class">{retailer.classification}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected classification + retailer chips */}
            {(selectedClassifications.length > 0 || selectedRetailers.length > 0) && (
              <div className="scrape-selected-chips">
                {selectedClassifications.map(classification => (
                  <span key={classification} className="scrape-chip-selected">
                    {classification}
                    <button onClick={() => handleToggleClassification(classification)}><X size={12} /></button>
                  </span>
                ))}
                {selectedRetailers.map(id => {
                  const retailer = retailers.find(r => r.id === id);
                  return retailer ? (
                    <span key={id} className="scrape-chip-selected">
                      {retailer.name}
                      <button onClick={() => handleRemoveRetailer(id)}><X size={12} /></button>
                    </span>
                  ) : null;
                })}
              </div>
            )}
          </div>

          {/* Roles - Chips with select/remove all */}
          <div className="scrape-field">
            <label className="scrape-field-label">Roles</label>
            <div className="scrape-dropdown-actions scrape-roles-actions">
              <button onClick={handleSelectAllRoles} disabled={selectedRoles.length === roles.length}>Select All</button>
              <button onClick={handleRemoveAllRoles} disabled={selectedRoles.length === 0}>Remove All</button>
            </div>
            <div className="scrape-chips-multi">
              {roles.map(role => (
                <button
                  key={role.id}
                  className={`scrape-chip-multi ${selectedRoles.includes(role.id) ? 'selected' : ''}`}
                  onClick={() => handleToggleRole(role.id)}
                >
                  {role.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="scrape-modal-footer">
          {!isScraping ? (
            <>
              <button className="scrape-cancel-btn" onClick={onClose}>
                Cancel
              </button>
              <button
                className="scrape-run-btn"
                onClick={handleRunScrape}
                disabled={!canRunScrape}
              >
                Run Scrape
              </button>
            </>
          ) : (
            <div className="scrape-progress-panel">
              <div className="scrape-progress-header">
                <Loader2 size={16} className="scrape-spinner" />
                <span className="scrape-progress-title">
                  {scrapeProgress?.phase === 'initializing' && 'Initializing scraper...'}
                  {scrapeProgress?.phase === 'launching' && 'Launching browser...'}
                  {scrapeProgress?.phase === 'navigating' && 'Loading job listings...'}
                  {scrapeProgress?.phase === 'scraping' && 'Extracting job data...'}
                  {scrapeProgress?.phase === 'filtering' && 'Filtering to tracked retailers...'}
                  {scrapeProgress?.phase === 'complete' && 'Complete!'}
                  {!scrapeProgress?.phase && 'Starting scrape...'}
                </span>
                <span className="scrape-progress-timer">{formatTime(scrapeProgress?.elapsedSeconds || 0)}</span>
              </div>

              {scrapeProgress && (
                <div className="scrape-progress-details">
                  <div className="scrape-progress-row">
                    <span className="scrape-progress-label">Market:</span>
                    <span className="scrape-progress-value">
                      {scrapeProgress.currentMarket || 'Waiting...'}
                      {scrapeProgress.totalMarkets > 0 && (
                        <span className="scrape-progress-count">
                          ({scrapeProgress.marketsCompleted + 1} of {scrapeProgress.totalMarkets})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="scrape-progress-row">
                    <span className="scrape-progress-label">Role:</span>
                    <span className="scrape-progress-value">
                      {scrapeProgress.currentRole || 'Waiting...'}
                      {scrapeProgress.totalRoles > 0 && (
                        <span className="scrape-progress-count">
                          ({scrapeProgress.rolesCompleted + 1} of {scrapeProgress.totalRoles})
                        </span>
                      )}
                    </span>
                  </div>
                  {scrapeProgress.totalPages > 0 && (
                    <div className="scrape-progress-row">
                      <span className="scrape-progress-label">Page:</span>
                      <span className="scrape-progress-value">
                        {scrapeProgress.currentPage} of {scrapeProgress.totalPages}
                      </span>
                    </div>
                  )}
                  <div className="scrape-progress-stats">
                    <div className="scrape-stat">
                      <span className="scrape-stat-value">{scrapeProgress.jobsFound}</span>
                      <span className="scrape-stat-label">Jobs Found</span>
                    </div>
                    <div className="scrape-stat">
                      <span className="scrape-stat-value">{scrapeProgress.jobsMatched}</span>
                      <span className="scrape-stat-label">Matched Retailers</span>
                    </div>
                  </div>
                </div>
              )}

              <button
                className="scrape-cancel-btn scrape-cancel-btn--active"
                onClick={onCancelScrape}
              >
                Cancel Scrape
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
