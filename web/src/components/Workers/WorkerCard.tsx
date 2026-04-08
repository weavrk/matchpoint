import { useState, useMemo } from 'react';
import {
  BadgeCheck,
  MapPin,
  TrendingUp,
  RotateCcw,
  Star,
  Search,
} from 'lucide-react';
import type { MatchedWorker, RetailerQuote } from '../../types';
import { getBrandLogo } from '../../utils/brandLogos';
import { getWorkerPhoto } from '../../hooks/useWorkerPhoto';
import './WorkerCard.css';

// Generate a unique AI-style summary from retailer quotes (3-5 sentences)
// Alternates between sentences with name and without to avoid repetition
function generateQuoteSummary(firstName: string, quotes: RetailerQuote[]): string {
  const quoteText = quotes.map(q => q.quote.toLowerCase()).join(' ');
  const brandCount = new Set(quotes.map(q => q.brand)).size;

  // Sentences with name (used for first sentence, then alternating)
  const namedSentences: string[] = [];
  // Sentences without name (for variety)
  const genericSentences: string[] = [];

  // Opening sentences (always with name)
  if (quoteText.includes('five steps ahead') || quoteText.includes('initiative') || quoteText.includes('before i can ask')) {
    namedSentences.push(`${firstName} is the type of worker who anticipates what needs to be done before being asked.`);
  }
  if (quoteText.includes('energy') || quoteText.includes('spirit') || quoteText.includes('contagious')) {
    namedSentences.push(`${firstName} brings an energy to the floor that elevates the entire team.`);
  }
  if (quoteText.includes('professional') || quoteText.includes('polite') || quoteText.includes('brand ambassador')) {
    namedSentences.push(`${firstName} represents the brand with professionalism that stands out to retailers.`);
  }
  if (quoteText.includes('hustle') || quoteText.includes('never stops') || quoteText.includes('circles around')) {
    namedSentences.push(`${firstName} is known for a relentless work ethic that keeps the floor running smoothly.`);
  }
  if (quoteText.includes('customer') || quoteText.includes('client')) {
    namedSentences.push(`${firstName} has a natural ability to connect with customers that retailers notice immediately.`);
  }
  if (quoteText.includes('quick to learn') || quoteText.includes('eager')) {
    namedSentences.push(`${firstName} picks things up quickly and is always eager to contribute.`);
  }

  // Middle sentences - mix of named and generic
  if (quoteText.includes('greet') || quoteText.includes('welcome') || quoteText.includes('comfortable')) {
    genericSentences.push(`Managers highlight the warm welcome customers receive from the moment they walk in.`);
  }
  if (quoteText.includes('busy') || quoteText.includes('finding') || quoteText.includes('restocking') || quoteText.includes('displays')) {
    genericSentences.push(`When things slow down, there's always productive work being done without needing direction.`);
  }
  if (quoteText.includes('direction') || quoteText.includes('coaching') || quoteText.includes('feedback')) {
    genericSentences.push(`Feedback is taken professionally and applied immediately.`);
  }
  if (quoteText.includes('team') || quoteText.includes('collaborate') || quoteText.includes('tone')) {
    genericSentences.push(`Multiple managers note the positive impact on team performance.`);
  }
  if (quoteText.includes('sale') || quoteText.includes('conversion') || quoteText.includes('close')) {
    genericSentences.push(`Strong sales instincts consistently deliver results on the floor.`);
  }
  if (quoteText.includes('bilingual') || quoteText.includes('international')) {
    genericSentences.push(`Language skills make for especially valuable connections with diverse clientele.`);
  }
  if (quoteText.includes('visual') || quoteText.includes('floor') || quoteText.includes('organization')) {
    genericSentences.push(`A sharp eye for floor presentation and visual details is consistently noted.`);
  }
  if (quoteText.includes('jump') || quoteText.includes('right in') || quoteText.includes('no problem')) {
    genericSentences.push(`Hitting the ground running and integrating seamlessly into any team is a hallmark.`);
  }
  if (quoteText.includes('fast') || quoteText.includes('quick') || quoteText.includes('efficient')) {
    genericSentences.push(`Speed and efficiency are standout qualities that managers appreciate.`);
  }
  if (quoteText.includes('trust') || quoteText.includes('recommend') || quoteText.includes('knowledge')) {
    genericSentences.push(`Customers trust the product recommendations and expertise they receive.`);
  }
  if (quoteText.includes('management') || quoteText.includes('lead') || quoteText.includes('example')) {
    genericSentences.push(`Several retailers see leadership potential and management readiness.`);
  }
  if (quoteText.includes('pleasure') || quoteText.includes('joy') || quoteText.includes('love having')) {
    genericSentences.push(`Store teams genuinely enjoy working together on the floor.`);
  }

  // Closing sentences
  if (quoteText.includes('would love') || quoteText.includes('back anytime') || quoteText.includes('would not mind having')) {
    genericSentences.push(`The consistent feedback: retailers want this worker back.`);
  }
  if (quoteText.includes('outstanding') || quoteText.includes('exceptional') || quoteText.includes('best')) {
    genericSentences.push(`Regularly described as one of the strongest workers retailers have seen.`);
  }
  if (brandCount >= 4) {
    genericSentences.push(`Positive feedback from ${brandCount} different retailers shows adaptability across brands.`);
  }

  // Build final array: start with name, then alternate
  const finalSentences: string[] = [];

  // First sentence should have name
  if (namedSentences.length > 0) {
    finalSentences.push(namedSentences.shift()!);
  } else {
    finalSentences.push(`Retailers across ${brandCount} brands consistently request ${firstName} back.`);
  }

  // Alternate: generic, then named if we have more
  let useGeneric = true;
  while (finalSentences.length < 5 && (genericSentences.length > 0 || namedSentences.length > 0)) {
    if (useGeneric && genericSentences.length > 0) {
      finalSentences.push(genericSentences.shift()!);
    } else if (namedSentences.length > 0) {
      finalSentences.push(namedSentences.shift()!);
    } else if (genericSentences.length > 0) {
      finalSentences.push(genericSentences.shift()!);
    }
    useGeneric = !useGeneric;
  }

  // Ensure minimum 3 sentences
  while (finalSentences.length < 3) {
    if (finalSentences.length % 2 === 1) {
      finalSentences.push(`Store managers frequently request this worker for future shifts.`);
    } else {
      finalSentences.push(`${firstName} consistently delivers and shows up ready to work.`);
    }
  }

  return finalSentences.join(' ');
}

interface WorkerCardProps {
  worker: MatchedWorker;
}

// Convert string to title case
const toTitleCase = (str: string) => {
  return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
};

export function WorkerCard({ worker }: WorkerCardProps) {
  const [imgError, setImgError] = useState(false);

  // Get photo from final photos pool based on gender (only if no DB photo)
  const assignedPhoto = useMemo(() => {
    if (!worker.photo && worker.gender) {
      return getWorkerPhoto(worker.gender);
    }
    return null;
  }, [worker.photo, worker.gender]);

  // Use worker.photo from DB first, fall back to assigned photo, then initials
  const photoUrl = worker.photo || assignedPhoto;

  const initials = worker.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const { reflexActivity } = worker;

  const totalReflexShifts = reflexActivity
    ? reflexActivity.shiftsByTier.luxury + reflexActivity.shiftsByTier.elevated + reflexActivity.shiftsByTier.mid
    : 0;

  const specialtyShifts = reflexActivity
    ? reflexActivity.shiftsByTier.elevated + reflexActivity.shiftsByTier.mid
    : 0;
  const dominantTierLabel = reflexActivity
    ? reflexActivity.shiftsByTier.luxury > 0 &&
      reflexActivity.shiftsByTier.luxury >= specialtyShifts
      ? `${reflexActivity.shiftsByTier.luxury} luxury brand shifts`
      : specialtyShifts > 0
      ? `${specialtyShifts} specialty brand shifts`
      : reflexActivity.shiftsByTier.luxury > 0
      ? `${reflexActivity.shiftsByTier.luxury} luxury brand shifts`
      : null
    : null;

  // Use dedicated shift_experience field if available
  const shiftExperienceEntries = worker.shiftExperience
    ? Object.entries(worker.shiftExperience).sort((a, b) => b[1] - a[1])
    : [];

  // Endorsements (behavioral traits) - use endorsement_counts directly
  const endorsementEntries = worker.endorsementCounts
    ? Object.entries(worker.endorsementCounts).sort((a, b) => b[1] - a[1])
    : [];

  const hasReflexData = !!reflexActivity;

  return (
    <div className="worker-card">

      {/* ── Header ────────────────────────────────── */}
      <div className="worker-card-header">
        <div className="worker-avatar">
          {photoUrl && !imgError ? (
            <img src={photoUrl} alt={worker.name} onError={() => setImgError(true)} />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        <div className="worker-header-info">
          <div className="worker-name-row">
            <h3 className="worker-name">{worker.name}</h3>
            {worker.shiftVerified && (
              <span className="tag tag-blue-light tag-sm">
                <span className="tag-icon"><BadgeCheck size={14} /></span>
                <span className="tag-text">Shift Verified</span>
              </span>
            )}
            {worker.activelyLooking && (
              <span className="tag tag-blue tag-sm">
                <span className="tag-icon"><Search size={14} /></span>
                <span className="tag-text">Actively Looking</span>
              </span>
            )}
          </div>
          <div className="worker-meta">
            <span className="worker-meta-item"><MapPin size={14} />{worker.market}</span>
          </div>
        </div>

      </div>

      {/* ── Body ──────────────────────────────────── */}
      <div className="worker-card-body">

        {/* 1. About */}
        {worker.aboutMe && <p className="worker-about">{worker.aboutMe}</p>}

        {/* 2. Work history */}
        {worker.previousExperience.length > 0 && (
          <>
            <div className="card-divider" />
            <div className="card-section">
              <span className="section-label">Work History</span>
              <div className="experience-list">
                {worker.previousExperience.map((exp, idx) => (
                  <div key={idx} className="experience-item">
                    <span className="exp-company">{exp.company}</span>
                    <span className="exp-detail">{exp.roles[0]} · {exp.duration}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* 3. Reflex record — grouped block */}
        {hasReflexData && (
          <>
            <div className="card-divider" />
            <div className="reflex-record">
              <span className="section-label reflex-record-label">On Reflex</span>

              {/* Activity summary */}
              <div className="reflex-activity-row">
                <span className="reflex-big-num">{totalReflexShifts}</span>
                <span className="reflex-big-label">shifts</span>
                {worker.uniqueStoreCount && worker.uniqueStoreCount > 0 && (
                  <>
                    <span className="reflex-dot">·</span>
                    <span className="reflex-tier-text">{worker.uniqueStoreCount} store locations</span>
                  </>
                )}
                {dominantTierLabel && <span className="reflex-dot">·</span>}
                {dominantTierLabel && <span className="reflex-tier-text">{dominantTierLabel}</span>}
                {reflexActivity?.longestRelationship && (
                  <>
                    <span className="reflex-dot">·</span>
                    <span className="reflex-tier-text">
                      {reflexActivity.longestRelationship.flexCount} with {reflexActivity.longestRelationship.brand}
                    </span>
                  </>
                )}
                {reflexActivity?.tierProgression === 'upward' && (
                  <span className="tier-up-badge">
                    <TrendingUp size={11} /> Tier progression
                  </span>
                )}
              </div>

              <div className="reflex-inner-divider" />


              {/* Store metrics */}
              <div className="reflex-metrics-row">
                {worker.invitedBackStores > 0 && (
                  <span className="reflex-metric">
                    <RotateCcw size={12} /> Invited back: {worker.invitedBackStores} stores
                  </span>
                )}
                {reflexActivity?.storeFavoriteCount && (
                  <span className="reflex-metric highlight">
                    <Star size={12} /> Store favorite at {reflexActivity.storeFavoriteCount} locations
                  </span>
                )}
                {worker.tardyPercent != null && 100 - worker.tardyPercent > 85 && (
                  <span className="reflex-metric good">Consistently On-Time</span>
                )}
                {worker.urgentCancelPercent != null && worker.urgentCancelPercent < 5 && (
                  <span className="reflex-metric good">Low Cancellations</span>
                )}
              </div>

              <div className="reflex-inner-divider" />

              {/* Brands on Reflex */}
              {worker.brandsWorked.length > 0 && (
                <div className="brands-section">
                  <span className="section-label">Retailers on Reflex</span>
                  <div className="brands-list">
                    {worker.brandsWorked.map((brand, idx) => (
                      <span key={idx} className="tag tag-dark-gray tag-sm">
                        <span className="tag-text">{toTitleCase(brand.name)}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Shift Experience */}
              {shiftExperienceEntries.length > 0 && (
                <div className="endorsements-section">
                  <span className="section-label">Shift Experience</span>
                  <div className="endorsements-list">
                    {shiftExperienceEntries.map(([name, count], idx) => (
                      <span key={idx} className="tag tag-blue-light tag-sm">
                        <span className="tag-text">{name}</span>
                        <span className="tag-counter">{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Retailer endorsements */}
              {endorsementEntries.length > 0 && (
                <div className="endorsements-section">
                  <span className="section-label">Retailer Endorsements</span>
                  <div className="endorsements-list">
                    {endorsementEntries.map(([name, count], idx) => (
                      <span key={idx} className="tag tag-stroke tag-sm">
                        <span className="tag-text">{name}</span>
                        <span className="tag-counter">{count}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Retailer quotes */}
              {worker.retailerQuotes && worker.retailerQuotes.length > 0 && (
                <>
                  <div className="reflex-inner-divider" />
                  <div className="retailer-quotes-section">
                    <span className="section-label">What Retailers Are Saying About {worker.name.split(' ')[0]}</span>
                    <p className="retailer-quotes-summary">
                      {worker.retailerSummary || generateQuoteSummary(worker.name.split(' ')[0], worker.retailerQuotes)}
                    </p>
                    <div className="retailer-quotes-list">
                      {worker.retailerQuotes.map((quote, idx) => {
                        const brandLogo = getBrandLogo(quote.brand);
                        return (
                          <div key={idx} className="retailer-quote">
                            <div className="quote-mark-container">
                              <span className="quote-open-mark">{'\u201C'}</span>
                            </div>
                            <div className="quote-content">
                              <p className="retailer-quote-text">{quote.quote}</p>
                              <span className="retailer-quote-role">{quote.reviewerName ? `${quote.reviewerName}, ` : ''}{quote.role}</span>
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
                </>
              )}
            </div>
          </>
        )}


      </div>
    </div>
  );
}
