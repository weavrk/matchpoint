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
  Star,
  Search,
  Sun,
  Moon,
  CalendarDays,
  ShieldCheck,
  AlertCircle,
  Flame,
} from 'lucide-react';
import type { MatchedWorker, Endorsement } from '../../types';
import './WorkerCard.css';

const ENDORSEMENT_CONFIG: Record<Endorsement, { icon: React.ReactNode; label: string }> = {
  'customer-engagement': { icon: <MessageSquare size={13} />, label: 'Customer Engagement' },
  'self-starter':        { icon: <Sparkles size={13} />,      label: 'Self-Starter' },
  'preparedness':        { icon: <CheckSquare size={13} />,   label: 'Preparedness' },
  'perfect-attire':      { icon: <Users size={13} />,         label: 'Perfect Attire' },
  'work-pace':           { icon: <Timer size={13} />,         label: 'Work Pace' },
  'productivity':        { icon: <TrendingUp size={13} />,    label: 'Productivity' },
  'attention-to-detail': { icon: <Target size={13} />,        label: 'Attention to Detail' },
  'team-player':         { icon: <Users size={13} />,         label: 'Team Player' },
  'positive-attitude':   { icon: <Heart size={13} />,         label: 'Positive Attitude' },
  'adaptable':           { icon: <Zap size={13} />,           label: 'Adaptable' },
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

  const { reflexActivity, reliability, availability } = worker;

  const totalReflexShifts = reflexActivity
    ? reflexActivity.shiftsByTier.luxury + reflexActivity.shiftsByTier.elevated + reflexActivity.shiftsByTier.mid
    : 0;

  const specialtyShifts = reflexActivity
    ? reflexActivity.shiftsByTier.elevated + reflexActivity.shiftsByTier.mid
    : 0;
  const dominantTierLabel = reflexActivity
    ? reflexActivity.shiftsByTier.luxury > 0 &&
      reflexActivity.shiftsByTier.luxury >= specialtyShifts
      ? `${reflexActivity.shiftsByTier.luxury} luxury brand shifts`
      : specialtyShifts > 0
      ? `${specialtyShifts} specialty brand shifts`
      : reflexActivity.shiftsByTier.luxury > 0
      ? `${reflexActivity.shiftsByTier.luxury} luxury brand shifts`
      : null
    : null;

  const availabilityTags: { label: string; icon: React.ReactNode }[] = [];
  if (availability.weekends)      availabilityTags.push({ label: 'Weekends', icon: <CalendarDays size={12} /> });
  if (availability.openingShifts) availabilityTags.push({ label: 'Opening shifts', icon: <Sun size={12} /> });
  if (availability.closingShifts) availabilityTags.push({ label: 'Closing shifts', icon: <Moon size={12} /> });

  const hasReflexData = !!reflexActivity;

  return (
    <div className="worker-card">

      {/* ── Header ────────────────────────────────── */}
      <div className="worker-card-header">
        <div className="worker-avatar">
          {worker.photo ? <img src={worker.photo} alt={worker.name} /> : <span>{initials}</span>}
        </div>

        <div className="worker-header-info">
          <div className="worker-name-row">
            <h3 className="worker-name">{worker.name}</h3>
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
          <div className="worker-meta">
            <span className="worker-meta-item"><MapPin size={13} />{worker.market}</span>
            <span className="worker-meta-item"><Clock size={13} />{worker.preference === 'Both' ? 'FT / PT' : worker.preference}</span>
          </div>
        </div>

      </div>

      {/* ── Body ──────────────────────────────────── */}
      <div className="worker-card-body">

        {/* 1. About */}
        <p className="worker-about">{worker.about}</p>

        {/* 2. Work history */}
        {worker.previousExperience.length > 0 && (
          <>
            <div className="card-divider" />
            <div className="card-section">
              <span className="section-label">Work history</span>
              <div className="experience-list">
                {worker.previousExperience.map((exp, idx) => (
                  <div key={idx} className="experience-item">
                    <span className="exp-company">{exp.company}</span>
                    <span className="exp-detail">{exp.roles[0]} · {exp.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 3. Reflex record — grouped block */}
        {hasReflexData && (
          <>
            <div className="card-divider" />
            <div className="reflex-record">
              <span className="section-label reflex-record-label">On Reflex</span>

              {/* Activity summary */}
              <div className="reflex-activity-row">
                <span className="reflex-big-num">{totalReflexShifts}</span>
                <span className="reflex-big-label">shifts</span>
                {dominantTierLabel && <span className="reflex-dot">·</span>}
                {dominantTierLabel && <span className="reflex-tier-text">{dominantTierLabel}</span>}
                {reflexActivity?.longestRelationship && (
                  <>
                    <span className="reflex-dot">·</span>
                    <span className="reflex-tier-text">
                      {reflexActivity.longestRelationship.flexCount} with {reflexActivity.longestRelationship.brand}
                    </span>
                  </>
                )}
                {reflexActivity?.tierProgression === 'upward' && (
                  <span className="tier-up-badge">
                    <TrendingUp size={11} /> Tier progression
                  </span>
                )}
              </div>

              <div className="reflex-inner-divider" />

              {/* Reliability */}
              {reliability && (
                <div className="reliability-row">
                  <span className={`reliability-chip ${reliability.noShows === 0 ? 'good' : 'warn'}`}>
                    <ShieldCheck size={12} />
                    {reliability.noShows === 0 ? '0 no-shows' : `${reliability.noShows} no-show${reliability.noShows > 1 ? 's' : ''}`}
                  </span>
                  {reliability.cancellations === 0 && (
                    <span className="reliability-chip good">
                      <AlertCircle size={12} />
                      0 cancellations
                    </span>
                  )}
                  {reliability.lastMinuteFills >= 5 && (
                    <span className="reliability-chip good">
                      <Flame size={12} />
                      {reliability.lastMinuteFills} last-min fills
                    </span>
                  )}
                </div>
              )}

              {/* Store metrics */}
              <div className="reflex-metrics-row">
                {worker.invitedBackStores > 0 && (
                  <span className="reflex-metric">
                    <RotateCcw size={12} /> Invited back: {worker.invitedBackStores} stores
                  </span>
                )}
                {reflexActivity?.storeFavoriteCount && (
                  <span className="reflex-metric highlight">
                    <Star size={12} /> Store favorite at {reflexActivity.storeFavoriteCount} locations
                  </span>
                )}
                {worker.onTimeRating && (
                  <span className="reflex-metric good">On-time: {worker.onTimeRating}</span>
                )}
                {worker.commitmentScore && (
                  <span className="reflex-metric good">Commitment: {worker.commitmentScore}</span>
                )}
              </div>

              <div className="reflex-inner-divider" />

              {/* Brands on Reflex */}
              {worker.brandsWorked.length > 0 && (
                <div className="brands-list">
                  {worker.brandsWorked.slice(0, 6).map((brand, idx) => (
                    <span key={idx} className={`brand-tag ${brand.tier}`}>{brand.name}</span>
                  ))}
                  {worker.brandsWorked.length > 6 && (
                    <span className="brand-tag more">+{worker.brandsWorked.length - 6} more</span>
                  )}
                </div>
              )}

              {/* Retailer endorsements */}
              {worker.endorsements.length > 0 && (
                <div className="endorsements-list">
                  {worker.endorsements.slice(0, 5).map((e, idx) => (
                    <span key={idx} className="endorsement-badge">
                      {ENDORSEMENT_CONFIG[e]?.icon}
                      {ENDORSEMENT_CONFIG[e]?.label}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* 4. Preferences footer */}
        {(availabilityTags.length > 0 || (worker.targetBrands && worker.targetBrands.length > 0)) && (
          <>
            <div className="card-divider" />
            <div className="card-footer">
              {availabilityTags.length > 0 && (
                <div className="availability-row">
                  {availabilityTags.map((tag, idx) => (
                    <span key={idx} className="availability-tag">
                      {tag.icon} {tag.label}
                    </span>
                  ))}
                </div>
              )}
              {worker.targetBrands && worker.targetBrands.length > 0 && (
                <div className="target-brands-row">
                  <span className="target-brands-label">Interested in</span>
                  <span className="target-brands-text">{worker.targetBrands.join(' · ')}</span>
                </div>
              )}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
