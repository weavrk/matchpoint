import type { MatchedWorker } from '../../types';
import { WorkerCardHeader } from './WorkerCardHeader';
import { WorkerAchievementChips } from './WorkerAchievementChips';
import { getBrandLogo, brandLogoNeedsGridInset } from '../../utils/brandLogos';

interface WorkerCardCompactProps {
  worker: MatchedWorker;
  onClick?: () => void;
  onLike?: () => void;
  onUnlike?: () => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  isConnected?: boolean;
  isLiked?: boolean;
}

const toTitleCase = (str: string) => {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

export function WorkerCardCompact({ worker, onClick, onLike, onUnlike, onConnect, onDisconnect, isConnected, isLiked }: WorkerCardCompactProps) {
  const brandsWorked = worker.brandsWorked || [];
  const storeCount = (worker.uniqueStoreCount && worker.uniqueStoreCount > 0)
    ? worker.uniqueStoreCount
    : brandsWorked.length > 0 ? brandsWorked.length : null;

  return (
    <div className="worker-card worker-card-compact" onClick={onClick}>
      <WorkerCardHeader worker={worker} showActivelyLooking={true} showLocation={false} showActions onLike={onLike} onUnlike={onUnlike} onConnect={onConnect} onDisconnect={onDisconnect} isConnected={isConnected} isLiked={isLiked} />

      <div className="card-sections">
        {/* Section 1: Stats + Achievement Chips */}
        <div className="card-section-item">
          {worker.shiftVerified && (
            <div className="compact-stats">
              <span className="tag tag-stroke tag-sm">
                <span className="tag-counter">{worker.shiftsOnReflex}</span>
                <span className="tag-text">{worker.shiftsOnReflex === 1 ? 'Shift' : 'Shifts'}</span>
              </span>
              {storeCount != null && storeCount > 0 && (
                <span className="tag tag-stroke tag-sm">
                  <span className="tag-counter">{storeCount}</span>
                  <span className="tag-text">{storeCount === 1 ? 'Store Location' : 'Store Locations'}</span>
                </span>
              )}
            </div>
          )}
          <WorkerAchievementChips worker={worker} />
          {brandsWorked.length > 0 && (
            <>
              <span className="section-label">Reflex Brand Experience</span>
              <div className="brand-logo-grid">
                {brandsWorked.map((brand, idx) => {
                  const logo = getBrandLogo(brand.name);
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
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
