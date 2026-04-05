import type { MatchedWorker, WorkerProfile } from '../../types';
import { WorkerAchievementChips } from './WorkerAchievementChips';
import './WorkerCard.css';

interface WorkerCardChipProps {
  worker: MatchedWorker | WorkerProfile;
  onClick?: () => void;
}

/**
 * WorkerCardChip - Minimal horizontal chip showing avatar, name, and stats.
 * Used for inline mentions, selection lists, and compact displays.
 *
 * Layout: Avatar + Name in a row (vertically centered), achievement chips below
 */
export function WorkerCardChip({ worker, onClick }: WorkerCardChipProps) {
  // Format name as "First L."
  const nameParts = worker.name.split(' ');
  const displayName = nameParts.length > 1
    ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
    : nameParts[0];

  // Get initials
  const initials = worker.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  // Get unique store locations count
  const storeLocations = worker.uniqueStoreCount || 0;

  return (
    <div
      className={`worker-card-chip ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="chip-header">
        <div className="chip-avatar">
          {worker.photo ? (
            <img src={worker.photo} alt="" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <span className="chip-name">{displayName}</span>
      </div>
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
  );
}
