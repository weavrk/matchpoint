import {
  BadgeCheck,
  MapPin,
  Clock,
  MessageSquare,
  Sparkles,
  CheckSquare,
  Users,
  Timer,
  TrendingUp,
  Target,
  Heart,
  Zap,
  RotateCcw,
} from 'lucide-react';
import type { MatchedWorker, Endorsement } from '../../types';
import './WorkerCard.css';

const ENDORSEMENT_CONFIG: Record<Endorsement, { icon: React.ReactNode; label: string }> = {
  'customer-engagement': { icon: <MessageSquare size={14} />, label: 'Customer Engagement' },
  'self-starter': { icon: <Sparkles size={14} />, label: 'Self-Starter' },
  'preparedness': { icon: <CheckSquare size={14} />, label: 'Preparedness' },
  'perfect-attire': { icon: <Users size={14} />, label: 'Perfect Attire' },
  'work-pace': { icon: <Timer size={14} />, label: 'Work Pace' },
  'productivity': { icon: <TrendingUp size={14} />, label: 'Productivity' },
  'attention-to-detail': { icon: <Target size={14} />, label: 'Attention to Detail' },
  'team-player': { icon: <Users size={14} />, label: 'Team Player' },
  'positive-attitude': { icon: <Heart size={14} />, label: 'Positive Attitude' },
  'adaptable': { icon: <Zap size={14} />, label: 'Adaptable' },
};

interface WorkerCardProps {
  worker: MatchedWorker;
}

export function WorkerCard({ worker }: WorkerCardProps) {
  const initials = worker.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div className="worker-card">
      <div className="worker-card-header">
        <div className="worker-avatar">
          {worker.photo ? (
            <img src={worker.photo} alt={worker.name} />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <div className="worker-header-info">
          <div className="worker-name-row">
            <h3 className="worker-name">{worker.name}</h3>
            {worker.shiftVerified && (
              <span className="shift-verified-badge">
                <BadgeCheck size={14} />
                Shift Verified
              </span>
            )}
          </div>
          <div className="worker-meta">
            <span className="worker-meta-item">
              <MapPin size={14} />
              {worker.market}
            </span>
            <span className="worker-meta-item">
              <Clock size={14} />
              {worker.preference === 'Both' ? 'FT / PT' : worker.preference}
            </span>
          </div>
        </div>
        <div className="worker-match-score">
          <span className="match-score-value">{worker.matchScore}</span>
          <span className="match-score-label">Match</span>
        </div>
      </div>

      <div className="worker-card-body">
        <p className="worker-about">{worker.about}</p>

        <div className="worker-stats">
          {worker.shiftsOnReflex > 0 && (
            <div className="worker-stat">
              <span className="stat-value">{worker.shiftsOnReflex}</span>
              <span className="stat-label">Shifts on Reflex</span>
            </div>
          )}
          {worker.invitedBackStores > 0 && (
            <div className="worker-stat">
              <RotateCcw size={14} />
              <span className="stat-label">Invited back: {worker.invitedBackStores} stores</span>
            </div>
          )}
          {worker.onTimeRating && (
            <div className="worker-stat exceptional">
              <span className="stat-label">On-time: {worker.onTimeRating}</span>
            </div>
          )}
          {worker.commitmentScore && (
            <div className="worker-stat exceptional">
              <span className="stat-label">Commitment: {worker.commitmentScore}</span>
            </div>
          )}
        </div>

        {worker.brandsWorked.length > 0 && (
          <div className="worker-brands">
            <span className="brands-label">Brands:</span>
            <div className="brands-list">
              {worker.brandsWorked.slice(0, 4).map((brand, idx) => (
                <span key={idx} className={`brand-tag ${brand.tier}`}>
                  {brand.name}
                </span>
              ))}
              {worker.brandsWorked.length > 4 && (
                <span className="brand-tag more">+{worker.brandsWorked.length - 4}</span>
              )}
            </div>
          </div>
        )}

        {worker.endorsements.length > 0 && (
          <div className="worker-endorsements">
            {worker.endorsements.slice(0, 5).map((endorsement, idx) => (
              <span key={idx} className="endorsement-badge">
                {ENDORSEMENT_CONFIG[endorsement]?.icon}
                {ENDORSEMENT_CONFIG[endorsement]?.label}
              </span>
            ))}
          </div>
        )}

        {worker.matchReasons.length > 0 && (
          <div className="worker-match-reasons">
            {worker.matchReasons.map((reason, idx) => (
              <span key={idx} className="match-reason">
                {reason}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
