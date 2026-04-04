import type { MatchedWorker } from '../../types';
import { WorkerCardHeader } from './WorkerCardHeader';
import { generateQuoteSummary } from './utils';

interface WorkerCardCompactProps {
  worker: MatchedWorker;
  onClick?: () => void;
}

/**
 * WorkerCardCompact - Compact teaser card for grids and chat view
 * For shift-verified workers: Shows Header + Reflex stats + Retailer summary
 * For non-verified workers: Shows Header + Work History
 * Uses DSL pills for endorsements and stats
 */
export function WorkerCardCompact({ worker, onClick }: WorkerCardCompactProps) {
  const firstName = worker.name.split(' ')[0];
  const hasQuotes = worker.retailerQuotes && worker.retailerQuotes.length > 0;
  const quoteSummary = worker.retailerSummary || (hasQuotes ? generateQuoteSummary(firstName, worker.retailerQuotes!) : null);
  const topExperience = worker.previousExperience.slice(0, 3);

  // Use dedicated shift_experience field if available, otherwise filter from endorsement_counts
  const shiftExperienceEntries = worker.shiftExperience
    ? Object.entries(worker.shiftExperience).sort((a, b) => b[1] - a[1]).slice(0, 3)
    : [];

  // Endorsements (behavioral traits) - use endorsement_counts directly
  const endorsementEntries = worker.endorsementCounts
    ? Object.entries(worker.endorsementCounts).sort((a, b) => b[1] - a[1]).slice(0, 3)
    : [];

  return (
    <div className="worker-card worker-card-compact" onClick={onClick}>
      <WorkerCardHeader worker={worker} showActivelyLooking={false} />

      <div className="worker-card-body">
        {/* About Me - show for all workers if available */}
        {worker.aboutMe && (
          <div className="compact-section">
            <p className="compact-about">{worker.aboutMe}</p>
          </div>
        )}

        {/* Shift verified: show reflex stats + retailer summary */}
        {worker.shiftVerified && (
          <>
            <div className="compact-stats">
              <span className="tag tag-lite-gray tag-sm">
                <span className="tag-counter">{worker.shiftsOnReflex}</span>
                <span className="tag-text">shifts</span>
              </span>
              {worker.reflexActivity?.storeFavoriteCount && worker.reflexActivity.storeFavoriteCount > 0 && (
                <span className="tag tag-lite-gray tag-sm">
                  <span className="tag-counter">{worker.reflexActivity.storeFavoriteCount}</span>
                  <span className="tag-text">stores favorited</span>
                </span>
              )}
            </div>
            {quoteSummary && (
              <div className="compact-section">
                <span className="section-label">What Retailers Say About {firstName}</span>
                <p className="compact-summary">{quoteSummary}</p>
              </div>
            )}
          </>
        )}

        {/* Non-verified: show work history */}
        {!worker.shiftVerified && topExperience.length > 0 && (
          <div className="compact-section">
            <span className="section-label">Work History</span>
            <div className="compact-experience-list">
              {topExperience.map((exp, idx) => (
                <div key={idx} className="compact-experience-item">
                  <span className="compact-exp-company">{exp.company}</span>
                  <span className="compact-exp-detail">{exp.roles[0]} · {exp.duration}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Shift Experience - show for all workers */}
        {shiftExperienceEntries.length > 0 && (
          <div className="compact-section">
            <span className="section-label">Shift Experience</span>
            <div className="compact-endorsements">
              {shiftExperienceEntries.map(([name, count], idx) => (
                <span key={idx} className="tag tag-stroke tag-sm">
                  <span className="tag-text">{name}</span>
                  <span className="tag-counter">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Endorsements with counts - show for all workers */}
        {endorsementEntries.length > 0 && (
          <div className="compact-section">
            <span className="section-label">Endorsements</span>
            <div className="compact-endorsements">
              {endorsementEntries.map(([name, count], idx) => (
                <span key={idx} className="tag tag-stroke tag-sm">
                  <span className="tag-text">{name}</span>
                  <span className="tag-counter">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
