import { BadgeCheck, Search } from 'lucide-react';
import type { MatchedWorker } from '../../types';

interface WorkerCardHeaderProps {
  worker: MatchedWorker;
  size?: 'default' | 'large';
}

export function WorkerCardHeader({ worker, size = 'default' }: WorkerCardHeaderProps) {
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

      <h3 className={`worker-name ${nameSize}`}>{worker.name}</h3>

      {worker.shiftVerified && (
        <span className="badge badge-verified">
          <BadgeCheck size={13} /> Shift Verified
        </span>
      )}

      {worker.activelyLooking && (
        <span className="badge badge-looking">
          <Search size={12} /> Actively looking
        </span>
      )}
    </div>
  );
}
