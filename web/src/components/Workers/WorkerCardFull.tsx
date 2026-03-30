import {
  X,
  MapPin,
  BadgeCheck,
  Search,
  MessageSquareText,
  Zap,
  CheckSquare,
  Users,
  Timer,
  TrendingUp,
  CircleSlash2,
  Smile,
  Shuffle,
  ShieldCheck,
  AlertCircle,
  Flame,
  CalendarDays,
  Sun,
  Moon,
} from 'lucide-react';
import type { MatchedWorker, Endorsement } from '../../types';

const ENDORSEMENT_CONFIG: Record<Endorsement, { icon: React.ReactNode; label: string }> = {
  'customer-engagement': { icon: <MessageSquareText size={16} />, label: 'Customer Engagement' },
  'self-starter': { icon: <Zap size={16} />, label: 'Self-Starter' },
  'preparedness': { icon: <CheckSquare size={16} />, label: 'Preparedness' },
  'perfect-attire': { icon: <Users size={16} />, label: 'Perfect Attire' },
  'work-pace': { icon: <Timer size={16} />, label: 'Work Pace' },
  'productivity': { icon: <TrendingUp size={16} />, label: 'Productivity' },
  'attention-to-detail': { icon: <CircleSlash2 size={16} />, label: 'Attention to Detail' },
  'team-player': { icon: <Users size={16} />, label: 'Team Player' },
  'positive-attitude': { icon: <Smile size={16} />, label: 'Positive Attitude' },
  'adaptable': { icon: <Shuffle size={16} />, label: 'Adaptable' },
};

interface WorkerCardFullProps {
  worker: MatchedWorker;
  onClose: () => void;
}

/**
 * WorkerCardFull - Comprehensive detail card
 * Opens to the right of chat interface, takes 60% width
 * Includes close button, all worker details
 */
export function WorkerCardFull({ worker, onClose }: WorkerCardFullProps) {
  const initials = worker.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const { reflexActivity, reliability, availability } = worker;

  const totalReflexShifts = reflexActivity
    ? reflexActivity.shiftsByTier.luxury + reflexActivity.shiftsByTier.elevated + reflexActivity.shiftsByTier.mid
    : 0;

  const availabilityTags: { label: string; icon: React.ReactNode }[] = [];
  if (availability.weekends) availabilityTags.push({ label: 'Weekends', icon: <CalendarDays size={14} /> });
  if (availability.openingShifts) availabilityTags.push({ label: 'Opening shifts', icon: <Sun size={14} /> });
  if (availability.closingShifts) availabilityTags.push({ label: 'Closing shifts', icon: <Moon size={14} /> });

  return (
    <div className="worker-card-full-overlay">
      <div className="worker-card-full">
        {/* Close button */}
        <button className="worker-card-full-close" onClick={onClose}>
          <X size={20} />
        </button>

        {/* Header - larger avatar */}
        <div className="worker-card-full-header">
          <div className="worker-avatar worker-avatar-lg">
            {worker.photo ? <img src={worker.photo} alt={worker.name} /> : <span>{initials}</span>}
          </div>

          <h2 className="worker-name worker-name-lg">{worker.name}</h2>

          {worker.shiftVerified && (
            <span className="badge badge-verified badge-lg">
              <BadgeCheck size={16} /> Shift Verified
            </span>
          )}

          {worker.activelyLooking && (
            <span className="badge badge-looking badge-lg">
              <Search size={14} /> Actively looking
            </span>
          )}
        </div>

        {/* Meta info */}
        <div className="worker-card-full-meta">
          <span className="meta-item"><MapPin size={16} /> {worker.market}</span>
          <span className="meta-item">
            Looking for: {worker.preference === 'FT' ? 'Full-Time' : worker.preference === 'PT' ? 'Part-Time' : 'Full or Part-Time'}
          </span>
        </div>

        {/* Body content */}
        <div className="worker-card-full-body">
          {/* About */}
          {worker.about && (
            <div className="full-section">
              <p className="worker-about-full">
                <span className="quote-mark-lg">"</span>
                {worker.about}
              </p>
            </div>
          )}

          {/* Work History */}
          {worker.previousExperience.length > 0 && (
            <div className="full-section">
              <h4 className="section-title">Work History</h4>
              <div className="experience-list-full">
                {worker.previousExperience.map((exp, idx) => (
                  <div key={idx} className="experience-item-full">
                    <span className="exp-company">{exp.company}</span>
                    <span className="exp-detail">· {exp.roles[0]} · {exp.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reflex Activity */}
          {reflexActivity && (
            <div className="full-section">
              <h4 className="section-title">On Reflex</h4>
              <div className="reflex-stats">
                <div className="reflex-stat">
                  <span className="stat-value">{totalReflexShifts}</span>
                  <span className="stat-label">Total Shifts</span>
                </div>
                <div className="reflex-stat">
                  <span className="stat-value">{worker.invitedBackStores}</span>
                  <span className="stat-label">Stores Invited Back</span>
                </div>
                {reflexActivity.storeFavoriteCount && (
                  <div className="reflex-stat highlight">
                    <span className="stat-value">{reflexActivity.storeFavoriteCount}</span>
                    <span className="stat-label">Store Favorite</span>
                  </div>
                )}
              </div>

              {/* Reliability */}
              {reliability && (
                <div className="reliability-badges">
                  <span className={`reliability-badge ${reliability.noShows === 0 ? 'good' : 'warn'}`}>
                    <ShieldCheck size={14} />
                    {reliability.noShows === 0 ? '0 no-shows' : `${reliability.noShows} no-show${reliability.noShows > 1 ? 's' : ''}`}
                  </span>
                  {reliability.cancellations === 0 && (
                    <span className="reliability-badge good">
                      <AlertCircle size={14} /> 0 cancellations
                    </span>
                  )}
                  {reliability.lastMinuteFills >= 5 && (
                    <span className="reliability-badge good">
                      <Flame size={14} /> {reliability.lastMinuteFills} last-min fills
                    </span>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Brands */}
          {worker.brandsWorked.length > 0 && (
            <div className="full-section">
              <h4 className="section-title">Retailers on Reflex</h4>
              <div className="brands-grid">
                {worker.brandsWorked.map((brand, idx) => (
                  <span key={idx} className={`brand-tag-full ${brand.tier}`}>{brand.name}</span>
                ))}
              </div>
            </div>
          )}

          {/* Endorsements */}
          {worker.endorsements.length > 0 && (
            <div className="full-section">
              <h4 className="section-title">Retailer Endorsements</h4>
              <div className="endorsements-grid">
                {worker.endorsements.map((e, idx) => (
                  <span key={idx} className="endorsement-badge-full">
                    {ENDORSEMENT_CONFIG[e]?.icon}
                    {ENDORSEMENT_CONFIG[e]?.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Retailer Quotes */}
          {worker.retailerQuotes && worker.retailerQuotes.length > 0 && (
            <div className="full-section">
              <h4 className="section-title">What Stores Say</h4>
              <div className="quotes-list-full">
                {worker.retailerQuotes.map((quote, idx) => (
                  <div key={idx} className="quote-item-full">
                    <span className="quote-icon-full">💬</span>
                    <div className="quote-content-full">
                      <p className="quote-text-full">"{quote.quote}"</p>
                      <span className="quote-attribution-full">{quote.role}, {quote.brand}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Availability */}
          {availabilityTags.length > 0 && (
            <div className="full-section">
              <h4 className="section-title">Availability</h4>
              <div className="availability-tags-full">
                {availabilityTags.map((tag, idx) => (
                  <span key={idx} className="availability-tag-full">
                    {tag.icon} {tag.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Target Brands */}
          {worker.targetBrands && worker.targetBrands.length > 0 && (
            <div className="full-section">
              <h4 className="section-title">Interested In</h4>
              <p className="target-brands-full">{worker.targetBrands.join(' · ')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
