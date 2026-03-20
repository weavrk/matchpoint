import { X, Loader2 } from 'lucide-react';
import './ScrapeProgressModal.css';

export interface ScrapeProgressData {
  phase: 'initializing' | 'launching' | 'navigating' | 'scraping' | 'filtering' | 'complete';
  currentMarket: string;
  currentRole: string;
  currentPage: number;
  totalPages: number;
  marketsCompleted: number;
  totalMarkets: number;
  rolesCompleted: number;
  totalRoles: number;
  jobsFound: number;
  jobsMatched: number;
  elapsedSeconds: number;
  // Real-time SSE fields
  matchedRetailers?: number;
  matchedJobs?: number;
  // Multi-pass fields
  currentPass?: number;
  totalPasses?: number;
  jobsSavedThisPass?: number;
  newJobsThisPass?: number;
  // Status message for real-time updates
  statusMessage?: string;
}

interface ScrapeProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: () => void;
  progress: ScrapeProgressData | null;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function getPhaseLabel(phase: ScrapeProgressData['phase']): string {
  switch (phase) {
    case 'initializing': return 'Initializing...';
    case 'launching': return 'Launching browser...';
    case 'navigating': return 'Navigating to jobs...';
    case 'scraping': return 'Extracting job data...';
    case 'filtering': return 'Filtering results...';
    case 'complete': return 'Complete!';
    default: return 'Processing...';
  }
}

export function ScrapeProgressModal({ isOpen, onClose, onCancel, progress }: ScrapeProgressModalProps) {
  if (!isOpen || !progress) return null;

  return (
    <div className="scrape-progress-overlay" onClick={onClose}>
      <div className="scrape-progress-modal" onClick={e => e.stopPropagation()}>
        <div className="scrape-progress-top">
          <button className="scrape-progress-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="scrape-progress-header">
          <Loader2 size={20} className="scrape-progress-spinner" />
          <div className="scrape-progress-header-text">
            <span>{getPhaseLabel(progress.phase)}</span>
            {progress.statusMessage && (
              <span className="scrape-progress-status">{progress.statusMessage}</span>
            )}
          </div>
          <span className="scrape-progress-timer">{formatTime(progress.elapsedSeconds)}</span>
        </div>

        <div className="scrape-progress-details">
          {progress.totalPasses && progress.totalPasses > 1 && (
            <div className="scrape-progress-row">
              <span className="scrape-progress-label">Pass:</span>
              <span className="scrape-progress-value">
                <strong>{progress.currentPass || 1}</strong> of {progress.totalPasses}
                {progress.jobsSavedThisPass !== undefined && progress.jobsSavedThisPass > 0 && (
                  <span className="scrape-progress-saved"> (+{progress.jobsSavedThisPass} saved)</span>
                )}
              </span>
            </div>
          )}
          <div className="scrape-progress-row">
            <span className="scrape-progress-label">Market:</span>
            <span className="scrape-progress-value">
              <strong>{progress.currentMarket || 'Starting...'}</strong>
              <span className="scrape-progress-count">({progress.marketsCompleted + 1} of {progress.totalMarkets})</span>
            </span>
          </div>
          <div className="scrape-progress-row">
            <span className="scrape-progress-label">Search:</span>
            <span className="scrape-progress-value">
              <strong>Retail</strong> jobs
            </span>
          </div>
        </div>

        <div className="scrape-progress-stats">
          <div className="scrape-progress-stat">
            <span className="scrape-progress-stat-value">
              {progress.jobsFound ?? 0}
            </span>
            <span className="scrape-progress-stat-label">JOBS FOUND</span>
          </div>
          <div className="scrape-progress-stat">
            <span className="scrape-progress-stat-value">
              {progress.matchedJobs ?? 0}
            </span>
            <span className="scrape-progress-stat-label">TOTAL MATCHED</span>
          </div>
          <div className="scrape-progress-stat">
            <span className="scrape-progress-stat-value scrape-progress-stat-new">
              {progress.newJobsThisPass !== undefined ? `+${progress.newJobsThisPass}` : '0'}
            </span>
            <span className="scrape-progress-stat-label">NEW JOBS</span>
          </div>
        </div>

        <div className="scrape-progress-footer">
          <button className="scrape-progress-cancel" onClick={onCancel}>
            Cancel Scrape
          </button>
        </div>
      </div>
    </div>
  );
}
