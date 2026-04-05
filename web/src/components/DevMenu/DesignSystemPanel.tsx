import { useState } from 'react';
import { Check, Plus, UserStar, CalendarDays, BadgeCheck, ChevronLeft, ChevronRight, Store, Clock, ArrowRight, Briefcase, CornerDownRight, CalendarFold, Blend, ChartNoAxesGantt, Search, Award, Trophy, Sparkles, Heart, HeartPlus, ClockCheck } from 'lucide-react';
import '../../pages/variants/V2TalentCentric/styles.css';
import { WorkerCardHeader } from '../Workers/WorkerCardHeader';
import { WorkerCardChip } from '../Workers/WorkerCardChip';
import { WorkerCardCompact } from '../Workers/WorkerCardCompact';
import { WorkerCardTesting } from '../Workers/WorkerCardTesting';
import { WorkerCardFull } from '../Workers/WorkerCardFull';
import type { MatchedWorker } from '../../types';

interface DesignSystemPanelProps {
  onClose: () => void;
}

type TabId = 'colors' | 'typography' | 'chips' | 'tags' | 'workers' | 'v2-shells';

const TABS: { id: TabId; label: string }[] = [
  { id: 'colors', label: 'Colors' },
  { id: 'typography', label: 'Typography' },
  { id: 'chips', label: 'Chips' },
  { id: 'tags', label: 'Tags' },
  { id: 'workers', label: 'Worker Cards' },
  { id: 'v2-shells', label: 'V2 Shells' },
];

/** Tag style classes shown in Tags → Variants (same layout per row). */
const DS_TAG_VARIANT_STYLES = [
  ['tag-stroke', 'Stroke'],
  ['tag-lite-gray', 'Lite gray'],
  ['tag-dark-gray', 'Dark gray'],
  ['tag-green', 'Green'],
  ['tag-green-light', 'Green Light'],
  ['tag-blue', 'Blue'],
  ['tag-pink', 'Pink'],
  ['tag-coral', 'Coral'],
] as const;

// Hardcoded snapshot from Supabase (Jayzon Trinidad) — no live fetch in the DSL panel
const sampleWorker: MatchedWorker = {
  id: '4659d2fd-a7e0-47c5-86ae-432cf0156671',
  name: 'Jayzon Trinidad',
  photo: '/images/avatars/male/pexels_001_cleaned.jpg',
  market: 'Long Island',
  shiftVerified: true,
  activelyLooking: true,
  shiftsOnReflex: 361,
  uniqueStoreCount: 39,
  invitedBackStores: 25,
  currentTier: 'R1',
  tardyPercent: 1,
  tardyRatio: '3 / 361',
  urgentCancelPercent: 0,
  urgentCancelRatio: '0 / 361',
  aboutMe: 'My years in luxury retail, including managing stores for brands like Thierry Mugler and Gant, have given me a sharp eye for detail and a passion for customer engagement. I genuinely enjoy the hustle of the sales floor and collaborating with a team to create a great shopping experience.',
  brandsWorked: [
    { name: 'Moncler', tier: 'elevated' },
    { name: 'Marc Jacobs', tier: 'elevated' },
    { name: 'Ralph Lauren', tier: 'mid' },
    { name: 'Golden Goose', tier: 'mid' },
    { name: 'Longchamp', tier: 'mid' },
    { name: 'Mackage', tier: 'mid' },
    { name: 'Faherty', tier: 'elevated' },
    { name: 'Everlane', tier: 'elevated' },
    { name: 'Reiss', tier: 'elevated' },
    { name: 'SKIMS', tier: 'mid' },
  ],
  previousExperience: [
    { company: 'Thierry Mugler', duration: '1 - 2 years', roles: ['Store Manager'] },
    { company: 'Gant', duration: '2+ years', roles: ['Store Manager'] },
    { company: 'Jitrois Paris', duration: '1 - 2 years', roles: ['Sales Associate'] },
  ],
  shiftExperience: {
    'Sales Associate': 274,
    'Greeter': 176,
    'Floor Organization': 94,
    'Inventory Management': 72,
    'Fitting Rooms': 67,
    'Shipments': 37,
    'Event Help': 26,
    'Cashier': 25,
  },
  endorsementCounts: {
    'Team Player': 68,
    'Positive Attitude': 67,
    'Customer Engagement': 62,
    'Hustle': 55,
    'Attention to Detail': 48,
    'Perfect Attire': 33,
    'Reviewed Flex Details': 28,
  },
  retailerQuotes: [
    { brand: 'Moncler', quote: 'Jayzon was a pleasure to work with.', role: 'Assistant Store Manager', reviewerName: 'Tiffany K.' },
    { brand: 'Longchamp', quote: 'He was attentive to guests, jumped right in to help the team and asked questions to make sure he was on track.', role: 'Store Manager', reviewerName: 'Steve A.' },
  ],
  retailerSummary: 'Store teams consistently describe Jayzon as a pleasure to work with, highlighting his proactive and customer-focused approach. He is attentive to guests and readily jumps in to support the team. Brands appreciate Jayzon\'s initiative in asking questions to ensure he is always on track.',
  reflexActivity: {
    shiftsByTier: { luxury: 0, elevated: 4, mid: 17 },
    longestRelationship: null,
    tierProgression: 'stable',
    storeFavoriteCount: 21,
  },
  matchScore: 97,
  matchReasons: ['361 shifts completed', 'R1 tier', 'Actively looking'],
};

export function DesignSystemPanel({ onClose }: DesignSystemPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>('colors');

  return (
    <div className="design-system-panel">
      <div className="design-system-header">
        <div className="design-system-header-top">
          <h2>Design System</h2>
          <button className="design-system-close" onClick={onClose}>&times;</button>
        </div>
        <div className="design-system-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`design-system-tab${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      <div className="design-system-content">
        {/* Colors Section */}
        {activeTab === 'colors' && (
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
              <div className="ds-color-swatch">
                <div className="ds-swatch" style={{ background: 'var(--hover)' }} />
                <span className="ds-color-name">--hover</span>
                <span className="ds-color-value">stone-900 #18181B</span>
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
        )}

        {/* Typography Section */}
        {activeTab === 'typography' && (
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
        )}

        {/* Chip Components Section */}
        {activeTab === 'chips' && (
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
            <h4>2. Persona Card="persona-card"</h4>
            <p className="ds-description">
              Used for persona selection step. Horizontal layout with text left, icon right, space-between.
              Add <code>.persona-card</code> to <code>.welcome-card</code>. Uses <code>flex-direction: row-reverse</code>,
              <code>justify-content: space-between</code>, <code>padding: 32px</code>.
            </p>
            <div className="ds-example ds-example-chips ds-example-v2-focus-welcome">
              <div className="ds-chip-demo welcome-card persona-card">
                <div className="welcome-card-icon">
                  <Store size={18} />
                </div>
                <div className="v2-welcome-card-text">
                  <h3 className="welcome-card-title type-chip-header-lg">Single-Store Manager</h3>
                  <p className="welcome-card-description type-body-md">Managing a team at one location</p>
                </div>
              </div>
              <div className="ds-chip-demo welcome-card persona-card" style={{ borderColor: 'var(--app-primary)', background: 'var(--gray-50)' }}>
                <div className="welcome-card-icon" style={{ background: 'var(--app-primary)', color: '#ffffff' }}>
                  <Store size={18} />
                </div>
                <div className="v2-welcome-card-text">
                  <h3 className="welcome-card-title type-chip-header-lg">Hover State</h3>
                  <p className="welcome-card-description type-body-md">Description text here</p>
                </div>
              </div>
              <div className="ds-chip-demo welcome-card persona-card active">
                <div className="welcome-card-icon" style={{ background: 'var(--app-primary)', color: '#ffffff' }}>
                  <Check size={18} />
                </div>
                <div className="v2-welcome-card-text">
                  <h3 className="welcome-card-title type-chip-header-lg">Active</h3>
                  <p className="welcome-card-description type-body-md">Description text here</p>
                </div>
              </div>
            </div>
          </div>

          <div className="ds-subsection">
            <h4>3. Journey Card="journey-card"</h4>
            <p className="ds-description">
              Selection cards for focus step. Background <code>blue-50</code>, hover/selected <code>gray-900</code> with white text.
              Title <code>.journey-card-title</code>: <code>font-size: 24px</code>, <code>line-height: 24px</code>, <code>font-weight: 500</code>.
              Description <code>.journey-card-description</code>: <code>font-size: 16px</code>, <code>line-height: 20px</code>.
              Arrow shows <code>ArrowRight</code> by default, <code>Check</code> when completed or selected.
            </p>
            <div className="ds-example ds-example-journey-cards">
              {/* Default state */}
              <button className="journey-card">
                <div className="journey-card-header">
                  <div className="journey-card-icon">
                    <CalendarFold size={24} />
                  </div>
                  <h3 className="journey-card-title">Type of employment</h3>
                </div>
                <div className="journey-card-footer">
                  <p className="journey-card-description">Full-time, part-time, or flex</p>
                  <div className="journey-card-arrow">
                    <ArrowRight size={20} />
                  </div>
                </div>
              </button>
              {/* Hover state (simulated with inline styles) */}
              <button className="journey-card" style={{ background: 'var(--gray-900)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' }}>
                <div className="journey-card-header">
                  <div className="journey-card-icon" style={{ color: 'white' }}>
                    <Blend size={24} />
                  </div>
                  <h3 className="journey-card-title" style={{ color: 'white' }}>Hover State</h3>
                </div>
                <div className="journey-card-footer">
                  <p className="journey-card-description" style={{ color: 'white' }}>Description text here</p>
                  <div className="journey-card-arrow" style={{ background: 'white', borderColor: 'white', color: 'var(--primary)' }}>
                    <ArrowRight size={20} />
                  </div>
                </div>
              </button>
              {/* Selected/Completed state */}
              <button className="journey-card selected">
                <div className="journey-card-header">
                  <div className="journey-card-icon">
                    <ChartNoAxesGantt size={24} />
                  </div>
                  <h3 className="journey-card-title">Selected/Completed</h3>
                </div>
                <div className="journey-card-footer">
                  <p className="journey-card-description">Shows checkmark icon</p>
                  <div className="journey-card-arrow">
                    <Check size={20} />
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="ds-subsection">
            <h4>4. Location Confirm Chip="v2-location-confirm-chip"</h4>
            <p className="ds-description">
              Full-width chips for location confirmation (Single-Store flow). Background <code>blue-50</code>,
              hover/selected fills <code>--hover</code> (stone-900) with white text and drop shadow. Checkmark icon on right.
            </p>
            <div className="ds-example ds-example-list" style={{ maxWidth: '400px' }}>
              {/* Default state */}
              <button className="v2-location-confirm-chip" type="button">
                <span>Yes, search in Austin</span>
                <span className="v2-confirm-chip-icon"><Check size={16} /></span>
              </button>
              {/* Hover/Selected state (simulated) */}
              <button className="v2-location-confirm-chip selected" type="button">
                <span>Hire in a different market</span>
                <span className="v2-confirm-chip-icon"><Check size={16} /></span>
              </button>
            </div>
          </div>

          <div className="ds-subsection">
            <h4>5. Chat Follow-up Chip="v2-chat-followup-chip"</h4>
            <p className="ds-description">
              Stacked vertical chips for chat follow-up options. Shows icon left, text center, check icon right (when active).
              Default has white background; hover and active states use <code>gray-900</code> dark background with white text.
            </p>
            <div className="ds-example ds-example-list" style={{ maxWidth: '400px' }}>
              {/* Default state */}
              <button className="v2-chat-followup-chip" type="button">
                <CornerDownRight size={18} className="v2-chip-icon-left" />
                <span>Default</span>
              </button>
              {/* Hover state (simulated) */}
              <button className="v2-chat-followup-chip" type="button" style={{ borderColor: 'var(--gray-900)', background: 'var(--gray-900)', color: 'white' }}>
                <CornerDownRight size={18} className="v2-chip-icon-left" style={{ color: 'white' }} />
                <span>Hover</span>
              </button>
              {/* Active state */}
              <button className="v2-chat-followup-chip active" type="button">
                <CornerDownRight size={18} className="v2-chip-icon-left" />
                <span>Active / Selected</span>
                <Check size={16} className="v2-chip-icon-right" />
              </button>
            </div>
          </div>

          <div className="ds-subsection">
            <h4>6. MessageChip variant="single"</h4>
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
            <h4>7. MessageChip variant="multi"</h4>
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
        )}

        {/* Tags Section */}
        {activeTab === 'tags' && (
        <section className="ds-section">
          <h3>Tags</h3>
          <p className="ds-description">
            Usage: <code>className="tag tag-[style] tag-[size]"</code>
          </p>

          <div className="ds-subsection">
            <h4>Sizes</h4>
            <div className="ds-3col-grid">
              <div className="ds-pill-with-spec">
                <span className="tag tag-lite-gray tag-sm"><span className="tag-icon"><BadgeCheck size={14} /></span><span className="tag-text">Small</span></span>
                <div className="ds-spec-column">
                  <span className="ds-spec-text">class: tag-sm</span>
                  <span className="ds-spec-text">font: 12px / 16px</span>
                  <span className="ds-spec-text">weight: 500</span>
                  <span className="ds-spec-text">padding: 4px 8px</span>
                  <span className="ds-spec-text">icon: 14px</span>
                  <span className="ds-spec-text">gap: 4px</span>
                </div>
              </div>
              <div className="ds-pill-with-spec">
                <span className="tag tag-lite-gray tag-md"><span className="tag-icon"><BadgeCheck size={16} /></span><span className="tag-text">Medium</span></span>
                <div className="ds-spec-column">
                  <span className="ds-spec-text">class: tag-md</span>
                  <span className="ds-spec-text">font: 14px / 20px</span>
                  <span className="ds-spec-text">weight: 500</span>
                  <span className="ds-spec-text">padding: 4px 12px</span>
                  <span className="ds-spec-text">icon: 16px</span>
                  <span className="ds-spec-text">gap: 4px</span>
                </div>
              </div>
              <div className="ds-pill-with-spec">
                <span className="tag tag-lite-gray tag-lg"><span className="tag-icon"><BadgeCheck size={18} /></span><span className="tag-text">Large</span></span>
                <div className="ds-spec-column">
                  <span className="ds-spec-text">class: tag-lg</span>
                  <span className="ds-spec-text">font: 16px / 22px</span>
                  <span className="ds-spec-text">weight: 500</span>
                  <span className="ds-spec-text">padding: 6px 12px</span>
                  <span className="ds-spec-text">icon: 18px</span>
                  <span className="ds-spec-text">gap: 6px</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ds-subsection">
            <h4>Styles</h4>
            <div className="ds-3col-grid">
              <div className="ds-pill-with-spec">
                <span className="tag tag-stroke tag-md"><span className="tag-text">Stroke</span></span>
                <div className="ds-spec-column">
                  <span className="ds-spec-text">tag-stroke</span>
                  <span className="ds-spec-text">bg: #ffffff</span>
                  <span className="ds-spec-text">border: quaternary</span>
                  <span className="ds-spec-text">text: primary</span>
                  <span className="ds-spec-text">icon: text-primary</span>
                  <span className="ds-spec-text">counter bg: blue-100</span>
                  <span className="ds-spec-text">counter text: primary</span>
                </div>
              </div>
              <div className="ds-pill-with-spec">
                <span className="tag tag-lite-gray tag-md"><span className="tag-text">Lite Gray</span></span>
                <div className="ds-spec-column">
                  <span className="ds-spec-text">tag-lite-gray</span>
                  <span className="ds-spec-text">bg: gray-200</span>
                  <span className="ds-spec-text">text: primary</span>
                  <span className="ds-spec-text">icon: text-primary</span>
                  <span className="ds-spec-text">counter bg: #ffffff</span>
                  <span className="ds-spec-text">counter text: primary</span>
                </div>
              </div>
              <div className="ds-pill-with-spec">
                <span className="tag tag-dark-gray tag-md"><span className="tag-text">Dark Gray</span></span>
                <div className="ds-spec-column">
                  <span className="ds-spec-text">tag-dark-gray</span>
                  <span className="ds-spec-text">bg: stone-700</span>
                  <span className="ds-spec-text">text: #ffffff</span>
                  <span className="ds-spec-text">icon: rgba(255,255,255,0.8)</span>
                  <span className="ds-spec-text">counter bg: gray-100</span>
                  <span className="ds-spec-text">counter text: primary</span>
                </div>
              </div>
              <div className="ds-pill-with-spec">
                <span className="tag tag-green tag-md"><span className="tag-text">Green</span></span>
                <div className="ds-spec-column">
                  <span className="ds-spec-text">tag-green</span>
                  <span className="ds-spec-text">bg: accent-green-light</span>
                  <span className="ds-spec-text">text: primary</span>
                  <span className="ds-spec-text">icon: text-primary</span>
                  <span className="ds-spec-text">counter bg: #ffffff</span>
                  <span className="ds-spec-text">counter text: primary</span>
                </div>
              </div>
              <div className="ds-pill-with-spec">
                <span className="tag tag-green-light tag-md"><span className="tag-text">Green Light</span></span>
                <div className="ds-spec-column">
                  <span className="ds-spec-text">tag-green-light</span>
                  <span className="ds-spec-text">bg: background-green</span>
                  <span className="ds-spec-text">text: primary</span>
                  <span className="ds-spec-text">icon: text-primary</span>
                  <span className="ds-spec-text">counter bg: #ffffff</span>
                  <span className="ds-spec-text">counter text: primary</span>
                </div>
              </div>
              <div className="ds-pill-with-spec">
                <span className="tag tag-blue tag-md"><span className="tag-text">Blue</span></span>
                <div className="ds-spec-column">
                  <span className="ds-spec-text">tag-blue</span>
                  <span className="ds-spec-text">bg: blue-lite</span>
                  <span className="ds-spec-text">text: primary</span>
                  <span className="ds-spec-text">icon: text-primary</span>
                  <span className="ds-spec-text">counter bg: #ffffff</span>
                  <span className="ds-spec-text">counter text: primary</span>
                </div>
              </div>
              <div className="ds-pill-with-spec">
                <span className="tag tag-pink tag-md"><span className="tag-text">Pink</span></span>
                <div className="ds-spec-column">
                  <span className="ds-spec-text">tag-pink</span>
                  <span className="ds-spec-text">bg: pink-lite</span>
                  <span className="ds-spec-text">text: primary</span>
                  <span className="ds-spec-text">icon: text-primary</span>
                  <span className="ds-spec-text">counter bg: #ffffff</span>
                  <span className="ds-spec-text">counter text: primary</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ds-subsection">
            <h4>Variants</h4>
            <div className="ds-tag-variant-rows ds-tag-variant-rows-compact">
              {DS_TAG_VARIANT_STYLES.map(([styleClass]) => (
                <div key={styleClass} className="ds-tag-variant-row">
                  <div className="ds-pills-styles-row ds-pills-tags-only">
                    <span className={`tag ${styleClass} tag-md`}>
                      <span className="tag-text">Text Only</span>
                    </span>
                    <span className={`tag ${styleClass} tag-md`}>
                      <span className="tag-icon">
                        <CalendarDays size={14} />
                      </span>
                      <span className="tag-text">Icon Left</span>
                    </span>
                    <span className={`tag ${styleClass} tag-md`}>
                      <span className="tag-text">Icon Right</span>
                      <span className="tag-icon">
                        <CalendarDays size={14} />
                      </span>
                    </span>
                    <span className={`tag ${styleClass} tag-md`}>
                      <span className="tag-counter">3</span>
                      <span className="tag-text">Counter Left</span>
                    </span>
                    <span className={`tag ${styleClass} tag-md`}>
                      <span className="tag-text">Counter Right</span>
                      <span className="tag-counter">3</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="ds-subsection">
            <h4>Applications</h4>

            <h5>Status Tags (conditional, tag-md)</h5>
            <div className="ds-chip-logic-box">
              <table className="ds-logic-table">
                <thead>
                  <tr>
                    <th>Chip</th>
                    <th>Condition</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="tag tag-blue-light tag-md"><span className="tag-icon"><BadgeCheck size={16} /></span><span className="tag-text">Shift Verified</span></span></td>
                    <td><code>shiftVerified: true</code></td>
                  </tr>
                  <tr>
                    <td><span className="tag tag-blue tag-md"><span className="tag-icon"><Search size={16} /></span><span className="tag-text">Actively Looking</span></span></td>
                    <td><code>activelyLooking: true</code></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h5>Stats Tags (unconditional - shown for all, tag-md)</h5>
            <div className="ds-chip-logic-box">
              <table className="ds-logic-table">
                <thead>
                  <tr>
                    <th>Chip</th>
                    <th>Data Source</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="tag tag-stroke tag-md"><span className="tag-counter">361</span><span className="tag-text">Shifts</span></span></td>
                    <td><code>shiftsOnReflex</code></td>
                  </tr>
                  <tr>
                    <td><span className="tag tag-stroke tag-md"><span className="tag-counter">39</span><span className="tag-text">Store Locations</span></span></td>
                    <td><code>uniqueStoreCount</code></td>
                  </tr>
                  <tr>
                    <td><span className="tag tag-dark-gray tag-md"><span className="tag-text">Sales Associate</span><span className="tag-counter">274</span></span></td>
                    <td><code>shiftExperience[role]</code></td>
                  </tr>
                  <tr>
                    <td><span className="tag tag-stroke tag-md"><span className="tag-text">Team Player</span><span className="tag-counter">68</span></span></td>
                    <td><code>endorsementCounts[trait]</code></td>
                  </tr>
                  <tr>
                    <td><span className="tag tag-dark-gray tag-md"><span className="tag-text">Moncler</span></span></td>
                    <td><code>brandsWorked[].name</code></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h5>Achievement Tags (conditional - shown only if met, tag-md)</h5>
            <div className="ds-chip-logic-box">
              <table className="ds-logic-table">
                <thead>
                  <tr>
                    <th>Chip</th>
                    <th>Condition</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span className="tag tag-green tag-md"><span className="tag-icon"><Heart size={16} /></span><span className="tag-text">Market Favorite</span></span></td>
                    <td><code>marketFavorite: true</code></td>
                  </tr>
                  <tr>
                    <td><span className="tag tag-green tag-md"><span className="tag-icon"><Award size={16} /></span><span className="tag-text">100% On-Time</span></span></td>
                    <td><code>tardyRatio = "0/x"</code> (never late)</td>
                  </tr>
                  <tr>
                    <td><span className="tag tag-green-light tag-md"><span className="tag-icon"><ClockCheck size={16} /></span><span className="tag-text">X% On-Time</span></span></td>
                    <td><code>100 - tardyPercent</code> (if tardyPercent &lt; 10%)</td>
                  </tr>
                  <tr>
                    <td><span className="tag tag-green-light tag-md"><span className="tag-icon"><Sparkles size={16} /></span><span className="tag-text">Exceptional Commitment</span></span></td>
                    <td><code>urgentCancelPercent &lt; 5%</code></td>
                  </tr>
                  <tr>
                    <td><span className="tag tag-green tag-md"><span className="tag-icon"><Trophy size={16} /></span><span className="tag-text">0 Call-Outs</span></span></td>
                    <td><code>urgentCancelRatio = "0/x"</code></td>
                  </tr>
                  <tr>
                    <td><span className="tag tag-green tag-md"><span className="tag-icon"><HeartPlus size={16} /></span><span className="tag-text">X% Favorite Rating</span></span></td>
                    <td><code>storeFavoriteCount &gt;= 89%</code> of uniqueStoreCount</td>
                  </tr>
                  <tr>
                    <td><span className="tag tag-green-light tag-md"><span className="tag-icon"><UserStar size={16} /></span><span className="tag-text">X% Invite Back Rate</span></span></td>
                    <td><code>invitedBackStores &gt;= 94%</code> of uniqueStoreCount</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>
        )}

        {/* Worker Cards Section */}
        {activeTab === 'workers' && (
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
            <h4>WorkerCardChip</h4>
            <p className="ds-description">Minimal horizontal chip for inline mentions and compact selection lists. Shows avatar, name, location, and verified badge.</p>
            <div className="ds-worker-card-example">
              <WorkerCardChip worker={sampleWorker} />
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
        )}

        {/* V2 Page Content Shells */}
        {activeTab === 'v2-shells' && (
        <section className="ds-section">
          <h3>V2 Page Content Shells</h3>
          <p className="ds-description">
            Reusable layout components for V2 Talent Centric flow. Import from <code>pages/variants/V2TalentCentric</code>.
          </p>

          <div className="ds-subsection">
            <h4>.v2-main</h4>
            <p className="ds-description">Main content shell. All step content lives inside this container.</p>
            <ul className="ds-style-list">
              <li><span className="ds-style-prop">display:</span> <code>flex</code></li>
              <li><span className="ds-style-prop">flex-direction:</span> <code>column</code></li>
              <li><span className="ds-style-prop">flex:</span> <code>1</code></li>
              <li><span className="ds-style-prop">padding:</span> <code>32px 64px 64px 64px</code></li>
              <li><span className="ds-style-prop">overflow-y:</span> <code>auto</code></li>
              <li><span className="ds-style-prop">transition:</span> <code>250ms ease-out</code> (JS timeout 250ms)
                <ul className="ds-style-list-nested">
                  <li><code>.slide-in-right-forward</code> translateX(30px) to 0, opacity 0 to 1 (300ms)</li>
                  <li><code>.slide-out-left-forward</code> translateX(0) to -30px, opacity 1 to 0 (250ms)</li>
                  <li><code>.slide-in-left-backward</code> translateX(-30px) to 0, opacity 0 to 1 (300ms)</li>
                  <li><code>.slide-out-right-backward</code> translateX(0) to 30px, opacity 1 to 0 (250ms)</li>
                </ul>
              </li>
            </ul>
          </div>

          <div className="ds-subsection">
            <h4>.v2-welcome-step</h4>
            <p className="ds-description">Welcome hero screen variant. Centered content with special padding.</p>
            <ul className="ds-style-list">
              <li><span className="ds-style-prop">padding:</span> <code>140px 64px</code></li>
              <li><span className="ds-style-prop">align-items:</span> <code>center</code></li>
              <li><span className="ds-style-prop">justify-content:</span> <code>flex-start</code></li>
              <li><span className="ds-style-prop">text-align:</span> <code>center</code></li>
            </ul>
          </div>

          <div className="ds-subsection">
            <h4>.v2-main-centered</h4>
            <p className="ds-description">Centered content container. Horizontally centered with centered text. Use for step content that should be constrained width but not full-bleed.</p>
            <ul className="ds-style-list">
              <li><span className="ds-style-prop">display:</span> <code>flex</code></li>
              <li><span className="ds-style-prop">flex-direction:</span> <code>column</code></li>
              <li><span className="ds-style-prop">align-items:</span> <code>center</code></li>
              <li><span className="ds-style-prop">padding-top:</span> <code>120px</code></li>
              <li><span className="ds-style-prop">text-align:</span> <code>center</code></li>
              <li><span className="ds-style-prop">children max-width:</span> <code>720px</code></li>
            </ul>
          </div>

          <div className="ds-subsection">
            <h4>.v2-focus-chips, .persona-card, and .v2-welcome-card-text</h4>
            <p className="ds-description">
              Focus rows use <code>.v2-focus-chips</code> (2-column grid, <code>gap: 16px</code>; single column below 500px).
              Persona cards add <code>.persona-card</code> for horizontal layout (text left, icon right, space-between).
              Text wrapper <code>.v2-welcome-card-text</code> contains title + description.
            </p>
            <ul className="ds-style-list">
              <li><span className="ds-style-prop">.v2-focus-chips:</span> <code>display: grid</code>, <code>grid-template-columns: repeat(2, 1fr)</code>, <code>gap: 16px</code></li>
              <li><span className="ds-style-prop">.persona-card:</span> <code>flex-direction: row-reverse</code>, <code>justify-content: space-between</code>, <code>padding: 32px</code></li>
              <li><span className="ds-style-prop">.v2-welcome-card-text:</span> <code>display: flex</code>, <code>flex-direction: column</code>, <code>gap: 2px</code>, left-aligned for persona</li>
              <li><span className="ds-style-prop">.v2-main h3.welcome-card-title:</span> <code>font-size: 20px</code>, <code>font-weight: 700</code>, <code>line-height: 24px</code>, <code>padding-bottom: 4px</code></li>
              <li><span className="ds-style-prop">.v2-main p.welcome-card-description:</span> <code>font-size: 16px</code></li>
            </ul>
          </div>

          <div className="ds-subsection">
            <h4>.journey-card, .journey-card-title, .journey-card-description</h4>
            <p className="ds-description">
              Focus-step journey tiles (three-up grid). Styles live in <code>V2TalentCentric/styles.css</code>; this panel imports that sheet so the Chips tab preview matches any variant.
            </p>
            <ul className="ds-style-list">
              <li><span className="ds-style-prop">.journey-card:</span> <code>background: blue-50</code>, <code>border: 1px solid quaternary</code>, <code>border-radius: 12px</code>, <code>padding: 28px</code></li>
              <li><span className="ds-style-prop">.journey-card:hover:</span> <code>background: gray-900</code>, <code>box-shadow: 0 8px 32px rgba(0,0,0,0.2)</code>, text turns white</li>
              <li><span className="ds-style-prop">.journey-card.selected:</span> same as hover state</li>
              <li><span className="ds-style-prop">.journey-card.completed:</span> arrow shows checkmark, background fills primary</li>
              <li><span className="ds-style-prop">.journey-card-title:</span> <code>font-size: 24px</code>, <code>line-height: 24px</code>, <code>font-weight: 500</code></li>
              <li><span className="ds-style-prop">.journey-card-description:</span> <code>font-size: 16px</code>, <code>line-height: 20px</code></li>
              <li><span className="ds-style-prop">.journey-card-arrow:</span> <code>40px</code> circle, border quaternary; hover fills white, completed fills primary with white check</li>
            </ul>
          </div>

          <div className="ds-subsection">
            <h4>.v2-location-confirm-chip</h4>
            <p className="ds-description">
              Full-width confirmation chips for Single-Store location flow.
            </p>
            <ul className="ds-style-list">
              <li><span className="ds-style-prop">background:</span> <code>blue-50</code></li>
              <li><span className="ds-style-prop">border:</span> <code>1px solid quaternary</code>, <code>border-radius: 12px</code></li>
              <li><span className="ds-style-prop">padding:</span> <code>18px 24px</code></li>
              <li><span className="ds-style-prop">:hover / .selected:</span> <code>background: primary</code>, <code>color: white</code></li>
              <li><span className="ds-style-prop">.v2-confirm-chip-icon:</span> <code>28px</code> circle, shows checkmark</li>
            </ul>
          </div>

          <div className="ds-subsection">
            <h4>.v2-shell-header-section</h4>
            <p className="ds-description">Fixed header area for steps with scrollable content. Contains title, subtitle, and controls.</p>
            <ul className="ds-style-list">
              <li><span className="ds-style-prop">flex-shrink:</span> <code>0</code></li>
              <li><span className="ds-style-prop">padding:</span> <code>48px 64px 0</code></li>
              <li><span className="ds-style-prop">border-bottom:</span> <code>1px solid var(--quaternary)</code></li>
            </ul>
          </div>

          <div className="ds-subsection">
            <h4>.v2-step-content-scroll</h4>
            <p className="ds-description">Scrollable content area. Contains grid or list content below the header.</p>
            <ul className="ds-style-list">
              <li><span className="ds-style-prop">flex:</span> <code>1</code></li>
              <li><span className="ds-style-prop">overflow-y:</span> <code>auto</code></li>
              <li><span className="ds-style-prop">padding:</span> <code>16px 64px 48px</code></li>
            </ul>
          </div>

          <div className="ds-subsection">
            <h4>.v2-nav-footer</h4>
            <div className="ds-example ds-example-nav-footer">
              <div className="ds-nav-footer-demo">
                <button className="ds-nav-btn ds-nav-btn-back">
                  <ChevronLeft size={20} />
                  <span>Back</span>
                </button>
                <button className="ds-nav-btn ds-nav-btn-next">
                  <span>Continue</span>
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
            <ul className="ds-style-list">
              <li><span className="ds-style-prop">margin-top:</span> <code>auto</code></li>
              <li><span className="ds-style-prop">background:</span> <code>#ffffff</code></li>
              <li><span className="ds-style-prop">border-top:</span> <code>1px solid var(--quaternary)</code></li>
              <li><span className="ds-style-prop">padding:</span> <code>16px 0 0</code></li>
              <li><span className="ds-style-prop">flex-shrink:</span> <code>0</code></li>
            </ul>
          </div>

          <div className="ds-subsection-row">
            <div className="ds-subsection">
              <h4>.v2-btn-back</h4>
              <ul className="ds-style-list">
                <li><span className="ds-style-prop">display:</span> <code>flex</code></li>
                <li><span className="ds-style-prop">padding:</span> <code>12px 36px</code></li>
                <li><span className="ds-style-prop">min-width:</span> <code>140px</code></li>
                <li><span className="ds-style-prop">border-radius:</span> <code>8px</code></li>
                <li><span className="ds-style-prop">font-size:</span> <code>16px</code></li>
                <li><span className="ds-style-prop">font-weight:</span> <code>500</code></li>
                <li><span className="ds-style-prop">transition:</span> <code>all 0.15s</code></li>
                <li><span className="ds-style-prop">background:</span> <code>var(--white)</code></li>
                <li><span className="ds-style-prop">border:</span> <code>1px solid var(--quaternary)</code></li>
                <li><span className="ds-style-prop">color:</span> <code>var(--primary)</code></li>
                <li><span className="ds-style-prop">hover background:</span> <code>var(--gray-50)</code></li>
                <li><span className="ds-style-prop">hover border:</span> <code>var(--tertiary)</code></li>
              </ul>
            </div>

            <div className="ds-subsection">
              <h4>.v2-btn-next</h4>
              <ul className="ds-style-list">
                <li><span className="ds-style-prop">display:</span> <code>flex</code></li>
                <li><span className="ds-style-prop">padding:</span> <code>12px 36px</code></li>
                <li><span className="ds-style-prop">min-width:</span> <code>140px</code></li>
                <li><span className="ds-style-prop">border-radius:</span> <code>8px</code></li>
                <li><span className="ds-style-prop">font-size:</span> <code>16px</code></li>
                <li><span className="ds-style-prop">font-weight:</span> <code>500</code></li>
                <li><span className="ds-style-prop">transition:</span> <code>all 0.15s</code></li>
                <li><span className="ds-style-prop">background:</span> <code>var(--primary)</code></li>
                <li><span className="ds-style-prop">border:</span> <code>1px solid var(--primary)</code></li>
                <li><span className="ds-style-prop">color:</span> <code>#ffffff</code></li>
                <li><span className="ds-style-prop">hover background:</span> <code>var(--stone-800)</code></li>
                <li><span className="ds-style-prop">hover border:</span> <code>var(--stone-800)</code></li>
                <li><span className="ds-style-prop">disabled background:</span> <code>var(--tertiary)</code></li>
                <li><span className="ds-style-prop">disabled border:</span> <code>var(--tertiary)</code></li>
                <li><span className="ds-style-prop">disabled color:</span> <code>#ffffff</code></li>
              </ul>
            </div>
          </div>
        </section>
        )}

      </div>
    </div>
  );
}
