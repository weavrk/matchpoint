import { useState, useMemo, useEffect } from 'react';
import { BadgeCheck, Search, MapPin, Heart, Link, Check } from 'lucide-react';
import type { MatchedWorker } from '../../types';
import { getWorkerPhoto } from '../../hooks/useWorkerPhoto';
import './WorkerCard.css';

interface WorkerCardHeaderProps {
  worker: MatchedWorker;
  size?: 'default' | 'large';
  showActivelyLooking?: boolean;
  showLocation?: boolean;
  compact?: boolean;
  /** Show like + connect action buttons in header */
  showActions?: boolean;
  isConnected?: boolean;
  isLiked?: boolean;
  onLike?: () => void;
  onUnlike?: () => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
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

  // Use worker.photo if available, otherwise assign from pool
  const photoUrl = useMemo(() => {
    if (worker.photo) return worker.photo;
    if (worker.gender) return getWorkerPhoto(worker.gender, worker.id);
    return null;
  }, [worker.photo, worker.gender, worker.id]);

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

      {hasTags && (
        <div className="worker-header-full-tags">
          {worker.shiftVerified && (
            <span className="tag tag-blue-light tag-sm">
              <span className="tag-icon"><BadgeCheck size={12} /></span>
              <span className="tag-text">Shift Verified</span>
            </span>
          )}

          {showActivelyLooking && worker.activelyLooking && (
            <span className="tag tag-blue-light tag-sm">
              <span className="tag-icon"><Search size={12} /></span>
              <span className="tag-text">Actively Looking</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function WorkerCardHeader({ worker, size = 'default', showActivelyLooking = true, showLocation = true, compact = false, showActions = false, isConnected = false, isLiked = false, onLike, onUnlike, onConnect, onDisconnect }: WorkerCardHeaderProps) {
  const [imgError, setImgError] = useState(false);
  const [connectAnim, setConnectAnim] = useState<'idle' | 'animating' | 'done'>(isConnected ? 'done' : 'idle');
  const [likeAnim, setLikeAnim] = useState<'idle' | 'animating' | 'done'>(isLiked ? 'done' : 'idle');

  // Sync external state
  useEffect(() => { setConnectAnim(isConnected ? 'done' : 'idle'); }, [isConnected]);
  useEffect(() => { setLikeAnim(isLiked ? 'done' : 'idle'); }, [isLiked]);

  // Use worker.photo if available, otherwise assign from pool
  const photoUrl = useMemo(() => {
    if (worker.photo) return worker.photo;
    if (worker.gender) return getWorkerPhoto(worker.gender, worker.id);
    return null;
  }, [worker.photo, worker.gender, worker.id]);

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

  const avatarSize = compact ? 36 : (size === 'large' ? 64 : 54);

  const hasTags = worker.shiftVerified || (showActivelyLooking && worker.activelyLooking);

  const handleConnect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectAnim === 'animating') return;
    if (connectAnim === 'done') {
      setConnectAnim('idle');
      onDisconnect?.();
      return;
    }
    setConnectAnim('animating');
    onConnect?.();
    setTimeout(() => setConnectAnim('done'), 600);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (likeAnim === 'animating') return;
    if (likeAnim === 'done') {
      setLikeAnim('idle');
      onUnlike?.();
      return;
    }
    setLikeAnim('animating');
    onLike?.();
    setTimeout(() => setLikeAnim('done'), 600);
  };

  return (
    <div className={`worker-card-header${compact ? ' compact' : ''}`}>
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
            <h3 className={compact ? 'worker-header-name worker-header-name-compact' : 'worker-header-name'}>{displayName}</h3>
            {showLocation && marketDisplay && (
              <div className="worker-header-location">
                <MapPin size={14} />
                <span>{marketDisplay}</span>
              </div>
            )}
            {hasTags && (
              <div className="worker-header-tags row">
                {worker.shiftVerified && (
                  <span className="tag tag-blue-light tag-xs">
                    <span className="tag-icon"><BadgeCheck size={10} /></span>
                    <span className="tag-text">Shift Verified</span>
                  </span>
                )}
                {showActivelyLooking && worker.activelyLooking && (
                  <span className="tag tag-blue-light tag-xs">
                    <span className="tag-icon"><Search size={10} /></span>
                    <span className="tag-text">Actively Looking</span>
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {showActions && (
          <div className="worker-header-actions">
            <button
              className={`worker-action-btn${connectAnim === 'animating' ? ' connect-animating' : ''}${connectAnim === 'done' ? ' action-done' : ''}`}
              onClick={handleConnect}
              aria-label="Connect"
            >
              {connectAnim === 'idle' && <Link size={16} />}
              {connectAnim === 'animating' && (
                <span className="action-burst">
                  <Check size={16} strokeWidth={3} />
                </span>
              )}
              {connectAnim === 'done' && <Check size={16} strokeWidth={3} />}
            </button>
            <button
              className={`worker-action-btn${likeAnim === 'animating' ? ' like-animating' : ''}${likeAnim === 'done' ? ' action-done' : ''}`}
              onClick={handleLike}
              aria-label="Like"
            >
              {likeAnim === 'idle' && <Heart size={16} />}
              {likeAnim === 'animating' && (
                <span className="action-heart-pop">
                  <Heart size={18} fill="currentColor" />
                </span>
              )}
              {likeAnim === 'done' && <Check size={16} strokeWidth={3} />}
            </button>
          </div>
        )}
      </div>
      <div className="worker-header-divider" />
    </div>
  );
}
