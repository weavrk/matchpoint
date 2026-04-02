import { Check, Plus, UserStar, CalendarDays, BadgeCheck, Search } from 'lucide-react';

interface DesignSystemPanelProps {
  onClose: () => void;
}

export function DesignSystemPanel({ onClose }: DesignSystemPanelProps) {
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
            <div className="ds-color-grid">
              <div className="ds-color-swatch">
                <h4>Brand</h4>
                <div className="ds-swatch" style={{ background: 'var(--brand-pink)' }} />
                <span className="ds-color-name">--brand-pink</span>
                <span className="ds-color-value">#ff9a9a</span>
              </div>
              <div className="ds-color-swatch">
                <h4>Primary</h4>
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
                <span>Sales Associate</span>
                <span className="chip-icon"></span>
              </button>
              <button className="ds-chip-demo message-chip-single type-chip-label selected" type="button">
                <span>Store Manager</span>
                <span className="chip-icon"><Check size={14} /></span>
              </button>
            </div>
          </div>

          <div className="ds-subsection">
            <h4>4. MessageChip variant="multi"</h4>
            <p className="ds-description">Multi-select options with plus/check icon on right</p>
            <div className="ds-example ds-example-list">
              <button className="ds-chip-demo message-chip-multi type-chip-label" type="button">
                <span>Customer Engagement</span>
                <span className="chip-icon"><Plus size={14} /></span>
              </button>
              <button className="ds-chip-demo message-chip-multi type-chip-label selected" type="button">
                <span>Self-Starter</span>
                <span className="chip-icon"><Check size={14} /></span>
              </button>
            </div>
          </div>
        </section>

        {/* Pills / Tags Section */}
        <section className="ds-section">
          <h3>Pills / Tags</h3>
          <p className="ds-description">
            Usage: <code>className="pill pill-[style] pill-[size]"</code>
          </p>

          <div className="ds-subsection">
            <h4>Styles</h4>
            <div className="ds-pills-styles-row">
              <span className="pill pill-stroke pill-md"><span className="pill-text">Stroke</span></span>
              <span className="pill pill-lite-gray pill-md"><span className="pill-text">Lite Gray</span></span>
              <span className="pill pill-dark-gray pill-md"><span className="pill-text">Dark Gray</span></span>
              <span className="pill pill-green pill-md"><span className="pill-text">Green</span></span>
              <span className="pill pill-blue pill-md"><span className="pill-text">Blue</span></span>
            </div>
          </div>

          <div className="ds-subsection">
            <h4>Variants</h4>
            <div className="ds-pills-styles-row">
              <span className="pill pill-stroke pill-md"><span className="pill-text">Text Only</span></span>
              <span className="pill pill-stroke pill-md"><span className="pill-icon"><CalendarDays size={14} /></span><span className="pill-text">Icon Left</span></span>
              <span className="pill pill-stroke pill-md"><span className="pill-text">Icon Right</span><span className="pill-icon"><CalendarDays size={14} /></span></span>
              <span className="pill pill-stroke pill-md"><span className="pill-counter">3</span><span className="pill-text">Counter Left</span></span>
              <span className="pill pill-stroke pill-md"><span className="pill-text">Counter Right</span><span className="pill-counter">3</span></span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
