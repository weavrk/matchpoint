import { useState, useMemo } from 'react';
import { BadgeCheck, Search, MapPin } from 'lucide-react';
import type { MatchedWorker } from '../../types';
import { getWorkerPhoto } from '../../hooks/useWorkerPhoto';
import './WorkerCard.css';

interface WorkerCardHeaderProps {
  worker: MatchedWorker;
  size?: 'default' | 'large';
  showActivelyLooking?: boolean;
}

interface WorkerCardHeaderFullProps {
  worker: MatchedWorker;
  showActivelyLooking?: boolean;
}

/**
 * WorkerCardHeaderFull - Centered avatar layout for full card view
 * Avatar at top center, name and location below, tags below that
 */
export function WorkerCardHeaderFull({ worker, showActivelyLooking = true }: WorkerCardHeaderFullProps) {
  const [imgError, setImgError] = useState(false);

  // Get photo from final photos pool based on gender - cached by worker ID
  const assignedPhoto = useMemo(() => {
    if (worker.gender) {
      return getWorkerPhoto(worker.gender, worker.id);
    }
    return null;
  }, [worker.gender, worker.id]);

  // Use assigned photo, fall back to worker.photo, then initials
  const photoUrl = assignedPhoto || worker.photo;

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

  const hasTags = worker.shiftVerified || (showActivelyLooking && worker.activelyLooking);

  return (
    <div className="worker-card-header-full">
      <div className="worker-header-full-avatar">
        {photoUrl && !imgError ? (
          <img
            src={photoUrl}
            alt={worker.name}
            onError={() => setImgError(true)}
          />
        ) : (
          <span>{initials}</span>
        )}
      </div>

      <h3 className="worker-header-full-name">{displayName}</h3>

      {marketDisplay && (
        <div className="worker-header-full-location">
          <MapPin size={14} />
          <span>{marketDisplay}</span>
        </div>
      )}

      {hasTags && (
        <div className="worker-header-full-tags">
          {worker.shiftVerified && (
            <span className="tag tag-blue-light tag-sm">
              <span className="tag-icon"><BadgeCheck size={12} /></span>
              <span className="tag-text">Shift Verified</span>
            </span>
          )}

          {showActivelyLooking && worker.activelyLooking && (
            <span className="tag tag-blue tag-sm">
              <span className="tag-icon"><Search size={12} /></span>
              <span className="tag-text">Actively Looking</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function WorkerCardHeader({ worker, size = 'default', showActivelyLooking = true }: WorkerCardHeaderProps) {
  const [imgError, setImgError] = useState(false);

  // Get photo from final photos pool based on gender - cached by worker ID
  const assignedPhoto = useMemo(() => {
    if (worker.gender) {
      return getWorkerPhoto(worker.gender, worker.id);
    }
    return null;
  }, [worker.gender, worker.id]);

  // Use assigned photo, fall back to worker.photo, then initials
  const photoUrl = assignedPhoto || worker.photo;

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

  const avatarSize = size === 'large' ? 64 : 54;

  const hasTags = worker.shiftVerified || (showActivelyLooking && worker.activelyLooking);

  return (
    <div className="worker-card-header">
      <div className="worker-header-content">
        <div className="worker-header-left">
          <div className="worker-avatar" style={{ width: avatarSize, height: avatarSize }}>
            {photoUrl && !imgError ? (
              <img
                src={photoUrl}
                alt={worker.name}
                onError={() => setImgError(true)}
              />
            ) : (
              <span>{initials}</span>
            )}
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
        </div>

        {hasTags && (
          <div className="worker-header-tags">
            {worker.shiftVerified && (
              <span className="tag tag-blue-light tag-sm">
                <span className="tag-icon"><BadgeCheck size={12} /></span>
                <span className="tag-text">Shift Verified</span>
              </span>
            )}

            {showActivelyLooking && worker.activelyLooking && (
              <span className="tag tag-blue tag-sm">
                <span className="tag-icon"><Search size={12} /></span>
                <span className="tag-text">Actively Looking</span>
              </span>
            )}
          </div>
        )}
      </div>
      <div className="worker-header-divider" />
    </div>
  );
}
