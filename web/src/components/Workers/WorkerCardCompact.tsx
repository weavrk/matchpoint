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

  // Brands worked - show retailer names
  const brandsWorked = worker.brandsWorked || [];

  return (
    <div className="worker-card worker-card-compact" onClick={onClick}>
      <WorkerCardHeader worker={worker} showActivelyLooking={true} />

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
              <span className="tag tag-stroke tag-md">
                <span className="tag-counter">{worker.shiftsOnReflex}</span>
                <span className="tag-text">Shifts</span>
              </span>
              {worker.uniqueStoreCount && worker.uniqueStoreCount > 0 && (
                <span className="tag tag-stroke tag-md">
                  <span className="tag-counter">{worker.uniqueStoreCount}</span>
                  <span className="tag-text">Store Locations</span>
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

        {/* Shift Experience - show for all workers */}
        {shiftExperienceEntries.length > 0 && (
          <div className="compact-section">
            <span className="section-label">Shift Experience</span>
            <div className="compact-endorsements">
              {shiftExperienceEntries.map(([name, count], idx) => (
                <span key={idx} className="tag tag-blue-light tag-md">
                  <span className="tag-text">{name}</span>
                  <span className="tag-counter">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Retailers on Reflex - show brands worked */}
        {brandsWorked.length > 0 && (
          <div className="compact-section">
            <span className="section-label">Retailers on Reflex</span>
            <div className="compact-endorsements">
              {brandsWorked.map((brand, idx) => (
                <span key={idx} className="tag tag-primary-fill tag-md">
                  <span className="tag-text">{brand.name}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Other Experience - show previous work history for all workers */}
        {topExperience.length > 0 && (
          <div className="compact-section">
            <span className="section-label">Other Experience</span>
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
      </div>
    </div>
  );
}
