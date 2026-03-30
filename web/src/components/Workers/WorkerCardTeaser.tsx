import type { MatchedWorker } from '../../types';
import { WorkerCardHeader } from './WorkerCardHeader';
import { generateQuoteSummary } from './utils';

interface WorkerCardTeaserProps {
  worker: MatchedWorker;
  onClick?: () => void;
}

/**
 * WorkerCardTeaser - Abridged card meant to entice/tease
 * Shows: Header + "What retailers are saying about [Name]" AI summary
 * Minimal info to encourage clicking for full details
 */
export function WorkerCardTeaser({ worker, onClick }: WorkerCardTeaserProps) {
  const firstName = worker.name.split(' ')[0];
  const hasQuotes = worker.retailerQuotes && worker.retailerQuotes.length > 0;
  const quoteSummary = hasQuotes ? generateQuoteSummary(firstName, worker.retailerQuotes!) : null;

  return (
    <div className="worker-card worker-card-teaser" onClick={onClick}>
      <WorkerCardHeader worker={worker} showActivelyLooking={false} />

      <div className="worker-card-body">
        {/* What retailers are saying - AI summary */}
        {quoteSummary && (
          <div className="teaser-retailer-summary">
            <span className="type-section-header-sm">What retailers are saying about {firstName}</span>
            <p className="teaser-summary-text">{quoteSummary}</p>
          </div>
        )}
      </div>
    </div>
  );
}
