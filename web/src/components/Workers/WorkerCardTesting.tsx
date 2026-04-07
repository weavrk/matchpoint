import type { MatchedWorker } from '../../types';
import { WorkerCardHeader } from './WorkerCardHeader';
import { WorkerAchievementChips } from './WorkerAchievementChips';
import { getBrandLogo } from '../../utils/brandLogos';

interface WorkerCardTestingProps {
  worker: MatchedWorker;
}

/**
 * WorkerCardTesting - Shows ALL available worker data for prototype testing
 * Use this to see what data fields are available when building UI
 */
// Convert string to title case
const toTitleCase = (str: string) => {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

export function WorkerCardTesting({ worker }: WorkerCardTestingProps) {
  const { reflexActivity } = worker;

  // Use dedicated shift_experience field if available
  const shiftExperienceEntries = worker.shiftExperience
    ? Object.entries(worker.shiftExperience).sort((a, b) => b[1] - a[1])
    : [];

  // Endorsements (behavioral traits) - use endorsement_counts directly
  const endorsementEntries = worker.endorsementCounts
    ? Object.entries(worker.endorsementCounts).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div className="worker-card worker-card-testing">
      <WorkerCardHeader worker={worker} />

      <div className="worker-card-body">
        {/* Achievement Chips */}
        <WorkerAchievementChips worker={worker} />

        {/* About Me */}
        {worker.aboutMe && (
          <div className="testing-section">
            <span className="testing-label">About Me</span>
            <p className="testing-about">{worker.aboutMe}</p>
          </div>
        )}

        {/* Shift Experience */}
        {shiftExperienceEntries.length > 0 && (
          <div className="testing-section">
            <span className="testing-label">Shift Experience ({shiftExperienceEntries.length})</span>
            <div className="testing-pills">
              {shiftExperienceEntries.map(([name, count], idx) => (
                <span key={idx} className="tag tag-blue-light tag-md">
                  <span className="tag-text">{name}</span>
                  <span className="tag-counter">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Previous Experience */}
        <div className="testing-section">
          <span className="testing-label">Other Retail Experience ({worker.previousExperience.length})</span>
          <div className="testing-data">
            {worker.previousExperience.map((exp, idx) => (
              <div key={idx} className="testing-row">
                <span className="testing-key">{exp.company}:</span> {exp.roles.join(', ')} ({exp.duration})
              </div>
            ))}
          </div>
        </div>

        {/* Retailer Summary */}
        {worker.retailerSummary && (
          <div className="testing-section">
            <span className="testing-label">What stores say about {worker.name.split(' ')[0]}</span>
            <p className="testing-about">{worker.retailerSummary}</p>
          </div>
        )}

        {/* Retailer Quotes */}
        {worker.retailerQuotes && worker.retailerQuotes.length > 0 && (
          <div className="testing-section">
            <span className="testing-label">Store team reviews ({worker.retailerQuotes.length})</span>
            <div className="testing-data">
              {worker.retailerQuotes.map((quote, idx) => {
                const brandLogo = getBrandLogo(quote.brand);
                return (
                  <div key={idx} className="testing-quote">
                    <div className="quote-mark-container">
                      <span className="quote-open-mark">{'\u201C'}</span>
                    </div>
                    <div className="quote-content">
                      <p className="quote-text">{quote.quote}</p>
                      {quote.role && <span className="quote-role">{quote.reviewerName ? `${quote.reviewerName}, ` : ''}{quote.role}</span>}
                    </div>
                    <div className="quote-logo-container">
                      {brandLogo && <img src={brandLogo} alt={quote.brand} className="quote-brand-logo" />}
                      {!brandLogo && quote.brand && <span className="quote-brand-text">{quote.brand}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Brands Worked */}
        <div className="testing-section">
          <span className="testing-label">Retailers on Reflex ({worker.brandsWorked.length})</span>
          <div className="testing-pills">
            {worker.brandsWorked.map((brand, idx) => (
              <span key={idx} className="tag tag-dark-gray tag-md">
                <span className="tag-text">{toTitleCase(brand.name)}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Endorsements with counts */}
        {endorsementEntries.length > 0 && (
          <div className="testing-section">
            <span className="testing-label">Endorsements ({endorsementEntries.length})</span>
            <div className="testing-pills">
              {endorsementEntries.map(([name, count], idx) => (
                <span key={idx} className="tag tag-stroke tag-md">
                  <span className="tag-text">{name}</span>
                  <span className="tag-counter">{count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Interview Transcript */}
        {worker.interviewTranscript && Array.isArray(worker.interviewTranscript) && worker.interviewTranscript.length > 0 && (
          <div className="testing-section">
            <span className="testing-label">Interview Transcript ({worker.interviewTranscript.length})</span>
            <div className="testing-data">
              {worker.interviewTranscript.map((entry, idx) => (
                <div key={idx} className="testing-quote">
                  <div className="testing-row"><span className="testing-key">Q:</span> {entry.question}</div>
                  <div className="testing-row"><span className="testing-key">A:</span> {entry.answer}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Basic Info & Reflex Activity (moved to end for testing reference) */}
        <div className="testing-section">
          <span className="testing-label">Basic Info & Reflex Activity</span>
          <div className="testing-data">
            <div className="testing-row"><span className="testing-key">id:</span> {worker.id}</div>
            <div className="testing-row"><span className="testing-key">name:</span> {worker.name}</div>
            <div className="testing-row"><span className="testing-key">photo:</span> {worker.photo || 'null'}</div>
            <div className="testing-row"><span className="testing-key">market:</span> {worker.market}</div>
            <div className="testing-row"><span className="testing-key">shiftVerified:</span> {worker.shiftVerified ? 'true' : 'false'}</div>
            <div className="testing-row"><span className="testing-key">activelyLooking:</span> {worker.activelyLooking ? 'true' : 'false'}</div>
            <div className="testing-row"><span className="testing-key">shiftsOnReflex:</span> {worker.shiftsOnReflex}</div>
            <div className="testing-row"><span className="testing-key">uniqueStoreCount:</span> {worker.uniqueStoreCount || 'null'}</div>
            {reflexActivity?.longestRelationship && (
              <div className="testing-row">
                <span className="testing-key">longestRelationship:</span> {reflexActivity.longestRelationship.brand} ({reflexActivity.longestRelationship.flexCount} shifts)
              </div>
            )}
            <div className="testing-row"><span className="testing-key">currentTier:</span> {worker.currentTier || 'null'}</div>
            <div className="testing-row"><span className="testing-key">invitedBackStores:</span> {worker.invitedBackStores}</div>
            <div className="testing-row"><span className="testing-key">storeFavoriteCount:</span> {reflexActivity?.storeFavoriteCount || 'null'}</div>
            <div className="testing-row"><span className="testing-key">tardyRatio:</span> {worker.tardyRatio || 'null'}</div>
            <div className="testing-row"><span className="testing-key">tardyPercent:</span> {worker.tardyPercent != null ? `${worker.tardyPercent}%` : 'null'}</div>
            <div className="testing-row"><span className="testing-key">urgentCancelRatio:</span> {worker.urgentCancelRatio || 'null'}</div>
            <div className="testing-row"><span className="testing-key">urgentCancelPercent:</span> {worker.urgentCancelPercent != null ? `${worker.urgentCancelPercent}%` : 'null'}</div>
          </div>
        </div>

      </div>
    </div>
  );
}
