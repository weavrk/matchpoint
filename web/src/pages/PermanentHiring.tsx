import { useState, useCallback, useEffect, useMemo } from 'react';
import { Briefcase, Link, FileText, Search } from 'lucide-react';
import { ChatInterface } from '../components/Chat';
import { WorkerGrid } from '../components/Workers';
import { MockGeminiService } from '../services/gemini';
import { matchWorkers } from '../services/matching';
import { SAMPLE_WORKERS } from '../data/workers';
import { SAMPLE_RETAILER } from '../data/retailer';
import type { ChatMessage, MatchedWorker, JobSpec } from '../types';
import './PermanentHiring.css';

interface PermanentHiringProps {
  onRegisterStartChat?: (startFn: () => void) => void;
}

type TabId = 'ask-reflex' | 'published-jobs' | 'market-comparables';

// Common/popular markets shown as quick-select chips
const COMMON_MARKETS = [
  { id: 'new-york-ny', name: 'New York', state: 'NY' },
  { id: 'los-angeles-ca', name: 'Los Angeles', state: 'CA' },
  { id: 'chicago-il', name: 'Chicago', state: 'IL' },
  { id: 'miami-fl', name: 'Miami', state: 'FL' },
  { id: 'dallas-tx', name: 'Dallas', state: 'TX' },
  { id: 'atlanta-ga', name: 'Atlanta', state: 'GA' },
  { id: 'houston-tx', name: 'Houston', state: 'TX' },
  { id: 'boston-ma', name: 'Boston', state: 'MA' },
  { id: 'san-francisco-ca', name: 'San Francisco', state: 'CA' },
  { id: 'seattle-wa', name: 'Seattle', state: 'WA' },
  { id: 'denver-co', name: 'Denver', state: 'CO' },
  { id: 'phoenix-az', name: 'Phoenix', state: 'AZ' },
  { id: 'las-vegas-nv', name: 'Las Vegas', state: 'NV' },
  { id: 'washington-dc', name: 'Washington', state: 'D.C.' },
];

// All available markets
const MARKETS = [
  { id: 'austin-tx', name: 'Austin', state: 'TX' },
  { id: 'san-marcos-tx', name: 'San Marcos', state: 'TX' },
  { id: 'dallas-tx', name: 'Dallas', state: 'TX' },
  { id: 'houston-tx', name: 'Houston', state: 'TX' },
  { id: 'nashville-tn', name: 'Nashville', state: 'TN' },
  { id: 'san-antonio-tx', name: 'San Antonio', state: 'TX' },
  { id: 'phoenix-az', name: 'Phoenix', state: 'AZ' },
  { id: 'washington-dc', name: 'Washington', state: 'D.C.' },
  { id: 'orlando-fl', name: 'Orlando', state: 'FL' },
  { id: 'miami-fl', name: 'Miami', state: 'FL' },
  { id: 'new-york-ny', name: 'New York', state: 'NY' },
  { id: 'boston-ma', name: 'Boston', state: 'MA' },
  { id: 'woodbury-ny', name: 'Woodbury', state: 'NY' },
  { id: 'las-vegas-nv', name: 'Las Vegas', state: 'NV' },
  { id: 'tampa-fl', name: 'Tampa', state: 'FL' },
  { id: 'long-island-east-ny', name: 'Long Island East', state: 'NY' },
  { id: 'long-island-west-ny', name: 'Long Island West', state: 'NY' },
  { id: 'charleston-sc', name: 'Charleston', state: 'SC' },
  { id: 'fort-walton-beach-fl', name: 'Fort Walton Beach', state: 'FL' },
  { id: 'newark-nj', name: 'Newark', state: 'NJ' },
  { id: 'central-new-jersey-nj', name: 'Central New Jersey', state: 'NJ' },
  { id: 'los-angeles-ca', name: 'Los Angeles', state: 'CA' },
  { id: 'atlanta-ga', name: 'Atlanta', state: 'GA' },
  { id: 'denver-co', name: 'Denver', state: 'CO' },
  { id: 'detroit-mi', name: 'Detroit', state: 'MI' },
  { id: 'chicago-il', name: 'Chicago', state: 'IL' },
  { id: 'charlotte-nc', name: 'Charlotte', state: 'NC' },
  { id: 'westport-ct', name: 'Westport', state: 'CT' },
  { id: 'king-of-prussia-pa', name: 'King of Prussia', state: 'PA' },
  { id: 'cabazon-ca', name: 'Cabazon', state: 'CA' },
  { id: 'san-jose-ca', name: 'San Jose', state: 'CA' },
  { id: 'tulsa-ok', name: 'Tulsa', state: 'OK' },
  { id: 'minneapolis-mn', name: 'Minneapolis', state: 'MN' },
  { id: 'memphis-tn', name: 'Memphis', state: 'TN' },
  { id: 'new-orleans-la', name: 'New Orleans', state: 'LA' },
  { id: 'san-diego-ca', name: 'San Diego', state: 'CA' },
  { id: 'st-louis-mo', name: 'St. Louis', state: 'MO' },
  { id: 'portland-or', name: 'Portland', state: 'OR' },
  { id: 'seattle-wa', name: 'Seattle', state: 'WA' },
  { id: 'knoxville-tn', name: 'Knoxville', state: 'TN' },
  { id: 'san-francisco-ca', name: 'San Francisco', state: 'CA' },
  { id: 'cincinnati-oh', name: 'Cincinnati', state: 'OH' },
  { id: 'baton-rouge-la', name: 'Baton Rouge', state: 'LA' },
  { id: 'savannah-ga', name: 'Savannah', state: 'GA' },
  { id: 'bakersfield-ca', name: 'Bakersfield', state: 'CA' },
  { id: 'fresno-ca', name: 'Fresno', state: 'CA' },
  { id: 'salt-lake-city-ut', name: 'Salt Lake City', state: 'UT' },
  { id: 'biloxi-ms', name: 'Biloxi', state: 'MS' },
  { id: 'raleigh-durham-nc', name: 'Raleigh-Durham', state: 'NC' },
  { id: 'columbus-oh', name: 'Columbus', state: 'OH' },
  { id: 'westchester-ny', name: 'Westchester', state: 'NY' },
  { id: 'wilmington-de', name: 'Wilmington', state: 'DE' },
  { id: 'boulder-co', name: 'Boulder', state: 'CO' },
  { id: 'milwaukee-wi', name: 'Milwaukee', state: 'WI' },
  { id: 'fort-myers-fl', name: 'Fort Myers', state: 'FL' },
  { id: 'indianapolis-in', name: 'Indianapolis', state: 'IN' },
  { id: 'sacramento-ca', name: 'Sacramento', state: 'CA' },
  { id: 'omaha-ne', name: 'Omaha', state: 'NE' },
  { id: 'merrimack-nh', name: 'Merrimack', state: 'NH' },
];

const JOB_SITES = {
  general: [
    { name: 'Indeed', description: 'Largest job board, strong for hourly/retail roles' },
    { name: 'ZipRecruiter', description: 'AI matching, good retail coverage' },
    { name: 'LinkedIn', description: 'Better for management/supervisor roles' },
    { name: 'Glassdoor', description: 'Job postings + salary data' },
    { name: 'CareerBuilder', description: 'General board with retail category' },
  ],
  retailSpecific: [
    { name: 'AllRetailJobs.com', description: 'Dedicated retail job board' },
    { name: 'RetailJobsWeb.com', description: 'Retail-focused, management + hourly' },
    { name: 'RetailCareersNow', description: 'Retail industry specific' },
  ],
  hourlyShift: [
    { name: 'Snagajob', description: 'Built for hourly work, pre-screens availability' },
    { name: 'Wonolo', description: 'On-demand staffing, retail/warehouse' },
    { name: 'Instawork', description: 'Gig-style retail/hospitality shifts' },
  ],
};

const JOB_ROLES = {
  entryLevel: [
    { title: 'Sales Associate / Retail Associate', description: 'Customer service, sales floor support, POS transactions' },
    { title: 'Cashier', description: 'Checkout operations, handling payments' },
    { title: 'Stock Associate / Stocker', description: 'Receiving, organizing, replenishing inventory' },
    { title: 'Fitting Room Attendant', description: 'Managing dressing rooms, returning items to floor' },
  ],
  specialized: [
    { title: 'Visual Merchandiser', description: 'Displays, store layout, product presentation' },
    { title: 'Inventory Specialist', description: 'Stock counts, inventory management systems' },
    { title: 'Beauty Advisor / Cosmetics Associate', description: 'Product expertise, demos (Sephora, Ulta, department stores)' },
  ],
  management: [
    { title: 'Key Holder / Lead Associate', description: 'Opening/closing, shift supervision' },
    { title: 'Department Supervisor', description: 'Oversees specific section (shoes, menswear, etc.)' },
    { title: 'Assistant Store Manager', description: 'Operations support, staff scheduling' },
    { title: 'Store Manager', description: 'Full P&L responsibility, hiring, performance' },
    { title: 'District / Area Manager', description: 'Multi-store oversight' },
  ],
  seasonal: [
    { title: 'Holiday Seasonal Associate', description: 'Temp positions for peak seasons' },
    { title: 'Weekend Associate', description: 'Dedicated weekend availability' },
    { title: 'Early Morning Stocker', description: 'Pre-open inventory work' },
  ],
};

export function PermanentHiring({ onRegisterStartChat }: PermanentHiringProps) {
  const [activeTab, setActiveTab] = useState<TabId>('ask-reflex');
  const [chatStarted, setChatStarted] = useState(false);
  const [marketSearch, setMarketSearch] = useState('');
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);

  const filteredMarkets = useMemo(() => {
    if (!marketSearch.trim()) return [];
    const search = marketSearch.toLowerCase();
    return MARKETS
      .map(market => {
        const nameMatch = market.name.toLowerCase().includes(search);
        const stateMatch = market.state.toLowerCase().includes(search);
        const score = nameMatch ? (market.name.toLowerCase().startsWith(search) ? 2 : 1) : (stateMatch ? 0.5 : 0);
        return { ...market, score };
      })
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);
  }, [marketSearch]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [matchedWorkers, setMatchedWorkers] = useState<MatchedWorker[]>([]);
  const [jobSpec, setJobSpec] = useState<JobSpec | null>(null);
  const [geminiService] = useState(() => {
    // TODO: Re-enable GeminiService once quota resets or billing is enabled
    // const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    // if (apiKey) {
    //   return new GeminiService(apiKey);
    // }
    console.log('Using mock service (Gemini quota exceeded)');
    return new MockGeminiService();
  });

  const startConversation = useCallback(async () => {
    if (chatStarted) return;
    setChatStarted(true);
    setIsLoading(true);
    try {
      const response = await geminiService.startChat(
        SAMPLE_RETAILER.name,
        SAMPLE_RETAILER.brandTier
      );
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: response,
          timestamp: new Date(),
        },
      ]);
    } catch (error) {
      console.error('Failed to start chat:', error);
      setMessages([
        {
          id: '1',
          role: 'assistant',
          content: "Hi! I'm here to help you create a job posting for a permanent hire. What type of role are you looking to fill?",
          timestamp: new Date(),
        },
      ]);
    }
    setIsLoading(false);
  }, [geminiService, chatStarted]);

  // Register the start function with parent
  useEffect(() => {
    onRegisterStartChat?.(startConversation);
  }, [onRegisterStartChat, startConversation]);

  const handleSendMessage = async (content: string) => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await geminiService.sendMessage(content);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.text,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (response.jobSpec) {
        const spec = { ...response.jobSpec, retailerName: SAMPLE_RETAILER.name };
        setJobSpec(spec);
        const matches = matchWorkers(SAMPLE_WORKERS, spec);
        setMatchedWorkers(matches);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  return (
    <div className="permanent-hiring-page">
      <header className="page-header">
        <div className="page-header-icon" aria-hidden="true">
          <Link size={24} />
        </div>
        <div className="page-header-content">
          <h1 className="page-title">Talent Connect</h1>
        </div>
      </header>

      <nav className="page-tabs">
        <button
          className={`tab ${activeTab === 'ask-reflex' ? 'active' : ''}`}
          onClick={() => setActiveTab('ask-reflex')}
        >
          Ask Reflex
        </button>
        <button
          className={`tab ${activeTab === 'published-jobs' ? 'active' : ''}`}
          onClick={() => setActiveTab('published-jobs')}
        >
          Published Jobs
        </button>
        <button
          className={`tab ${activeTab === 'market-comparables' ? 'active' : ''}`}
          onClick={() => setActiveTab('market-comparables')}
        >
          Market Comparables
        </button>
      </nav>

      {activeTab === 'ask-reflex' && (
        <div className="hiring-content">
          <div className="chat-column">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
          </div>

          <div className="results-column">
            {matchedWorkers.length > 0 ? (
              <WorkerGrid
                workers={matchedWorkers}
                title={jobSpec?.title ? `Matches for "${jobSpec.title}"` : 'Matched Workers'}
              />
            ) : (
              <div className="results-placeholder">
                <div className="placeholder-content">
                  <Briefcase size={48} strokeWidth={1} />
                  <h3>Worker matches will appear here</h3>
                  <p>
                    Complete the conversation to see workers that match your job requirements
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'published-jobs' && (
        <div className="tab-empty-state">
          <div className="placeholder-content">
            <FileText size={48} strokeWidth={1} />
            <h3>No published jobs yet</h3>
            <p>
              Jobs you publish will appear here for workers to discover
            </p>
          </div>
        </div>
      )}

      {activeTab === 'market-comparables' && (
        <div className="market-comparables-content">
          <section className="market-section">
            <h2 className="section-title">Market</h2>
            <div className="market-search-container">
              <Search size={18} className="market-search-icon" />
              <input
                type="text"
                className="market-search-input"
                placeholder="Search markets..."
                value={marketSearch}
                onChange={(e) => setMarketSearch(e.target.value)}
              />
            </div>

            {/* Show search results when searching */}
            {marketSearch.trim() && (
              <div className="market-group">
                <h3 className="market-group-title">
                  Search Results
                  <span className="market-count">({filteredMarkets.length})</span>
                </h3>
                {filteredMarkets.length > 0 ? (
                  <div className="market-list">
                    {filteredMarkets.map(market => (
                      <button
                        key={market.id}
                        className={`market-item ${selectedMarket === market.id ? 'selected' : ''}`}
                        onClick={() => setSelectedMarket(market.id)}
                      >
                        <span className="market-name">{market.name}</span>
                        <span className="market-state">{market.state}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="no-results">No markets found</p>
                )}
              </div>
            )}

            {/* Show common markets when not searching */}
            {!marketSearch.trim() && (
              <div className="market-group">
                <h3 className="market-group-title">Common Markets</h3>
                <div className="market-list">
                  {COMMON_MARKETS.map(market => (
                    <button
                      key={market.id}
                      className={`market-item ${selectedMarket === market.id ? 'selected' : ''}`}
                      onClick={() => setSelectedMarket(market.id)}
                    >
                      <span className="market-name">{market.name}</span>
                      <span className="market-state">{market.state}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="job-sites-section">
            <h2 className="section-title">Job Sites</h2>

            <div className="job-sites-grid">
              <div className="job-sites-category">
                <h3 className="category-title">General Job Boards</h3>
                <ul className="job-sites-list">
                  {JOB_SITES.general.map(site => (
                    <li key={site.name} className="job-site-item">
                      <span className="job-site-name">{site.name}</span>
                      <span className="job-site-desc">{site.description}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="job-sites-category">
                <h3 className="category-title">Retail-Specific</h3>
                <ul className="job-sites-list">
                  {JOB_SITES.retailSpecific.map(site => (
                    <li key={site.name} className="job-site-item">
                      <span className="job-site-name">{site.name}</span>
                      <span className="job-site-desc">{site.description}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="job-sites-category">
                <h3 className="category-title">Hourly / Shift-Based</h3>
                <ul className="job-sites-list">
                  {JOB_SITES.hourlyShift.map(site => (
                    <li key={site.name} className="job-site-item">
                      <span className="job-site-name">{site.name}</span>
                      <span className="job-site-desc">{site.description}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </section>

          <section className="job-roles-section">
            <h2 className="section-title">Job Roles</h2>

            <div className="job-roles-grid">
              <div className="job-roles-category">
                <h3 className="category-title">Entry-Level Positions</h3>
                <ul className="job-roles-list">
                  {JOB_ROLES.entryLevel.map(role => (
                    <li key={role.title} className="job-role-item">
                      <span className="job-role-title">{role.title}</span>
                      <span className="job-role-desc">{role.description}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="job-roles-category">
                <h3 className="category-title">Specialized Roles</h3>
                <ul className="job-roles-list">
                  {JOB_ROLES.specialized.map(role => (
                    <li key={role.title} className="job-role-item">
                      <span className="job-role-title">{role.title}</span>
                      <span className="job-role-desc">{role.description}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="job-roles-category">
                <h3 className="category-title">Supervisory / Management</h3>
                <ul className="job-roles-list">
                  {JOB_ROLES.management.map(role => (
                    <li key={role.title} className="job-role-item">
                      <span className="job-role-title">{role.title}</span>
                      <span className="job-role-desc">{role.description}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="job-roles-category">
                <h3 className="category-title">Seasonal / Part-Time Focus</h3>
                <ul className="job-roles-list">
                  {JOB_ROLES.seasonal.map(role => (
                    <li key={role.title} className="job-role-item">
                      <span className="job-role-title">{role.title}</span>
                      <span className="job-role-desc">{role.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
