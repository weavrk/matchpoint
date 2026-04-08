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

/**
 * WorkerCardCompact - Compact teaser card for grids and chat view
 * Order: Header → Stats → Achievement Chips → About Me → Reflex Brand Experience
 */
export function WorkerCardCompact({ worker, onClick, onLike, onUnlike, onConnect, onDisconnect, isConnected, isLiked }: WorkerCardCompactProps) {
  const brandsWorked = worker.brandsWorked || [];
  // Derive minimum store count: use DB value, or fall back to brands worked count
  const storeCount = (worker.uniqueStoreCount && worker.uniqueStoreCount > 0)
    ? worker.uniqueStoreCount
    : brandsWorked.length > 0 ? brandsWorked.length : null;

  return (
    <div className="worker-card worker-card-compact" onClick={onClick}>
      <WorkerCardHeader worker={worker} showActivelyLooking={true} showLocation={false} showActions onLike={onLike} onUnlike={onUnlike} onConnect={onConnect} onDisconnect={onDisconnect} isConnected={isConnected} isLiked={isLiked} />

      <div className="worker-card-body">
        {/* Stats: Shifts + Store Locations */}
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

        {/* Achievement Chips */}
        <WorkerAchievementChips worker={worker} />

        {/* About Me */}
        {worker.aboutMe && (
          <div className="compact-section">
            <p className="compact-about">{worker.aboutMe}</p>
          </div>
        )}

        {/* Reflex Brand Experience - logos */}
        {brandsWorked.length > 0 && (
          <div className="compact-section">
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
          </div>
        )}
      </div>
    </div>
  );
}
