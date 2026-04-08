import type { MatchedWorker } from '../../types';
import { WorkerCardHeaderFull } from './WorkerCardHeader';
import { WorkerAchievementChips } from './WorkerAchievementChips';
import { brandLogoNeedsGridInset, getBrandLogo } from '../../utils/brandLogos';

interface WorkerCardFullProps {
  worker: MatchedWorker;
  onClose?: () => void;
}

const toTitleCase = (str: string) => {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

export function WorkerCardFull({ worker }: WorkerCardFullProps) {
  const shiftExperienceEntries = worker.shiftExperience
    ? Object.entries(worker.shiftExperience).sort((a, b) => b[1] - a[1])
    : [];

  const endorsementEntries = worker.endorsementCounts
    ? Object.entries(worker.endorsementCounts).sort((a, b) => b[1] - a[1])
    : [];

  // Dedupe previous experience
  const previousExperience = (() => {
    const seen = new Set<string>();
    return (worker.previousExperience || []).filter(exp => {
      const roles = exp.roles.filter(r => r && r.toLowerCase() !== 'unknown').join(', ');
      if (!roles) return false;
      const key = `${exp.company}|${roles}|${exp.duration}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();

  return (
    <div className="worker-card worker-card-testing worker-card-full-content">
      <WorkerCardHeaderFull worker={worker} />

      <div className="card-sections">
        {/* 1. Stats + Achievement Chips */}
        <div className="card-section-item">
          <div className="compact-stats">
            <span className="tag tag-stroke tag-sm">
              <span className="tag-counter">{worker.shiftsOnReflex}</span>
              <span className="tag-text">{worker.shiftsOnReflex === 1 ? 'Shift' : 'Shifts'}</span>
            </span>
            {worker.uniqueStoreCount != null && worker.uniqueStoreCount > 0 && (
              <span className="tag tag-stroke tag-sm">
                <span className="tag-counter">{worker.uniqueStoreCount}</span>
                <span className="tag-text">{worker.uniqueStoreCount === 1 ? 'Store Location' : 'Store Locations'}</span>
              </span>
            )}
          </div>
          <WorkerAchievementChips worker={worker} />
        </div>

        {/* 2. About */}
        {worker.aboutMe && (
          <div className="card-section-item">
            <span className="testing-label">About</span>
            <p className="testing-about">{worker.aboutMe}</p>
          </div>
        )}

        {/* 3. Reflex Experience (shift pills + brand logos) */}
        {(shiftExperienceEntries.length > 0 || worker.brandsWorked.length > 0) && (
          <div className="card-section-item">
            {shiftExperienceEntries.length > 0 && (
              <>
                <span className="testing-label">Reflex Experience</span>
                <div className="testing-pills">
                  {shiftExperienceEntries.map(([name, count], idx) => (
                    <span key={idx} className="tag tag-blue-light tag-sm">
                      <span className="tag-text">{name}</span>
                      <span className="tag-counter">{count}</span>
                    </span>
                  ))}
                </div>
              </>
            )}
            {worker.brandsWorked.length > 0 && (
              <div className="brand-logo-grid">
                {worker.brandsWorked.map((brand, idx) => {
                  const logo = getBrandLogo(brand.name);
                  return logo ? (
                    <span
                      key={idx}
                      className={`tag-logo${brandLogoNeedsGridInset(brand.name) ? ' tag-logo-grid-inset' : ''}`}
                    >
                      <img src={logo} alt={brand.name} />
                    </span>
                  ) : (
                    <span key={idx} className="brand-logo-fallback">
                      {toTitleCase(brand.name)}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 5. Other Retail Experience */}
        {previousExperience.length > 0 && (
          <div className="card-section-item">
            <span className="testing-label">Other Retail Experience</span>
            <div className="testing-data">
              {previousExperience.map((exp, idx) => {
                const roles = exp.roles.filter(r => r && r.toLowerCase() !== 'unknown').join(', ');
                return (
                  <div key={idx} className="testing-row">
                    <span className="testing-key">{roles}</span>
                    {exp.duration && ` (${exp.duration})`}
                    {exp.company && `: ${exp.company}`}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. Retailer Summary + Store Team Reviews */}
        {(worker.retailerSummary || (worker.retailerQuotes && worker.retailerQuotes.length > 0)) && (
          <div className="card-section-item">
            {worker.retailerSummary && (
              <>
                <span className="testing-label">What Stores Say About {worker.name.split(' ')[0]}</span>
                <p className="testing-about">{worker.retailerSummary}</p>
              </>
            )}
            {worker.retailerQuotes && worker.retailerQuotes.length > 0 && (
              <>
                <span className="testing-label">Store Team Reviews</span>
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
              </>
            )}
          </div>
        )}

        {/* 8. Endorsements */}
        {endorsementEntries.length > 0 && (
          <div className="card-section-item">
            <span className="testing-label">Endorsements</span>
            <div className="testing-pills">
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
