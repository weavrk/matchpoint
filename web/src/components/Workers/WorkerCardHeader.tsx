import { BadgeCheck, Search, MapPin } from 'lucide-react';
import type { MatchedWorker } from '../../types';

interface WorkerCardHeaderProps {
  worker: MatchedWorker;
  size?: 'default' | 'large';
  showActivelyLooking?: boolean;
}

export function WorkerCardHeader({ worker, size = 'default', showActivelyLooking = true }: WorkerCardHeaderProps) {
  const initials = worker.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  // Format name as "First L."
  const nameParts = worker.name.split(' ');
  const displayName = nameParts.length > 1
    ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
    : nameParts[0];

  // Format market - comma separated if multiple
  const marketDisplay = Array.isArray(worker.market)
    ? worker.market.join(', ')
    : worker.market;

  const avatarSize = size === 'large' ? 56 : 40;

  const hasTags = worker.shiftVerified || (showActivelyLooking && worker.activelyLooking);

  return (
    <div className="worker-card-header">
      <div className="worker-header-content">
        <div className="worker-avatar" style={{ width: avatarSize, height: avatarSize }}>
          {worker.photo ? <img src={worker.photo} alt={worker.name} /> : <span>{initials}</span>}
        </div>

        <div className="worker-name-section">
          <h3 className="worker-header-name">{displayName}</h3>
          {marketDisplay && (
            <div className="worker-header-location">
              <MapPin size={14} />
              <span>{marketDisplay}</span>
            </div>
          )}
        </div>

        {hasTags && (
          <div className="worker-header-tags">
            {worker.shiftVerified && (
              <span className="tag tag-green tag-sm">
                <span className="tag-icon"><BadgeCheck size={12} /></span>
                <span className="tag-text">Shift Verified</span>
              </span>
            )}

            {showActivelyLooking && worker.activelyLooking && (
              <span className="tag tag-lite-gray tag-sm">
                <span className="tag-icon"><Search size={12} /></span>
                <span className="tag-text">Actively looking</span>
              </span>
            )}
          </div>
        )}
      </div>
      <div className="worker-header-divider" />
    </div>
  );
}
