import { useState } from 'react';
import { Sparkles, Link, Lightbulb } from 'lucide-react';
import './styles.css';

type TabId = 'experiment' | 'ideas';

export function V3Wildcard() {
  const [activeTab, setActiveTab] = useState<TabId>('experiment');

  return (
    <div className="v3-page">
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
          className={`tab ${activeTab === 'experiment' ? 'active' : ''}`}
          onClick={() => setActiveTab('experiment')}
        >
          Experiment
        </button>
        <button
          className={`tab ${activeTab === 'ideas' ? 'active' : ''}`}
          onClick={() => setActiveTab('ideas')}
        >
          Ideas Backlog
        </button>
      </nav>

      {activeTab === 'experiment' && (
        <div className="variant-placeholder">
          <div className="variant-placeholder-content">
            <Sparkles size={48} strokeWidth={1.5} />
            <h1>V3: Wildcard</h1>
            <p>Experimental space for unconventional approaches. Break the rules, try something weird.</p>
            <div className="variant-placeholder-ideas">
              <h3>Wild ideas:</h3>
              <ul>
                <li>Tinder-style swipe matching</li>
                <li>AI-generated job posts from conversation</li>
                <li>Reverse job board - workers post availability</li>
                <li>Team composition builder</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ideas' && (
        <div className="tab-empty-state">
          <div className="empty-state-content">
            <Lightbulb size={32} strokeWidth={1.5} />
            <p>Ideas backlog coming soon</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default V3Wildcard;
