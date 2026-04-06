import type { MatchedWorker } from '../../types';
import { WorkerCardHeaderFull } from './WorkerCardHeader';
import { WorkerAchievementChips } from './WorkerAchievementChips';
import { getBrandLogo } from '../../utils/brandLogos';

interface WorkerCardFullProps {
  worker: MatchedWorker;
  onClose?: () => void; // Optional - parent handles close if using drawer
}

/**
 * WorkerCardFull - Comprehensive detail card content
 * Renders the full worker profile without any wrapper/overlay
 * Parent component handles positioning (drawer, modal, etc.)
 */
// Convert string to title case
const toTitleCase = (str: string) => {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

export function WorkerCardFull({ worker }: WorkerCardFullProps) {
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
    <div className="worker-card worker-card-testing worker-card-full-content">
      <WorkerCardHeaderFull worker={worker} />

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
                <span key={idx} className="tag tag-blue-light tag-md">
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
            <div className="brand-logo-grid">
              {worker.brandsWorked.map((brand, idx) => {
                const logo = getBrandLogo(brand.name);
                return logo ? (
                  <span key={idx} className="tag-logo">
                    <img src={logo} alt={brand.name} />
                  </span>
                ) : (
                  <span key={idx} className="brand-logo-fallback">
                    {toTitleCase(brand.name)}
                  </span>
                );
              })}
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
  );
}
