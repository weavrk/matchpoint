import { CalendarDays, CalendarClock, CalendarRange, Check } from 'lucide-react';

/**
 * V2EmploymentSelector - Reusable employment type selection component
 *
 * Used in the V2 Talent Centric flow for selecting employment preference.
 * Can be used standalone or within V2ContentShell.
 */

export type EmploymentType = 'full-time' | 'part-time' | 'either' | null;

export interface V2EmploymentSelectorProps {
  /** Currently selected employment type */
  value: EmploymentType;
  /** Callback when employment type is selected */
  onChange: (type: EmploymentType) => void;
  /** Optional title override */
  title?: string;
}

export function V2EmploymentSelector({
  value,
  onChange,
  title = 'What type of employment?',
}: V2EmploymentSelectorProps) {
  return (
    <>
      <div className="v2-step-header">
        <h1 className="type-tagline">{title}</h1>
      </div>

      <div className="v2-employment-chips">
        <button
          className={`welcome-card ${value === 'full-time' ? 'active' : ''}`}
          onClick={() => onChange('full-time')}
        >
          <div className="welcome-card-icon">
            {value === 'full-time' ? <Check size={24} /> : <CalendarDays size={24} />}
          </div>
          <h3 className="welcome-card-title type-chip-header-lg">Full-time</h3>
        </button>
        <button
          className={`welcome-card ${value === 'part-time' ? 'active' : ''}`}
          onClick={() => onChange('part-time')}
        >
          <div className="welcome-card-icon">
            {value === 'part-time' ? <Check size={24} /> : <CalendarClock size={24} />}
          </div>
          <h3 className="welcome-card-title type-chip-header-lg">Part-time</h3>
        </button>
        <button
          className={`welcome-card ${value === 'either' ? 'active' : ''}`}
          onClick={() => onChange('either')}
        >
          <div className="welcome-card-icon">
            {value === 'either' ? <Check size={24} /> : <CalendarRange size={24} />}
          </div>
          <h3 className="welcome-card-title type-chip-header-lg">Open to either</h3>
        </button>
      </div>
    </>
  );
}

export default V2EmploymentSelector;
