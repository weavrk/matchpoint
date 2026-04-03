import {
  BadgeCheck,
  MapPin,
  TrendingUp,
  RotateCcw,
  Star,
  Search,
} from 'lucide-react';
import type { MatchedWorker, RetailerQuote } from '../../types';
import './WorkerCard.css';

// Generate a unique AI-style summary from retailer quotes (3-5 sentences)
function generateQuoteSummary(firstName: string, quotes: RetailerQuote[]): string {
  const quoteText = quotes.map(q => q.quote.toLowerCase()).join(' ');
  const brandCount = new Set(quotes.map(q => q.brand)).size;

  const sentences: string[] = [];

  // Opening sentence - vary based on content
  if (quoteText.includes('five steps ahead') || quoteText.includes('initiative') || quoteText.includes('before i can ask')) {
    sentences.push(`${firstName} is the type of worker who anticipates what needs to be done before being asked.`);
  } else if (quoteText.includes('energy') || quoteText.includes('spirit') || quoteText.includes('contagious')) {
    sentences.push(`${firstName} brings an energy to the floor that elevates the entire team.`);
  } else if (quoteText.includes('professional') || quoteText.includes('polite') || quoteText.includes('brand ambassador')) {
    sentences.push(`${firstName} represents the brand with professionalism that stands out to retailers.`);
  } else if (quoteText.includes('hustle') || quoteText.includes('never stops') || quoteText.includes('circles around')) {
    sentences.push(`${firstName} is known for relentless work ethic that keeps the floor running smoothly.`);
  } else if (quoteText.includes('customer') || quoteText.includes('client') || quoteText.includes('greet')) {
    sentences.push(`${firstName} has a natural ability to connect with customers that retailers notice immediately.`);
  } else if (quoteText.includes('quick to learn') || quoteText.includes('eager')) {
    sentences.push(`${firstName} picks things up quickly and is always eager to contribute.`);
  } else {
    sentences.push(`Retailers across ${brandCount} brands consistently request ${firstName} back.`);
  }

  // Middle sentences - specific to their strengths
  if (quoteText.includes('greet') || quoteText.includes('welcome') || quoteText.includes('comfortable')) {
    sentences.push(`Managers highlight how ${firstName} makes customers feel welcomed from the moment they walk in.`);
  }
  if (quoteText.includes('busy') || quoteText.includes('finding') || quoteText.includes('restocking') || quoteText.includes('displays')) {
    sentences.push(`When things slow down, ${firstName} finds productive work without needing direction.`);
  }
  if (quoteText.includes('direction') || quoteText.includes('coaching') || quoteText.includes('feedback')) {
    sentences.push(`${firstName} takes feedback professionally and applies it immediately.`);
  }
  if (quoteText.includes('team') || quoteText.includes('collaborate') || quoteText.includes('tone')) {
    sentences.push(`Multiple managers note that ${firstName} elevates the performance of the whole team.`);
  }
  if (quoteText.includes('sale') || quoteText.includes('conversion') || quoteText.includes('close')) {
    sentences.push(`${firstName} has strong sales instincts and consistently delivers results.`);
  }
  if (quoteText.includes('bilingual') || quoteText.includes('international')) {
    sentences.push(`Language skills make ${firstName} especially valuable with diverse clientele.`);
  }
  if (quoteText.includes('visual') || quoteText.includes('floor') || quoteText.includes('organization')) {
    sentences.push(`${firstName} has a sharp eye for floor presentation and visual details.`);
  }
  if (quoteText.includes('jump') || quoteText.includes('right in') || quoteText.includes('no problem')) {
    sentences.push(`${firstName} hits the ground running and integrates seamlessly into any team.`);
  }
  if (quoteText.includes('fast') || quoteText.includes('quick') || quoteText.includes('efficient')) {
    sentences.push(`Speed and efficiency are standout qualities that managers appreciate.`);
  }
  if (quoteText.includes('trust') || quoteText.includes('recommend') || quoteText.includes('knowledge')) {
    sentences.push(`Customers trust ${firstName}'s product recommendations and expertise.`);
  }
  if (quoteText.includes('management') || quoteText.includes('lead') || quoteText.includes('example')) {
    sentences.push(`Several retailers see leadership potential and management readiness.`);
  }
  if (quoteText.includes('pleasure') || quoteText.includes('joy') || quoteText.includes('love having')) {
    sentences.push(`Store teams genuinely enjoy working alongside ${firstName}.`);
  }

  // Closing sentence based on overall sentiment
  if (quoteText.includes('would love') || quoteText.includes('back anytime') || quoteText.includes('would not mind having')) {
    sentences.push(`The consistent feedback: retailers want ${firstName} back.`);
  } else if (quoteText.includes('outstanding') || quoteText.includes('exceptional') || quoteText.includes('best')) {
    sentences.push(`${firstName} is regularly described as one of the strongest workers retailers have seen.`);
  } else if (brandCount >= 4) {
    sentences.push(`With positive feedback from ${brandCount} different retailers, ${firstName} has proven adaptable across brands.`);
  }

  // Ensure we have 3-5 sentences, take first 5 if we have more
  const finalSentences = sentences.slice(0, 5);

  // If we have fewer than 3, add generic but relevant closers
  while (finalSentences.length < 3) {
    if (!finalSentences.some(s => s.includes('request'))) {
      finalSentences.push(`Multiple store managers have specifically requested ${firstName} for future shifts.`);
    } else if (!finalSentences.some(s => s.includes('reliable'))) {
      finalSentences.push(`${firstName} shows up ready to work and delivers consistently.`);
    } else {
      finalSentences.push(`This track record speaks to ${firstName}'s reliability and professionalism.`);
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

  // Get endorsements sorted by count
  const endorsementEntries = worker.endorsementCounts
    ? Object.entries(worker.endorsementCounts).sort((a, b) => b[1] - a[1])
    : [];

  const hasReflexData = !!reflexActivity;

  return (
    <div className="worker-card">

      {/* ── Header ────────────────────────────────── */}
      <div className="worker-card-header">
        <div className="worker-avatar">
          {worker.photo ? <img src={worker.photo} alt={worker.name} /> : <span>{initials}</span>}
        </div>

        <div className="worker-header-info">
          <div className="worker-name-row">
            <h3 className="worker-name">{worker.name}</h3>
            {worker.shiftVerified && (
              <span className="tag tag-green tag-sm">
                <span className="tag-icon"><BadgeCheck size={12} /></span>
                <span className="tag-text">Shift Verified</span>
              </span>
            )}
            {worker.activelyLooking && (
              <span className="tag tag-lite-gray tag-sm">
                <span className="tag-icon"><Search size={12} /></span>
                <span className="tag-text">Actively looking</span>
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
              <span className="section-label">Work history</span>
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
                {worker.tardyPercent != null && worker.tardyPercent < 10 && (
                  <span className="reflex-metric good">Exceptional Punctuality</span>
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
                      <span key={idx} className="tag tag-lite-gray tag-sm">
                        <span className="tag-text">{toTitleCase(brand.name)}</span>
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
                        <span className="tag-counter">{count}</span>
                        <span className="tag-text">{name}</span>
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
                    <span className="section-label">What retailers are saying about {worker.name.split(' ')[0]}</span>
                    <p className="retailer-quotes-summary">
                      {generateQuoteSummary(worker.name.split(' ')[0], worker.retailerQuotes)}
                    </p>
                    <div className="retailer-quotes-list">
                      {worker.retailerQuotes.map((quote, idx) => (
                        <div key={idx} className="retailer-quote">
                          <p className="retailer-quote-text">{quote.quote}</p>
                          <span className="retailer-quote-attribution">{quote.role}, {quote.brand}</span>
                        </div>
                      ))}
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
