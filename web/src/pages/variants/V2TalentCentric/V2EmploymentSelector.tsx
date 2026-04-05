import { CalendarDays, CalendarClock, SmilePlus, Check, ArrowRight, CornerDownRight } from 'lucide-react';

/**
 * V2EmploymentSelector - Reusable employment type selection component
 *
 * Used in the V2 Talent Centric flow for selecting employment preference.
 * Uses journey-card style with 3-column grid layout.
 */

export type EmploymentType = 'full-time' | 'part-time' | 'either' | null;
export type AvailabilityHours = 'tbd' | '<10' | '10-20' | '30-40' | '40+' | null;

const HOURS_OPTIONS: AvailabilityHours[] = ['tbd', '<10', '10-20', '30-40', '40+'];
const HOURS_LABELS: Record<Exclude<AvailabilityHours, null>, string> = {
  'tbd': 'TBD',
  '<10': '<10',
  '10-20': '10-20',
  '30-40': '30-40',
  '40+': '40+',
};

export interface V2EmploymentSelectorProps {
  /** Currently selected employment type */
  value: EmploymentType;
  /** Callback when employment type is selected */
  onChange: (type: EmploymentType) => void;
  /** Currently selected availability hours */
  availabilityHours: AvailabilityHours;
  /** Callback when availability hours is selected */
  onAvailabilityChange: (hours: AvailabilityHours) => void;
  /** Optional title override */
  title?: string;
}

export function V2EmploymentSelector({
  value,
  onChange,
  availabilityHours,
  onAvailabilityChange,
  title = 'What type of employment?',
}: V2EmploymentSelectorProps) {
  // Show availability section when an employment type is selected
  const showAvailability = value !== null;

  return (
    <>
      <div className="v2-step-header">
        <h1 className="type-tagline">{title}</h1>
      </div>

      <div className="v2-employment-chips">
        <button
          className={`journey-card ${value === 'full-time' ? 'selected' : ''}`}
          onClick={() => onChange('full-time')}
        >
          <div className="journey-card-header">
            <div className="journey-card-icon">
              <CalendarDays size={24} />
            </div>
            <h3 className="journey-card-title">Full-time</h3>
          </div>
          <div className="journey-card-footer">
            <div className="journey-card-arrow">
              {value === 'full-time' ? <Check size={20} /> : <ArrowRight size={20} />}
            </div>
          </div>
        </button>
        <button
          className={`journey-card ${value === 'part-time' ? 'selected' : ''}`}
          onClick={() => onChange('part-time')}
        >
          <div className="journey-card-header">
            <div className="journey-card-icon">
              <CalendarClock size={24} />
            </div>
            <h3 className="journey-card-title">Part-time</h3>
          </div>
          <div className="journey-card-footer">
            <div className="journey-card-arrow">
              {value === 'part-time' ? <Check size={20} /> : <ArrowRight size={20} />}
            </div>
          </div>
        </button>
        <button
          className={`journey-card ${value === 'either' ? 'selected' : ''}`}
          onClick={() => onChange('either')}
        >
          <div className="journey-card-header">
            <div className="journey-card-icon">
              <SmilePlus size={24} />
            </div>
            <h3 className="journey-card-title">Either works</h3>
          </div>
          <div className="journey-card-footer">
            <div className="journey-card-arrow">
              {value === 'either' ? <Check size={20} /> : <ArrowRight size={20} />}
            </div>
          </div>
        </button>
      </div>

      {showAvailability && (
        <>
          <div className="v2-step-header v2-availability-header v2-fade-in-first">
            <h2 className="type-section-header-lg">How many hours per week?</h2>
          </div>

          <div className="v2-availability-slider v2-fade-in-second">
            <div className="v2-slider-markers">
              {HOURS_OPTIONS.map((option, index) => (
                <button
                  key={option}
                  type="button"
                  className="v2-slider-marker"
                  onClick={() => onAvailabilityChange(option)}
                >
                  <span className={`v2-slider-label ${availabilityHours === option ? 'active' : ''}`}>
                    {HOURS_LABELS[option!]}
                  </span>
                  <div className="v2-slider-tick" />
                </button>
              ))}
            </div>
            <div className="v2-slider-track-container">
              <div className="v2-slider-track-wrapper">
                <div
                  className="v2-slider-fill"
                  style={{
                    width: `${(availabilityHours ? HOURS_OPTIONS.indexOf(availabilityHours) : 0) * 25}%`
                  }}
                />
                <input
                  type="range"
                  min="0"
                  max="4"
                  step="1"
                  value={availabilityHours ? HOURS_OPTIONS.indexOf(availabilityHours) : 0}
                  onChange={(e) => onAvailabilityChange(HOURS_OPTIONS[parseInt(e.target.value)])}
                  className="v2-hours-slider"
                />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default V2EmploymentSelector;
