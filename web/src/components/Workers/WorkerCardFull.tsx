import { useState, useEffect } from 'react';
import { Link, Heart, Check } from 'lucide-react';
import type { MatchedWorker } from '../../types';
import { WorkerCardHeaderFull } from './WorkerCardHeader';
import { WorkerAchievementChips } from './WorkerAchievementChips';
import { brandLogoNeedsGridInset, getBrandLogo } from '../../utils/brandLogos';
import './WorkerCard.css';

interface WorkerCardFullProps {
  worker: MatchedWorker;
  onClose?: () => void;
  showActions?: boolean;
  isConnected?: boolean;
  isLiked?: boolean;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onLike?: () => void;
  onUnlike?: () => void;
}

const toTitleCase = (str: string) => {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

export function WorkerCardFull({ worker, showActions = false, isConnected = false, isLiked = false, onConnect, onDisconnect, onLike, onUnlike }: WorkerCardFullProps) {
  const [connectState, setConnectState] = useState<'idle' | 'animating' | 'done'>(isConnected ? 'done' : 'idle');
  const [likeState, setLikeState] = useState<'idle' | 'animating' | 'done'>(isLiked ? 'done' : 'idle');

  useEffect(() => { setConnectState(isConnected ? 'done' : 'idle'); }, [isConnected]);
  useEffect(() => { setLikeState(isLiked ? 'done' : 'idle'); }, [isLiked]);

  const handleConnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectState === 'animating') return;
    if (connectState === 'done') { setConnectState('idle'); onDisconnect?.(); return; }
    setConnectState('animating');
    onConnect?.();
    setTimeout(() => setConnectState('done'), 600);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (likeState === 'animating') return;
    if (likeState === 'done') { setLikeState('idle'); onUnlike?.(); return; }
    setLikeState('animating');
    onLike?.();
    setTimeout(() => setLikeState('done'), 600);
  };
  const shiftExperienceEntries = worker.shiftExperience
    ? Object.entries(worker.shiftExperience).sort((a, b) => b[1] - a[1])
    : [];

  const endorsementEntries = worker.endorsementCounts
    ? Object.entries(worker.endorsementCounts).filter(([name]) => name.toLowerCase() !== 'all around').sort((a, b) => b[1] - a[1])
    : [];

  // Dedupe previous experience
  const previousExperience = (() => {
    const seen = new Set<string>();
    return (worker.previousExperience || []).filter(exp => {
      const roles = exp.roles.filter(r => r && r.toLowerCase() !== 'unknown').join(', ');
      if (!roles) return false;
      const key = `${exp.company}|${roles}|${exp.duration}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();

  return (
    <div className="worker-card worker-card-testing worker-card-full-content">
      {showActions && (
        <div className="worker-full-actions">
          <button
            className={`worker-action-btn${connectState === 'animating' ? ' connect-animating' : ''}${connectState === 'done' ? ' action-done' : ''}`}
            onClick={handleConnect}
            aria-label="Connect"
          >
            {connectState === 'idle' && <Link size={16} />}
            {connectState === 'animating' && <span className="action-burst"><Check size={16} strokeWidth={3} /></span>}
            {connectState === 'done' && <Check size={16} strokeWidth={3} />}
          </button>
          <button
            className={`worker-action-btn${likeState === 'animating' ? ' like-animating' : ''}${likeState === 'done' ? ' action-done' : ''}`}
            onClick={handleLike}
            aria-label="Save"
          >
            {likeState === 'idle' && <Heart size={16} />}
            {likeState === 'animating' && <span className="action-heart-pop"><Heart size={18} fill="currentColor" /></span>}
            {likeState === 'done' && <Check size={16} strokeWidth={3} />}
          </button>
        </div>
      )}
      <WorkerCardHeaderFull worker={worker} />

      <div className="card-sections">
        {/* 1. Stats + Achievement Chips */}
        <div className="card-section-item">
          <div className="compact-stats">
            <span className="tag tag-stroke tag-sm">
              <span className="tag-counter">{worker.shiftsOnReflex}</span>
              <span className="tag-text">{worker.shiftsOnReflex === 1 ? 'Shift' : 'Shifts'}</span>
            </span>
            {worker.uniqueStoreCount != null && worker.uniqueStoreCount > 0 && (
              <span className="tag tag-stroke tag-sm">
                <span className="tag-counter">{worker.uniqueStoreCount}</span>
                <span className="tag-text">{worker.uniqueStoreCount === 1 ? 'Store Location' : 'Store Locations'}</span>
              </span>
            )}
          </div>
          <WorkerAchievementChips worker={worker} />
        </div>

        {/* 2. About */}
        {worker.aboutMe && (
          <div className="card-section-item">
            <span className="testing-label">About</span>
            <p className="testing-about">{worker.aboutMe}</p>
          </div>
        )}

        {/* 3. Reflex Experience (shift pills + brand logos) */}
        {(shiftExperienceEntries.length > 0 || worker.brandsWorked.length > 0) && (
          <div className="card-section-item">
            {shiftExperienceEntries.length > 0 && (
              <>
                <span className="testing-label">Reflex Experience</span>
                <div className="testing-pills">
                  {shiftExperienceEntries.map(([name, count], idx) => (
                    <span key={idx} className="tag tag-blue-light tag-sm">
                      <span className="tag-text">{name}</span>
                      <span className="tag-counter">{count}</span>
                    </span>
                  ))}
                </div>
              </>
            )}
            {worker.brandsWorked.length > 0 && (
              <div className="brand-logo-grid">
                {(() => {
                  const seen = new Set<string>();
                  return worker.brandsWorked.map((brand, idx) => {
                    const logo = getBrandLogo(brand.name);
                    const key = logo || brand.name.toLowerCase();
                    if (seen.has(key)) return null;
                    seen.add(key);
                    return logo ? (
                      <span
                        key={idx}
                        className={`tag-logo${brandLogoNeedsGridInset(brand.name) ? ' tag-logo-grid-inset' : ''}`}
                      >
                        <img src={logo} alt={brand.name} />
                      </span>
                    ) : (
                      <span key={idx} className="brand-logo-fallback">
                        {toTitleCase(brand.name)}
                      </span>
                    );
                  });
                })()}
              </div>
            )}
          </div>
        )}

        {/* 5. Other Retail Experience */}
        {previousExperience.length > 0 && (
          <div className="card-section-item">
            <span className="testing-label">Other Retail Experience</span>
            <div className="testing-data">
              {previousExperience.map((exp, idx) => {
                const roles = exp.roles.filter(r => r && r.toLowerCase() !== 'unknown').join(', ');
                return (
                  <div key={idx} className="testing-row">
                    <span className="testing-key">{roles}</span>
                    {exp.duration && ` (${exp.duration})`}
                    {exp.company && `: ${exp.company}`}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. Retailer Summary + Store Team Reviews */}
        {(worker.retailerSummary || (worker.retailerQuotes && worker.retailerQuotes.length > 0)) && (
          <div className="card-section-item">
            {worker.retailerSummary && (
              <>
                <span className="testing-label">What Stores Say About {worker.name.split(' ')[0]}</span>
                <p className="testing-about">{worker.retailerSummary}</p>
              </>
            )}
            {worker.retailerQuotes && worker.retailerQuotes.length > 0 && (
              <>
                <span className="testing-label">Store Team Reviews</span>
                <div className="testing-data">
                  {(() => {
                    const seenBrands = new Set<string>();
                    return worker.retailerQuotes.map((quote, idx) => {
                      const brandKey = (quote.brand || '').toLowerCase();
                      if (seenBrands.has(brandKey)) return null;
                      seenBrands.add(brandKey);
                      const brandLogo = getBrandLogo(quote.brand);
                    return (
                      <div key={idx} className="testing-quote">
                        <div className="quote-mark-container">
                          <span className="quote-open-mark">{'\u201C'}</span>
                        </div>
                        <div className="quote-content">
                          <p className="quote-text">{quote.quote}</p>
                          {quote.role && <span className="quote-role">{quote.reviewerName ? `${quote.reviewerName}, ` : ''}{quote.role}</span>}
                        </div>
                        <div className="quote-logo-container">
                          {brandLogo && <img src={brandLogo} alt={quote.brand} className="quote-brand-logo" />}
                          {!brandLogo && quote.brand && <span className="quote-brand-text">{quote.brand}</span>}
                        </div>
                      </div>
                    );
                  });
                  })()}
                </div>
              </>
            )}
          </div>
        )}

        {/* 8. Endorsements */}
        {endorsementEntries.length > 0 && (
          <div className="card-section-item">
            <span className="testing-label">Endorsements</span>
            <div className="testing-pills">
              {endorsementEntries.map(([name, count], idx) => (
                <span key={idx} className="tag tag-stroke tag-sm">
                  <span className="tag-text">{name}</span>
                  <span className="tag-counter">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
