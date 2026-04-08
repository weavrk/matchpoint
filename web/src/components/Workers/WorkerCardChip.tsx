import type { MatchedWorker, WorkerProfile } from '../../types';
import { WorkerCardHeader } from './WorkerCardHeader';
import { WorkerAchievementChips } from './WorkerAchievementChips';
import './WorkerCard.css';

interface WorkerCardChipProps {
  worker: MatchedWorker | WorkerProfile;
  onClick?: () => void;
  onLike?: () => void;
  onConnect?: () => void;
  isConnected?: boolean;
  isLiked?: boolean;
}

export function WorkerCardChip({ worker, onClick, onLike, onConnect, isConnected, isLiked }: WorkerCardChipProps) {
  const brandsWorked = worker.brandsWorked || [];
  const storeCount = (worker.uniqueStoreCount != null && worker.uniqueStoreCount > 0)
    ? worker.uniqueStoreCount
    : brandsWorked.length > 0 ? brandsWorked.length : null;

  return (
    <div
      className={`worker-card-chip ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <WorkerCardHeader
        worker={worker as MatchedWorker}
        compact
        showLocation={false}
        showActions
        onLike={onLike}
        onConnect={onConnect}
        isConnected={isConnected}
        isLiked={isLiked}
      />
      <div className="card-sections">
        <div className="card-section-item">
          <div className="chip-stats">
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
          <WorkerAchievementChips worker={worker} />
        </div>
      </div>
    </div>
  );
}
