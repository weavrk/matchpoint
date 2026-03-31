import type { MatchedWorker } from '../../types';
import { WorkerCardHeader } from './WorkerCardHeader';
import { generateQuoteSummary } from './utils';

interface WorkerCardTeaserProps {
  worker: MatchedWorker;
  onClick?: () => void;
}

/**
 * WorkerCardTeaser - Abridged card meant to entice/tease
 * For shift-verified workers: Shows Header + "What retailers are saying about [Name]" AI summary
 * For non-verified workers: Shows Header + Work History
 * Minimal info to encourage clicking for full details
 */
export function WorkerCardTeaser({ worker, onClick }: WorkerCardTeaserProps) {
  const firstName = worker.name.split(' ')[0];
  const hasQuotes = worker.retailerQuotes && worker.retailerQuotes.length > 0;
  const quoteSummary = hasQuotes ? generateQuoteSummary(firstName, worker.retailerQuotes!) : null;
  const hasWorkHistory = worker.previousExperience && worker.previousExperience.length > 0;

  return (
    <div className="worker-card worker-card-teaser" onClick={onClick}>
      <WorkerCardHeader worker={worker} showActivelyLooking={false} />

      <div className="worker-card-body">
        {/* Shift verified: show reflex stats + retailer summary */}
        {worker.shiftVerified && (
          <>
            <div className="teaser-reflex-stats">
              <span className="pill pill-lite-gray pill-sm">
                <span className="pill-counter">{worker.shiftsOnReflex}</span>
                <span className="pill-text">shifts</span>
              </span>
              {worker.reflexActivity?.storeFavoriteCount && worker.reflexActivity.storeFavoriteCount > 0 && (
                <span className="pill pill-lite-gray pill-sm">
                  <span className="pill-counter">{worker.reflexActivity.storeFavoriteCount}</span>
                  <span className="pill-text">stores favorited</span>
                </span>
              )}
            </div>
            {quoteSummary && (
              <div className="teaser-retailer-summary">
                <span className="type-section-header-sm">What retailers are saying about {firstName}</span>
                <p className="teaser-summary-text">{quoteSummary}</p>
              </div>
            )}
          </>
        )}

        {/* Non-verified: show work history */}
        {!worker.shiftVerified && hasWorkHistory && (
          <div className="teaser-work-history">
            <span className="type-section-header-sm">Work History</span>
            <div className="teaser-work-history-list">
              {worker.previousExperience!.slice(0, 3).map((exp, idx) => (
                <div key={idx} className="teaser-work-history-item">
                  <span className="teaser-work-company">{exp.company}</span>
                  <span className="teaser-work-details">
                    {exp.roles.join(' / ')} · {exp.duration}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
