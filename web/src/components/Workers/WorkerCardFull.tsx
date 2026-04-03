import { X } from 'lucide-react';
import type { MatchedWorker } from '../../types';
import { WorkerCardHeader } from './WorkerCardHeader';

interface WorkerCardFullProps {
  worker: MatchedWorker;
  onClose: () => void;
}

/**
 * WorkerCardFull - Comprehensive detail card
 * Opens to the right of chat interface
 * Uses same styling as WorkerCardTesting
 */
// Convert string to title case
const toTitleCase = (str: string) => {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

export function WorkerCardFull({ worker, onClose }: WorkerCardFullProps) {
  const { reflexActivity } = worker;

  // Get endorsements sorted by count
  const endorsementEntries = worker.endorsementCounts
    ? Object.entries(worker.endorsementCounts).sort((a, b) => b[1] - a[1])
    : [];

  return (
    <div className="worker-card-full-overlay">
      {/* Close button */}
      <button className="worker-card-full-close" onClick={onClose}>
        <X size={20} />
      </button>

      <div className="worker-card worker-card-testing">
        <WorkerCardHeader worker={worker} />

        <div className="worker-card-body">
          {/* About Me */}
          {worker.aboutMe && (
            <div className="testing-section">
              <span className="testing-label">About</span>
              <p className="testing-about">{worker.aboutMe}</p>
            </div>
          )}

          {/* Work History */}
          {worker.previousExperience.length > 0 && (
            <div className="testing-section">
              <span className="testing-label">Work History ({worker.previousExperience.length})</span>
              <div className="testing-data">
                {worker.previousExperience.map((exp, idx) => (
                  <div key={idx} className="testing-row">
                    <span className="testing-key">{exp.company}:</span> {exp.roles.join(', ')} ({exp.duration})
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reflex Activity */}
          {reflexActivity && (
            <div className="testing-section">
              <span className="testing-label">On Reflex</span>
              <div className="testing-data">
                <div className="testing-row"><span className="testing-key">Total Shifts:</span> {worker.shiftsOnReflex}</div>
                <div className="testing-row"><span className="testing-key">Stores Invited Back:</span> {worker.invitedBackStores}</div>
                {reflexActivity.storeFavoriteCount && (
                  <div className="testing-row"><span className="testing-key">Store Favorite:</span> {reflexActivity.storeFavoriteCount}</div>
                )}
                <div className="testing-row"><span className="testing-key">Luxury Shifts:</span> {reflexActivity.shiftsByTier.luxury}</div>
                <div className="testing-row"><span className="testing-key">Elevated Shifts:</span> {reflexActivity.shiftsByTier.elevated}</div>
                <div className="testing-row"><span className="testing-key">Mid Shifts:</span> {reflexActivity.shiftsByTier.mid}</div>
              </div>
            </div>
          )}

          {/* Brands Worked */}
          {worker.brandsWorked.length > 0 && (
            <div className="testing-section">
              <span className="testing-label">Retailers on Reflex ({worker.brandsWorked.length})</span>
              <div className="testing-pills">
                {worker.brandsWorked.map((brand, idx) => (
                  <span key={idx} className="tag tag-lite-gray tag-sm">
                    <span className="tag-text">{toTitleCase(brand.name)}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Endorsements */}
          {endorsementEntries.length > 0 && (
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
          )}

          {/* Retailer Quotes */}
          {worker.retailerQuotes && worker.retailerQuotes.length > 0 && (
            <div className="testing-section">
              <span className="testing-label">What Stores Say ({worker.retailerQuotes.length})</span>
              <div className="testing-data">
                {worker.retailerQuotes.map((quote, idx) => (
                  <div key={idx} className="testing-quote">
                    <div className="testing-row">"{quote.quote}"</div>
                    {(quote.role || quote.brand) && (
                      <div className="testing-row"><span className="testing-key">from:</span> {quote.role}{quote.role && quote.brand ? ', ' : ''}{quote.brand}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interview Transcript */}
          {worker.interviewTranscript && Array.isArray(worker.interviewTranscript) && worker.interviewTranscript.length > 0 && (
            <div className="testing-section">
              <span className="testing-label">Interview ({worker.interviewTranscript.length} Q&A)</span>
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
        </div>
      </div>
    </div>
  );
}
