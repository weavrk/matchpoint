import { Check, UserSearch, Users, SearchCheck, MapPin, HelpCircle, Compass } from 'lucide-react';
import './NavChips.css';

// Nav chip card definition
export interface NavChipItem {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
}

// Generate nav chips with market-specific titles
export const getNavChips = (market: string): NavChipItem[] => [
  { id: 'fill-role', icon: UserSearch, title: 'Fill a role at my store' },
  { id: 'meet-talent', icon: Users, title: `Meet ${market} talent` },
  { id: 'explore-market', icon: SearchCheck, title: 'Explore market comps' },
  { id: 'check-jobs', icon: MapPin, title: 'Check on jobs' },
  { id: 'how-it-works', icon: HelpCircle, title: 'What is Talent Connect?' },
  { id: 'just-exploring', icon: Compass, title: 'Just exploring' },
];

// Single nav chip button
interface NavChipProps {
  chip: NavChipItem;
  isActive?: boolean;
  onClick: (chipId: string) => void;
  disabled?: boolean;
  variant?: 'welcome' | 'compact';
}

export function NavChip({ chip, isActive = false, onClick, disabled = false, variant = 'welcome' }: NavChipProps) {
  const IconComponent = chip.icon;
  const className = variant === 'compact' ? 'chat-nav-chip' : 'welcome-card';
  const iconClassName = variant === 'compact' ? 'chat-nav-chip-icon' : 'welcome-card-icon';
  const titleClassName = variant === 'compact' ? 'chat-nav-chip-title type-chip-header' : 'welcome-card-title type-chip-header-lg';
  const iconSize = variant === 'compact' ? 16 : 24;

  return (
    <button
      type="button"
      className={`${className} ${isActive ? 'active' : ''}`}
      onClick={() => onClick(chip.id)}
      disabled={disabled}
    >
      <div className={iconClassName}>
        {isActive && variant === 'compact' ? <Check size={iconSize} /> : <IconComponent size={iconSize} />}
      </div>
      <h3 className={titleClassName}>{chip.title}</h3>
    </button>
  );
}

// Grid of nav chips
interface NavChipGridProps {
  chips: NavChipItem[];
  activeChipId?: string | null;
  onChipClick: (chipId: string) => void;
  disabled?: boolean;
  variant?: 'welcome' | 'compact';
}

export function NavChipGrid({ chips, activeChipId = null, onChipClick, disabled = false, variant = 'welcome' }: NavChipGridProps) {
  const gridClassName = variant === 'compact' ? 'chat-nav-chips' : 'welcome-card-grid';

  return (
    <div className={gridClassName}>
      {chips.map(chip => (
        <NavChip
          key={chip.id}
          chip={chip}
          isActive={activeChipId === chip.id}
          onClick={onChipClick}
          disabled={disabled}
          variant={variant}
        />
      ))}
    </div>
  );
}
