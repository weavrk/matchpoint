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
          <span>{getPhaseLabel(progress.phase)}</span>
          <span className="scrape-progress-timer">{formatTime(progress.elapsedSeconds)}</span>
        </div>

        <div className="scrape-progress-details">
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
              {progress.phase === 'complete' ? progress.jobsFound : '—'}
            </span>
            <span className="scrape-progress-stat-label">JOBS FOUND</span>
          </div>
          <div className="scrape-progress-stat">
            <span className="scrape-progress-stat-value">
              {progress.phase === 'complete' ? progress.jobsMatched : '—'}
            </span>
            <span className="scrape-progress-stat-label">MATCHED RETAILERS</span>
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
