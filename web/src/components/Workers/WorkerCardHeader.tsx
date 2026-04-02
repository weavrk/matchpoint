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

  const avatarSize = size === 'large' ? 56 : 40;
  const nameSize = size === 'large' ? 'worker-name-lg' : '';

  return (
    <div className="worker-card-header">
      <div className="worker-avatar" style={{ width: avatarSize, height: avatarSize }}>
        {worker.photo ? <img src={worker.photo} alt={worker.name} /> : <span>{initials}</span>}
      </div>

      <div className="worker-name-section">
        <h3 className={`worker-name type-section-header-lg ${nameSize}`}>{worker.name}</h3>
        {worker.market && (
          <div className="worker-location">
            <MapPin size={16} />
            <span>{worker.market}</span>
          </div>
        )}
      </div>

      {worker.shiftVerified && (
        <span className="pill pill-green pill-sm">
          <span className="pill-icon"><BadgeCheck size={12} /></span>
          <span className="pill-text">Shift Verified</span>
        </span>
      )}

      {showActivelyLooking && worker.activelyLooking && (
        <span className="pill pill-lite-gray pill-sm">
          <span className="pill-icon"><Search size={12} /></span>
          <span className="pill-text">Actively looking</span>
        </span>
      )}
    </div>
  );
}
