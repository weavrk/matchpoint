import {
  MessageSquareText,
  Zap,
  CheckSquare,
  Users,
  Timer,
  TrendingUp,
  CircleSlash2,
  Smile,
  Shuffle,
} from 'lucide-react';
import type { MatchedWorker, Endorsement } from '../../types';
import { WorkerCardHeader } from './WorkerCardHeader';

const ENDORSEMENT_ICONS: Record<Endorsement, React.ReactNode> = {
  'customer-engagement': <MessageSquareText size={14} />,
  'self-starter': <Zap size={14} />,
  'preparedness': <CheckSquare size={14} />,
  'perfect-attire': <Users size={14} />,
  'work-pace': <Timer size={14} />,
  'productivity': <TrendingUp size={14} />,
  'attention-to-detail': <CircleSlash2 size={14} />,
  'team-player': <Users size={14} />,
  'positive-attitude': <Smile size={14} />,
  'adaptable': <Shuffle size={14} />,
};

const ENDORSEMENT_LABELS: Record<Endorsement, string> = {
  'customer-engagement': 'Customer Engagement',
  'self-starter': 'Self-Starter',
  'preparedness': 'Preparedness',
  'perfect-attire': 'Perfect Attire',
  'work-pace': 'Work Pace',
  'productivity': 'Productivity',
  'attention-to-detail': 'Attention to Detail',
  'team-player': 'Team Player',
  'positive-attitude': 'Positive Attitude',
  'adaptable': 'Adaptable',
};

interface WorkerCardCompactProps {
  worker: MatchedWorker;
  onClick?: () => void;
}

/**
 * WorkerCardCompact - More robust but still abridged for chat view
 * Shows: Header, quote, work history, endorsements with counts, store quotes
 */
export function WorkerCardCompact({ worker, onClick }: WorkerCardCompactProps) {
  const topExperience = worker.previousExperience.slice(0, 3);
  const topEndorsements = worker.endorsements.slice(0, 3);

  // Generate fake endorsement counts for demo
  const getEndorsementCount = (idx: number) => {
    const counts = [117, 89, 97, 84, 102, 76];
    return counts[idx % counts.length];
  };

  return (
    <div className="worker-card worker-card-compact" onClick={onClick}>
      <WorkerCardHeader worker={worker} />

      <div className="worker-card-body">
        {/* Quote/About */}
        {worker.about && (
          <p className="worker-quote">
            <span className="quote-mark">"</span>
            {worker.about}
          </p>
        )}

        {/* Work History */}
        {topExperience.length > 0 && (
          <div className="compact-section">
            <span className="section-label">Work History</span>
            <div className="experience-list">
              {topExperience.map((exp, idx) => (
                <div key={idx} className="experience-item">
                  <span className="exp-company">{exp.company}</span>
                  <span className="exp-detail">· {exp.roles[0]} · {exp.duration}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Endorsements with counts */}
        {topEndorsements.length > 0 && (
          <div className="compact-section">
            <span className="section-label">Endorsements</span>
            <div className="endorsements-with-counts">
              {topEndorsements.map((e, idx) => (
                <span key={idx} className="pill pill-stroke pill-sm">
                  <span className="pill-icon">{ENDORSEMENT_ICONS[e]}</span>
                  <span className="pill-text">{ENDORSEMENT_LABELS[e]}</span>
                  <span className="pill-counter">+{getEndorsementCount(idx)}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* What stores say */}
        {worker.retailerQuotes && worker.retailerQuotes.length > 0 && (
          <div className="compact-section">
            <span className="section-label">What Stores Say</span>
            <div className="store-quotes">
              {worker.retailerQuotes.slice(0, 2).map((quote, idx) => (
                <div key={idx} className="store-quote">
                  <span className="quote-icon">💬</span>
                  <div className="quote-content">
                    <p className="quote-text">"{quote.quote}"</p>
                    <span className="quote-attribution">{quote.brand} {quote.role}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
