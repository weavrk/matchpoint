import type { MatchedWorker, WorkerProfile } from '../../types';
import { WorkerCardHeader } from './WorkerCardHeader';
import { WorkerAchievementChips } from './WorkerAchievementChips';
import './WorkerCard.css';

interface WorkerCardChipProps {
  worker: MatchedWorker | WorkerProfile;
  onClick?: () => void;
}

/**
 * WorkerCardChip - Compact card showing the shared header (compact mode) + stats + achievement chips.
 * Used for inline mentions, selection lists, and compact displays.
 */
export function WorkerCardChip({ worker, onClick }: WorkerCardChipProps) {
  const storeLocations = worker.uniqueStoreCount || 0;

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
      />
      <div className="chip-body">
        <div className="chip-stats">
          <span className="tag tag-stroke tag-md">
            <span className="tag-counter">{worker.shiftsOnReflex}</span>
            <span className="tag-text">Shifts</span>
          </span>
          <span className="tag tag-stroke tag-md">
            <span className="tag-counter">{storeLocations}</span>
            <span className="tag-text">Store Locations</span>
          </span>
        </div>
        <WorkerAchievementChips worker={worker} />
      </div>
    </div>
  );
}
