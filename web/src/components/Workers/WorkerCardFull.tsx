import { X } from 'lucide-react';
import type { MatchedWorker } from '../../types';
import { WorkerCardHeader } from './WorkerCardHeader';
import { WorkerAchievementChips } from './WorkerAchievementChips';
import { getBrandLogo } from '../../utils/brandLogos';

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

  // Use dedicated shift_experience field if available
  const shiftExperienceEntries = worker.shiftExperience
    ? Object.entries(worker.shiftExperience).sort((a, b) => b[1] - a[1])
    : [];

  // Endorsements (behavioral traits) - use endorsement_counts directly
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
          {/* Achievement Chips */}
          <WorkerAchievementChips worker={worker} />

          {/* About Me */}
          {worker.aboutMe && (
            <div className="testing-section">
              <span className="testing-label">About</span>
              <p className="testing-about">{worker.aboutMe}</p>
            </div>
          )}

          {/* Shift Experience */}
          {shiftExperienceEntries.length > 0 && (
            <div className="testing-section">
              <span className="testing-label">Shift Experience ({shiftExperienceEntries.length})</span>
              <div className="testing-pills">
                {shiftExperienceEntries.map(([name, count], idx) => (
                  <span key={idx} className="tag tag-dark-gray tag-md">
                    <span className="tag-text">{name}</span>
                    <span className="tag-counter">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Work History (Previous Experience) */}
          {worker.previousExperience.length > 0 && (
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
          )}

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
          {worker.brandsWorked.length > 0 && (
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
          )}

          {/* Endorsements */}
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
