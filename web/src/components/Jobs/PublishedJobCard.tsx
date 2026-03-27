import { useState } from 'react';
import {
  Eye,
  Heart,
  Briefcase,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  DollarSign,
  MessageCircle,
  BadgeCheck,
  MoreHorizontal,
  Pause,
  Play,
  Trash2,
  Shield,
} from 'lucide-react';
import type { PublishedJob, JobCandidate, CandidateStatus } from '../../types';
import './PublishedJobCard.css';

interface PublishedJobCardProps {
  job: PublishedJob;
  onJobAction: (jobId: string, action: 'pause' | 'resume' | 'close') => void;
}

// Status badge component
function StatusBadge({ status }: { status: CandidateStatus }) {
  const config: Record<CandidateStatus, { icon: React.ReactNode; label: string; className: string }> = {
    invited: { icon: <MessageCircle size={14} />, label: 'Invited', className: 'status-invited' },
    viewed: { icon: <Eye size={14} />, label: 'Viewed', className: 'status-viewed' },
    interested: { icon: <Heart size={14} />, label: 'Interested', className: 'status-interested' },
    applied: { icon: <Briefcase size={14} />, label: 'Applied', className: 'status-applied' },
  };

  const { icon, label, className } = config[status];

  return (
    <span className={`candidate-status-badge ${className}`}>
      {icon}
      {label}
    </span>
  );
}

// Candidate row component
function CandidateRow({
  candidate,
}: {
  candidate: JobCandidate;
}) {
  return (
    <div className="candidate-row">
      <div className="candidate-info">
        <div className="candidate-avatar">
          {candidate.workerPhoto ? (
            <img src={candidate.workerPhoto} alt={candidate.workerName} />
          ) : (
            <span>{candidate.workerName.charAt(0)}</span>
          )}
        </div>
        <div className="candidate-details">
          <div className="candidate-name-row">
            <span className="candidate-name">{candidate.workerName}</span>
            {candidate.shiftVerified && (
              <span className="candidate-verified">
                <BadgeCheck size={14} /> Verified
              </span>
            )}
          </div>
          <div className="candidate-meta">
            <span>{candidate.shiftsOnReflex} shifts</span>
            <span className="candidate-score">{candidate.matchScore}% match</span>
          </div>
        </div>
      </div>

      <div className="candidate-endorsements">
        {candidate.topEndorsements.slice(0, 2).map((endorsement, idx) => (
          <span key={idx} className="candidate-endorsement">{endorsement}</span>
        ))}
      </div>

      <StatusBadge status={candidate.status} />
    </div>
  );
}

export function PublishedJobCard({ job, onJobAction }: PublishedJobCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Count candidates by status
  const pendingCount = job.candidates.filter(c =>
    c.status === 'invited' || c.status === 'viewed' || c.status === 'interested'
  ).length;
  const appliedCount = job.candidates.filter(c => c.status === 'applied').length;

  return (
    <div className={`published-job-card ${job.status}`}>
      {/* Job Header */}
      <div className="job-card-header">
        <div className="job-card-title-section">
          <h3 className="job-card-title">{job.role}</h3>
          <div className="job-card-meta">
            <span className="job-meta-item">
              <Clock size={14} />
              {job.employmentType}
            </span>
            <span className="job-meta-item">
              <MapPin size={14} />
              {job.market}
            </span>
            <span className="job-meta-item">
              <DollarSign size={14} />
              {job.pay}
            </span>
          </div>
        </div>

        <div className="job-card-actions">
          <div className="job-menu-wrapper">
            <button
              className="job-menu-btn"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreHorizontal size={20} />
            </button>
            {showMenu && (
              <div className="job-menu-dropdown">
                {job.status === 'active' ? (
                  <button onClick={() => { onJobAction(job.id, 'pause'); setShowMenu(false); }}>
                    <Pause size={16} /> Pause posting
                  </button>
                ) : job.status === 'paused' ? (
                  <button onClick={() => { onJobAction(job.id, 'resume'); setShowMenu(false); }}>
                    <Play size={16} /> Resume posting
                  </button>
                ) : null}
                <button onClick={() => { onJobAction(job.id, 'close'); setShowMenu(false); }} className="danger">
                  <Trash2 size={16} /> Close posting
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Engagement Metrics */}
      <div className="job-engagement-row">
        <div className="engagement-metric">
          <Eye size={18} />
          <span className="engagement-count">{job.engagement.views}</span>
          <span className="engagement-label">views</span>
        </div>
        <div className="engagement-metric">
          <Heart size={18} />
          <span className="engagement-count">{job.engagement.likes}</span>
          <span className="engagement-label">likes</span>
        </div>
        <div className="engagement-metric highlight">
          <Briefcase size={18} />
          <span className="engagement-count">{job.engagement.applications}</span>
          <span className="engagement-label">applied</span>
        </div>
      </div>

      {/* Traits & Benefits Pills */}
      <div className="job-tags-section">
        {job.traits.length > 0 && (
          <div className="job-tags-row">
            <span className="job-tags-label">Looking for:</span>
            <div className="job-tags">
              {job.traits.map((trait, idx) => (
                <span key={idx} className="job-tag trait">{trait}</span>
              ))}
            </div>
          </div>
        )}
        {job.benefits.length > 0 && (
          <div className="job-tags-row">
            <span className="job-tags-label">Benefits:</span>
            <div className="job-tags">
              {job.benefits.map((benefit, idx) => (
                <span key={idx} className="job-tag benefit">{benefit}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Candidate Summary */}
      <button
        className="candidates-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="candidates-summary">
          <span className="candidates-total">{job.candidates.length} Reflexers invited</span>
          <div className="candidates-breakdown">
            {appliedCount > 0 && <span className="breakdown-item applied">{appliedCount} applied</span>}
            {pendingCount > 0 && <span className="breakdown-item pending">{pendingCount} pending</span>}
          </div>
        </div>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {/* Expanded Candidate List */}
      {isExpanded && (
        <div className="candidates-list">
          {appliedCount > 0 && (
            <div className="reflex-coordinating-banner">
              <Shield size={16} />
              <span>Reflex is coordinating a shortlist of applicants for you to review and reach out to. We will be in touch soon.</span>
            </div>
          )}
          {job.candidates.map((candidate) => (
            <CandidateRow
              key={candidate.workerId}
              candidate={candidate}
            />
          ))}
        </div>
      )}

      {/* Job Status Badge */}
      {job.status !== 'active' && (
        <div className={`job-status-banner ${job.status}`}>
          {job.status === 'paused' ? 'Paused' : 'Closed'}
        </div>
      )}
    </div>
  );
}
