import { useState, useEffect } from 'react';
import { Check, Plus, UserStar, CalendarDays, BadgeCheck } from 'lucide-react';
import { WorkerCardHeader } from '../Workers/WorkerCardHeader';
import { WorkerCardCompact } from '../Workers/WorkerCardCompact';
import { WorkerCardTesting } from '../Workers/WorkerCardTesting';
import { WorkerCardFull } from '../Workers/WorkerCardFull';
import { fetchSampleWorkersForDSL, workerRowToProfile } from '../../services/supabase';
import type { MatchedWorker } from '../../types';

// Hardcoded sample worker for instant DSL panel load
// Based on real worker: Elizabeth Momberg from Austin
const DEFAULT_SAMPLE_WORKER: MatchedWorker = {
  id: '4aa0f0ba-541a-43b0-9728-8df0cdf69060',
  name: 'Elizabeth Momberg',
  photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop&crop=face',
  market: 'Austin',
  shiftVerified: true,
  activelyLooking: true,
  shiftsOnReflex: 47,
  invitedBackStores: 6,
  currentTier: 'R3',
  aboutMe: 'I genuinely enjoy being the first friendly face customers see and helping them discover pieces they will love. My experience with a range of brands has also made me a pro at keeping the floor organized and jumping in wherever shipment help is needed.',
  brandsWorked: [
    { name: 'Beehive', tier: 'mid' },
    { name: 'Everlane', tier: 'elevated' },
    { name: 'Faherty', tier: 'elevated' },
    { name: 'Fashion Incubator Pop-up', tier: 'mid' },
    { name: 'J. Crew Factory', tier: 'mid' },
    { name: 'Lively', tier: 'mid' },
    { name: 'Madewell', tier: 'mid' },
    { name: 'Mizzen+Main', tier: 'mid' },
    { name: 'PARTY & CO.', tier: 'mid' },
  ],
  endorsementCounts: {
    'Sales': 9,
    'All Around': 4,
    'Back of House': 4,
    'Management': 1,
  },
  shiftExperience: {
    'Greeter': 16,
    'Shipment Help': 12,
    'Fitting Rooms': 10,
    'Floor Organization': 10,
    'Omni Help': 4,
    'Cashier': 4,
    'Inventory Management': 3,
  },
  previousExperience: [
    { company: 'Unknown', duration: 'Unknown', roles: ['Back of House'] },
    { company: 'Unknown', duration: 'Unknown', roles: ['Sales Associate'] },
  ],
  reflexActivity: {
    shiftsByTier: { luxury: 0, elevated: 2, mid: 7 },
    longestRelationship: null,
    tierProgression: 'stable',
    storeFavoriteCount: 5,
  },
  retailerQuotes: [
    { quote: 'Elizabeth can jump in wherever needed! Efficient and self starter. Customer compliments and great energy!', brand: '', role: '' },
    { quote: "Elizabeth was a tremendous help! she jumped right in styling customers and greeting and working fitting rooms. super detail oriented and very experienced with retail ins and outs. would love love her back!", brand: '', role: '' },
    { quote: "Love Liz! She's so helpful and has great energy!", brand: '', role: '' },
    { quote: 'Liz is great with customers and staying busy when given direction', brand: '', role: '' },
  ],
  retailerSummary: undefined,
  workerUuid: '4fb0c921-eee3-4575-bf1a-f289f9115387',
  workerId: 984,
  matchScore: 94,
  matchReasons: ['Austin market', 'Shift Verified'],
};

interface DesignSystemPanelProps {
  onClose: () => void;
}

export function DesignSystemPanel({ onClose }: DesignSystemPanelProps) {
  // Start with hardcoded sample, optionally update from Supabase
  const [sampleWorker, setSampleWorker] = useState<MatchedWorker>(DEFAULT_SAMPLE_WORKER);

  useEffect(() => {
    // Optionally fetch fresh data from Supabase in background
    async function loadWorkers() {
      try {
        const { worker1 } = await fetchSampleWorkersForDSL();
        if (worker1) {
          setSampleWorker({
            ...workerRowToProfile(worker1),
            matchScore: 94,
            matchReasons: ['Luxury experience', 'High reliability'],
          });
        }
      } catch (error) {
        // Silent fail - we have hardcoded fallback
        console.error('Failed to load sample workers:', error);
      }
    }
    loadWorkers();
  }, []);

  return (
    <div className="design-system-panel">
      <div className="design-system-header">
        <h2>Design System</h2>
        <button className="design-system-close" onClick={onClose}>&times;</button>
      </div>
      <div className="design-system-content">
        {/* Colors Section */}
        <section className="ds-section">
          <h3>Colors</h3>
          <div className="ds-subsection">
            <h4>Brand + Primary</h4>
            <div className="ds-color-grid">
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--brand-pink)' }} />
                <span className="ds-color-name">--brand-pink</span>
                <span className="ds-color-value">#ff9a9a</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--primary)' }} />
                <span className="ds-color-name">--primary</span>
                <span className="ds-color-value">stone-700 #3F3F46</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--secondary)' }} />
                <span className="ds-color-name">--secondary</span>
                <span className="ds-color-value">stone-400 #A1A1AA</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--tertiary)' }} />
                <span className="ds-color-name">--tertiary</span>
                <span className="ds-color-value">stone-300 #D4D4D8</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--quaternary)' }} />
                <span className="ds-color-name">--quaternary</span>
                <span className="ds-color-value">stone-200 #E4E4E7</span>
              </div>
            </div>
          </div>
          <div className="ds-subsection">
            <h4>Background</h4>
            <div className="ds-color-grid">
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--background-navy)' }} />
                <span className="ds-color-name">--background-navy</span>
                <span className="ds-color-value">#f4f6f7</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--background-green)' }} />
                <span className="ds-color-name">--background-green</span>
                <span className="ds-color-value">#e6f6f3</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--background-pink)' }} />
                <span className="ds-color-name">--background-pink</span>
                <span className="ds-color-value">#ffe6e6</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--background-blue)' }} />
                <span className="ds-color-name">--background-blue</span>
                <span className="ds-color-value">#e0f1fc</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--background-gray)' }} />
                <span className="ds-color-name">--background-gray</span>
                <span className="ds-color-value">#e4e4e7</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--background-yellow)' }} />
                <span className="ds-color-name">--background-yellow</span>
                <span className="ds-color-value">#fff8ec</span>
              </div>
            </div>
          </div>
          <div className="ds-subsection">
            <h4>Accent</h4>
            <div className="ds-color-grid">
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--accent-navy-dark)' }} />
                <span className="ds-color-name">--accent-navy-dark</span>
                <span className="ds-color-value">#1e384a</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--accent-navy-mid)' }} />
                <span className="ds-color-name">--accent-navy-mid</span>
                <span className="ds-color-value">#698192</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--accent-navy-light)' }} />
                <span className="ds-color-name">--accent-navy-light</span>
                <span className="ds-color-value">#a9b7c1</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--accent-green-dark)' }} />
                <span className="ds-color-name">--accent-green-dark</span>
                <span className="ds-color-value">#327a72</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--accent-green-mid)' }} />
                <span className="ds-color-name">--accent-green-mid</span>
                <span className="ds-color-value">#4ba098</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--accent-green-light)' }} />
                <span className="ds-color-name">--accent-green-light</span>
                <span className="ds-color-value">#9dd9cf</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--accent-blue-dark)' }} />
                <span className="ds-color-name">--accent-blue-dark</span>
                <span className="ds-color-value">#2a5aa7</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--accent-blue-mid)' }} />
                <span className="ds-color-name">--accent-blue-mid</span>
                <span className="ds-color-value">#3b73ce</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--accent-blue-light)' }} />
                <span className="ds-color-name">--accent-blue-light</span>
                <span className="ds-color-value">#90bbef</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--accent-yellow-dark)' }} />
                <span className="ds-color-name">--accent-yellow-dark</span>
                <span className="ds-color-value">#e6a93b</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--accent-yellow-mid)' }} />
                <span className="ds-color-name">--accent-yellow-mid</span>
                <span className="ds-color-value">#ffd07b</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--accent-yellow-light)' }} />
                <span className="ds-color-name">--accent-yellow-light</span>
                <span className="ds-color-value">#ffeed0</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--accent-orange-dark)' }} />
                <span className="ds-color-name">--accent-orange-dark</span>
                <span className="ds-color-value">#db781f</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--accent-orange-mid)' }} />
                <span className="ds-color-name">--accent-orange-mid</span>
                <span className="ds-color-value">#f2a55e</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--accent-orange-light)' }} />
                <span className="ds-color-name">--accent-orange-light</span>
                <span className="ds-color-value">#f8cfa9</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--accent-purple-dark)' }} />
                <span className="ds-color-name">--accent-purple-dark</span>
                <span className="ds-color-value">#5055b7</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--accent-purple-mid)' }} />
                <span className="ds-color-name">--accent-purple-mid</span>
                <span className="ds-color-value">#676bd7</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--accent-purple-light)' }} />
                <span className="ds-color-name">--accent-purple-light</span>
                <span className="ds-color-value">#a7a5f3</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--accent-red-dark)' }} />
                <span className="ds-color-name">--accent-red-dark</span>
                <span className="ds-color-value">#aa3838</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--accent-red-mid)' }} />
                <span className="ds-color-name">--accent-red-mid</span>
                <span className="ds-color-value">#dc4a4a</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--accent-red-light)' }} />
                <span className="ds-color-name">--accent-red-light</span>
                <span className="ds-color-value">#fcc7c7</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--accent-pink-dark)' }} />
                <span className="ds-color-name">--accent-pink-dark</span>
                <span className="ds-color-value">#e68b8b</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--accent-pink-mid)' }} />
                <span className="ds-color-name">--accent-pink-mid</span>
                <span className="ds-color-value">#ffb8b8</span>
              </div>
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--accent-pink-light)' }} />
                <span className="ds-color-name">--accent-pink-light</span>
                <span className="ds-color-value">#ffd7d7</span>
              </div>
            </div>
          </div>
        </section>

        {/* Typography Section */}
        <section className="ds-section">
          <h3>Typography</h3>
          <div className="ds-subsection">
            <h4>Font Families</h4>
            <div className="ds-type-sample" style={{ fontFamily: 'var(--font-primary)' }}>
              <span className="ds-type-name">--font-primary</span>
              <span className="ds-type-preview">Circular Std - The quick brown fox</span>
            </div>
            <div className="ds-type-sample" style={{ fontFamily: 'var(--font-quincy)' }}>
              <span className="ds-type-name">--font-quincy</span>
              <span className="ds-type-preview">Quincy CF - The quick brown fox</span>
            </div>
          </div>
          <div className="ds-subsection">
            <h4>Type Classes</h4>
            <div className="ds-type-sample">
              <span className="ds-type-name">.type-tagline</span>
              <span className="ds-type-preview type-tagline">Hey Sam, let's connect</span>
            </div>
            <div className="ds-type-sample">
              <span className="ds-type-name">.type-prompt-question</span>
              <span className="ds-type-preview type-prompt-question">Where do you want to start?</span>
            </div>
            <div className="ds-type-sample">
              <span className="ds-type-name">.type-section-header-lg</span>
              <span className="ds-type-preview type-section-header-lg">Work History</span>
            </div>
            <div className="ds-type-sample">
              <span className="ds-type-name">.type-body-md</span>
              <span className="ds-type-preview type-body-md">Body text medium</span>
            </div>
            <div className="ds-type-sample">
              <span className="ds-type-name">.type-label-md</span>
              <span className="ds-type-preview type-label-md">Label medium</span>
            </div>
          </div>
        </section>

        {/* Chip Components Section */}
        <section className="ds-section">
          <h3>Chip Components</h3>

          <div className="ds-subsection">
            <h4>1. NavChipGrid variant="welcome"</h4>
            <p className="ds-description">Static welcome screen cards - 3x2 grid with icon + title</p>
            <div className="ds-example ds-example-chips">
              <div className="ds-chip-demo welcome-card">
                <div className="welcome-card-icon">
                  <UserStar size={24} />
                </div>
                <h3 className="welcome-card-title type-chip-header-lg">Fill a role at my store</h3>
              </div>
              <div className="ds-chip-demo welcome-card" style={{ borderColor: 'var(--app-primary)', background: 'var(--gray-50)' }}>
                <div className="welcome-card-icon" style={{ background: 'var(--app-primary)', color: '#ffffff' }}>
                  <UserStar size={24} />
                </div>
                <h3 className="welcome-card-title type-chip-header-lg">Hover State</h3>
              </div>
              <div className="ds-chip-demo welcome-card active">
                <div className="welcome-card-icon" style={{ background: 'var(--app-primary)', color: '#ffffff' }}>
                  <Check size={24} />
                </div>
                <h3 className="welcome-card-title type-chip-header-lg">Active</h3>
              </div>
            </div>
          </div>

          <div className="ds-subsection">
            <h4>3. MessageChip variant="single"</h4>
            <p className="ds-description">Single-select options with check icon on right</p>
            <div className="ds-example ds-example-list">
              <button className="ds-chip-demo message-chip-single type-chip-label" type="button">
                <span>Default</span>
                <span className="chip-icon"></span>
              </button>
              <button className="ds-chip-demo message-chip-single type-chip-label hover" type="button">
                <span>Hover</span>
                <span className="chip-icon"></span>
              </button>
              <button className="ds-chip-demo message-chip-single type-chip-label selected" type="button">
                <span>Selected</span>
                <span className="chip-icon"><Check size={14} /></span>
              </button>
            </div>
          </div>

          <div className="ds-subsection">
            <h4>4. MessageChip variant="multi"</h4>
            <p className="ds-description">Multi-select options with plus/check icon on right</p>
            <div className="ds-example ds-example-list">
              <button className="ds-chip-demo message-chip-multi type-chip-label" type="button">
                <span>Default</span>
                <span className="chip-icon"><Plus size={14} /></span>
              </button>
              <button className="ds-chip-demo message-chip-multi type-chip-label hover" type="button">
                <span>Hover</span>
                <span className="chip-icon"><Plus size={14} /></span>
              </button>
              <button className="ds-chip-demo message-chip-multi type-chip-label selected" type="button">
                <span>Selected</span>
                <span className="chip-icon"><Check size={14} /></span>
              </button>
            </div>
          </div>
        </section>

        {/* Tags Section */}
        <section className="ds-section">
          <h3>Tags</h3>
          <p className="ds-description">
            Usage: <code>className="tag tag-[style] tag-[size]"</code>
          </p>

          <div className="ds-subsection">
            <h4>Sizes</h4>
            <div className="ds-pills-styles-row">
              <div className="ds-pill-with-spec">
                <span className="tag tag-lite-gray tag-sm"><span className="tag-icon"><BadgeCheck size={12} /></span><span className="tag-text">Small</span></span>
                <div className="ds-spec-column">
                  <span className="ds-spec-text">class: tag-sm</span>
                  <span className="ds-spec-text">font: 12px / 16px</span>
                  <span className="ds-spec-text">weight: 500</span>
                  <span className="ds-spec-text">padding: 4px 12px</span>
                  <span className="ds-spec-text">icon: 12px</span>
                  <span className="ds-spec-text">gap: 4px</span>
                </div>
              </div>
              <div className="ds-pill-with-spec">
                <span className="tag tag-lite-gray tag-md"><span className="tag-icon"><BadgeCheck size={14} /></span><span className="tag-text">Medium</span></span>
                <div className="ds-spec-column">
                  <span className="ds-spec-text">class: tag-md</span>
                  <span className="ds-spec-text">font: 14px / 20px</span>
                  <span className="ds-spec-text">weight: 500</span>
                  <span className="ds-spec-text">padding: 4px 12px</span>
                  <span className="ds-spec-text">icon: 14px</span>
                  <span className="ds-spec-text">gap: 6px</span>
                </div>
              </div>
              <div className="ds-pill-with-spec">
                <span className="tag tag-lite-gray tag-lg"><span className="tag-icon"><BadgeCheck size={16} /></span><span className="tag-text">Large</span></span>
                <div className="ds-spec-column">
                  <span className="ds-spec-text">class: tag-lg</span>
                  <span className="ds-spec-text">font: 16px / 22px</span>
                  <span className="ds-spec-text">weight: 500</span>
                  <span className="ds-spec-text">padding: 6px 14px</span>
                  <span className="ds-spec-text">icon: 16px</span>
                  <span className="ds-spec-text">gap: 6px</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ds-subsection">
            <h4>Styles</h4>
            <div className="ds-pills-styles-row">
              <div className="ds-pill-with-spec">
                <span className="tag tag-stroke tag-md"><span className="tag-text">Stroke</span></span>
                <div className="ds-spec-column">
                  <span className="ds-spec-text">tag-stroke</span>
                  <span className="ds-spec-text">bg: #ffffff</span>
                  <span className="ds-spec-text">border: quaternary</span>
                  <span className="ds-spec-text">text: primary</span>
                </div>
              </div>
              <div className="ds-pill-with-spec">
                <span className="tag tag-lite-gray tag-md"><span className="tag-text">Lite Gray</span></span>
                <div className="ds-spec-column">
                  <span className="ds-spec-text">tag-lite-gray</span>
                  <span className="ds-spec-text">bg: background-navy</span>
                  <span className="ds-spec-text">text: primary</span>
                </div>
              </div>
              <div className="ds-pill-with-spec">
                <span className="tag tag-dark-gray tag-md"><span className="tag-text">Dark Gray</span></span>
                <div className="ds-spec-column">
                  <span className="ds-spec-text">tag-dark-gray</span>
                  <span className="ds-spec-text">bg: stone-700</span>
                  <span className="ds-spec-text">text: #ffffff</span>
                </div>
              </div>
              <div className="ds-pill-with-spec">
                <span className="tag tag-green tag-md"><span className="tag-text">Green</span></span>
                <div className="ds-spec-column">
                  <span className="ds-spec-text">tag-green</span>
                  <span className="ds-spec-text">bg: green-100</span>
                  <span className="ds-spec-text">text: primary</span>
                </div>
              </div>
              <div className="ds-pill-with-spec">
                <span className="tag tag-blue tag-md"><span className="tag-text">Blue</span></span>
                <div className="ds-spec-column">
                  <span className="ds-spec-text">tag-blue</span>
                  <span className="ds-spec-text">bg: blue-100</span>
                  <span className="ds-spec-text">text: primary</span>
                </div>
              </div>
              <div className="ds-pill-with-spec">
                <span className="tag tag-pink tag-md"><span className="tag-text">Pink</span></span>
                <div className="ds-spec-column">
                  <span className="ds-spec-text">tag-pink</span>
                  <span className="ds-spec-text">bg: pink-200</span>
                  <span className="ds-spec-text">text: primary</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ds-subsection">
            <h4>Variants</h4>
            <div className="ds-pills-styles-row">
              <div className="ds-pill-with-spec">
                <span className="tag tag-stroke tag-md"><span className="tag-text">Text Only</span></span>
                <div className="ds-spec-column">
                  <span className="ds-spec-text">tag-text only</span>
                </div>
              </div>
              <div className="ds-pill-with-spec">
                <span className="tag tag-stroke tag-md"><span className="tag-icon"><CalendarDays size={14} /></span><span className="tag-text">Icon Left</span></span>
                <div className="ds-spec-column">
                  <span className="ds-spec-text">tag-icon</span>
                  <span className="ds-spec-text">tag-text</span>
                </div>
              </div>
              <div className="ds-pill-with-spec">
                <span className="tag tag-stroke tag-md"><span className="tag-text">Icon Right</span><span className="tag-icon"><CalendarDays size={14} /></span></span>
                <div className="ds-spec-column">
                  <span className="ds-spec-text">tag-text</span>
                  <span className="ds-spec-text">tag-icon</span>
                </div>
              </div>
              <div className="ds-pill-with-spec">
                <span className="tag tag-stroke tag-md"><span className="tag-counter">3</span><span className="tag-text">Counter Left</span></span>
                <div className="ds-spec-column">
                  <span className="ds-spec-text">tag-counter</span>
                  <span className="ds-spec-text">tag-text</span>
                </div>
              </div>
              <div className="ds-pill-with-spec">
                <span className="tag tag-stroke tag-md"><span className="tag-text">Counter Right</span><span className="tag-counter">3</span></span>
                <div className="ds-spec-column">
                  <span className="ds-spec-text">tag-text</span>
                  <span className="ds-spec-text">tag-counter</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Worker Cards Section */}
        <section className="ds-section">
          <h3>Worker Cards</h3>
          <p className="ds-description">
            Worker profile cards used across all variants. Import from <code>components/Workers</code>.
          </p>

          <div className="ds-subsection">
            <h4>WorkerCardHeader (Reusable)</h4>
            <p className="ds-description">Reusable header component used by all card variants. Shows avatar, name, location, and status pills.</p>
            <div className="ds-worker-card-example">
              <div className="worker-card" style={{ background: '#fff' }}>
                <WorkerCardHeader worker={sampleWorker} />
              </div>
            </div>
          </div>

          <div className="ds-subsection">
            <h4>WorkerCardCompact</h4>
            <p className="ds-description">Compact teaser card for grids and chat. Shows header + Reflex stats + retailer summary (verified) or work history (non-verified) + endorsements.</p>
            <div className="ds-worker-card-example">
              <WorkerCardCompact worker={sampleWorker} />
            </div>
          </div>

          <div className="ds-subsection">
            <h4>WorkerCardFull</h4>
            <p className="ds-description">Full detail overlay card. Opens to the right of chat interface (60% width). Includes close button and comprehensive worker details. Triggered by clicking on a worker card.</p>
            <div className="ds-worker-card-full-example">
              <WorkerCardFull worker={sampleWorker} onClose={() => {}} />
            </div>
          </div>

          <div className="ds-subsection">
            <h4>WorkerCardTesting</h4>
            <p className="ds-description">Testing card that shows ALL available worker data fields. Use for prototyping to see what data is available.</p>
            <div className="ds-worker-card-example">
              <WorkerCardTesting worker={sampleWorker} />
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
