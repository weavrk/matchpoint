import type { MatchedWorker } from '../../types';
import { WorkerCard } from './WorkerCard';
import './WorkerGrid.css';

interface WorkerGridProps {
  workers: MatchedWorker[];
  title?: string;
}

export function WorkerGrid({ workers, title }: WorkerGridProps) {
  if (workers.length === 0) {
    return (
      <div className="worker-grid-empty">
        <p>No matching workers found. Try adjusting your criteria.</p>
      </div>
    );
  }

  const verifiedWorkers = workers.filter((w) => w.shiftVerified);
  const otherWorkers = workers.filter((w) => !w.shiftVerified);

  return (
    <div className="worker-grid-container">
      {title && <h2 className="worker-grid-title">{title}</h2>}

      <div className="worker-grid-summary">
        <span className="summary-count">{workers.length} matches</span>
        {verifiedWorkers.length > 0 && (
          <span className="summary-verified">
            {verifiedWorkers.length} Shift Verified
          </span>
        )}
      </div>

      {verifiedWorkers.length > 0 && (
        <div className="worker-section">
          <h3 className="worker-section-title">Shift Verified</h3>
          <div className="worker-grid">
            {verifiedWorkers.map((worker) => (
              <WorkerCard key={worker.id} worker={worker} />
            ))}
          </div>
        </div>
      )}

      {otherWorkers.length > 0 && (
        <div className="worker-section">
          {verifiedWorkers.length > 0 && (
            <h3 className="worker-section-title">Other Candidates</h3>
          )}
          <div className="worker-grid">
            {otherWorkers.map((worker) => (
              <WorkerCard key={worker.id} worker={worker} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
