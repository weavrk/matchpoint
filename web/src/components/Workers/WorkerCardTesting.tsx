import type { MatchedWorker } from '../../types';
import { WorkerCardHeader } from './WorkerCardHeader';

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

  // Get endorsements sorted by count
  const endorsementEntries = worker.endorsementCounts
    ? Object.entries(worker.endorsementCounts).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div className="worker-card worker-card-testing">
      <WorkerCardHeader worker={worker} />

      <div className="worker-card-body">
        {/* Basic Info */}
        <div className="testing-section">
          <span className="testing-label">Basic Info</span>
          <div className="testing-data">
            <div className="testing-row"><span className="testing-key">id:</span> {worker.id}</div>
            <div className="testing-row"><span className="testing-key">name:</span> {worker.name}</div>
            <div className="testing-row"><span className="testing-key">photo:</span> {worker.photo || 'null'}</div>
            <div className="testing-row"><span className="testing-key">market:</span> {worker.market}</div>
            <div className="testing-row"><span className="testing-key">shiftVerified:</span> {worker.shiftVerified ? 'true' : 'false'}</div>
            <div className="testing-row"><span className="testing-key">activelyLooking:</span> {worker.activelyLooking ? 'true' : 'false'}</div>
            <div className="testing-row"><span className="testing-key">shiftsOnReflex:</span> {worker.shiftsOnReflex}</div>
            <div className="testing-row"><span className="testing-key">invitedBackStores:</span> {worker.invitedBackStores}</div>
            <div className="testing-row"><span className="testing-key">currentTier:</span> {worker.currentTier || 'null'}</div>
          </div>
        </div>

        {/* About Me */}
        {worker.aboutMe && (
          <div className="testing-section">
            <span className="testing-label">About Me</span>
            <p className="testing-about">{worker.aboutMe}</p>
          </div>
        )}

        {/* Brands Worked */}
        <div className="testing-section">
          <span className="testing-label">Brands Worked ({worker.brandsWorked.length})</span>
          <div className="testing-pills">
            {worker.brandsWorked.map((brand, idx) => (
              <span key={idx} className="tag tag-stroke tag-sm">
                <span className="tag-text">{toTitleCase(brand.name)}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Endorsements with counts */}
        <div className="testing-section">
          <span className="testing-label">Endorsements ({endorsementEntries.length})</span>
          <div className="testing-pills">
            {endorsementEntries.map(([name, count], idx) => (
              <span key={idx} className="tag tag-stroke tag-sm">
                <span className="tag-counter">{count}</span>
                <span className="tag-text">{name}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Previous Experience */}
        <div className="testing-section">
          <span className="testing-label">Previous Experience ({worker.previousExperience.length})</span>
          <div className="testing-data">
            {worker.previousExperience.map((exp, idx) => (
              <div key={idx} className="testing-row">
                <span className="testing-key">{exp.company}:</span> {exp.roles.join(', ')} ({exp.duration})
              </div>
            ))}
          </div>
        </div>

        {/* Reflex Activity */}
        {reflexActivity && (
          <div className="testing-section">
            <span className="testing-label">Reflex Activity</span>
            <div className="testing-data">
              <div className="testing-row"><span className="testing-key">shiftsByTier.luxury:</span> {reflexActivity.shiftsByTier.luxury}</div>
              <div className="testing-row"><span className="testing-key">shiftsByTier.elevated:</span> {reflexActivity.shiftsByTier.elevated}</div>
              <div className="testing-row"><span className="testing-key">shiftsByTier.mid:</span> {reflexActivity.shiftsByTier.mid}</div>
              <div className="testing-row"><span className="testing-key">tierProgression:</span> {reflexActivity.tierProgression}</div>
              <div className="testing-row"><span className="testing-key">storeFavoriteCount:</span> {reflexActivity.storeFavoriteCount || 'null'}</div>
              {reflexActivity.longestRelationship && (
                <div className="testing-row">
                  <span className="testing-key">longestRelationship:</span> {reflexActivity.longestRelationship.brand} ({reflexActivity.longestRelationship.flexCount} shifts)
                </div>
              )}
            </div>
          </div>
        )}

        {/* Retailer Quotes */}
        {worker.retailerQuotes && worker.retailerQuotes.length > 0 && (
          <div className="testing-section">
            <span className="testing-label">Retailer Quotes ({worker.retailerQuotes.length})</span>
            <div className="testing-data">
              {worker.retailerQuotes.map((quote, idx) => (
                <div key={idx} className="testing-quote">
                  <div className="testing-row">"{quote.quote}"</div>
                  <div className="testing-row"><span className="testing-key">from:</span> {quote.role}, {quote.brand}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Retailer Summary */}
        {worker.retailerSummary && (
          <div className="testing-section">
            <span className="testing-label">Retailer Summary (AI Generated)</span>
            <p className="testing-about">{worker.retailerSummary}</p>
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

        {/* IDs */}
        <div className="testing-section">
          <span className="testing-label">System IDs</span>
          <div className="testing-data">
            <div className="testing-row"><span className="testing-key">workerUuid:</span> {worker.workerUuid || 'null'}</div>
            <div className="testing-row"><span className="testing-key">workerId:</span> {worker.workerId ?? 'null'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
