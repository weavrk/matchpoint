import { useState, useCallback, useEffect, useMemo } from 'react';
import { Briefcase, Link, FileText, BarChart3, Search } from 'lucide-react';
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

const MARKETS = [
  { id: 'nyc', name: 'New York City', state: 'NY' },
  { id: 'la', name: 'Los Angeles', state: 'CA' },
  { id: 'chicago', name: 'Chicago', state: 'IL' },
  { id: 'houston', name: 'Houston', state: 'TX' },
  { id: 'phoenix', name: 'Phoenix', state: 'AZ' },
  { id: 'philadelphia', name: 'Philadelphia', state: 'PA' },
  { id: 'san-antonio', name: 'San Antonio', state: 'TX' },
  { id: 'san-diego', name: 'San Diego', state: 'CA' },
  { id: 'dallas', name: 'Dallas', state: 'TX' },
  { id: 'san-jose', name: 'San Jose', state: 'CA' },
  { id: 'austin', name: 'Austin', state: 'TX' },
  { id: 'miami', name: 'Miami', state: 'FL' },
  { id: 'atlanta', name: 'Atlanta', state: 'GA' },
  { id: 'boston', name: 'Boston', state: 'MA' },
  { id: 'seattle', name: 'Seattle', state: 'WA' },
  { id: 'denver', name: 'Denver', state: 'CO' },
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
    if (!marketSearch.trim()) return MARKETS;
    const search = marketSearch.toLowerCase();
    return MARKETS
      .map(market => {
        const nameMatch = market.name.toLowerCase().includes(search);
        const stateMatch = market.state.toLowerCase().includes(search);
        const score = nameMatch ? (market.name.toLowerCase().startsWith(search) ? 2 : 1) : (stateMatch ? 0.5 : 0);
        return { ...market, score };
      })
      .filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score);
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
              {filteredMarkets.length === 0 && (
                <p className="no-results">No markets found</p>
              )}
            </div>
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
