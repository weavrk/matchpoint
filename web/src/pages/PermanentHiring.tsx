import { useState, useEffect } from 'react';
import { Layers, Database } from 'lucide-react';
import { V1JobFocus } from './variants/V1JobFocus';
import { V2TalentCentric } from './variants/V2TalentCentric';
import { V3Wildcard } from './variants/V3Wildcard';
import { DevMenu } from '../components/DevMenu';
import { OzPanel } from '../components/OzPanel';
import './PermanentHiring.css';

type VariantId = 'v1-job-focus' | 'v2-talent-centric' | 'v3-wildcard';

// Names for the greeting
const GREETING_NAMES = [
  'Mike', 'Trevor', 'Shannon', 'Nate', 'Micah', 'Katherine', 'Cayley',
  'Evan', 'Juan', 'Julie', 'Ashlee', 'Jeremy', 'Sam', 'Jasmine',
  'Emily', 'Olivia', 'Mary', 'Hans', 'Hadley', 'Leigh Ann',
];
const getRandomUserName = () => GREETING_NAMES[Math.floor(Math.random() * GREETING_NAMES.length)];

// Props passed down to variants
export interface VariantProps {
  agentActive: boolean;
  showOz: boolean;
  onToggleOz: () => void;
  userName?: string;
}

const VARIANTS: { id: VariantId; label: string; component: React.ComponentType<VariantProps> }[] = [
  { id: 'v1-job-focus', label: 'V1: Job Focus', component: V1JobFocus },
  { id: 'v2-talent-centric', label: 'V2: Talent Centric', component: V2TalentCentric as React.ComponentType<VariantProps> },
  { id: 'v3-wildcard', label: 'V3: Wildcard', component: V3Wildcard as React.ComponentType<VariantProps> },
];

export function PermanentHiring() {
  const [currentVariant, setCurrentVariant] = useState<VariantId>(() => {
    const saved = localStorage.getItem('matchpoint-variant');
    return (saved as VariantId) || 'v2-talent-centric';
  });
  const [showVariantMenu, setShowVariantMenu] = useState(false);

  // Global state for dev tools
  const [agentActive, setAgentActive] = useState(true);
  const [showOz, setShowOz] = useState(false);
  const [userName, setUserName] = useState(() => getRandomUserName());
  const [customUserName, setCustomUserName] = useState<string | null>(() => {
    const saved = localStorage.getItem('matchpoint-custom-name');
    return saved || null;
  });

  const toTitleCase = (str: string) => {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  };

  const displayUserName = customUserName || userName;

  const handleSetCustomName = (name: string) => {
    const titleCased = toTitleCase(name);
    setCustomUserName(titleCased);
    localStorage.setItem('matchpoint-custom-name', titleCased);
  };

  const handleClearCustomName = () => {
    setCustomUserName(null);
    localStorage.removeItem('matchpoint-custom-name');
    setUserName(getRandomUserName());
  };

  useEffect(() => {
    localStorage.setItem('matchpoint-variant', currentVariant);
  }, [currentVariant]);

  const variant = VARIANTS.find((v) => v.id === currentVariant) || VARIANTS[0];
  const VariantComponent = variant.component;

  return (
    <>
      <VariantComponent
        agentActive={agentActive}
        showOz={showOz}
        onToggleOz={() => setShowOz(!showOz)}
        userName={displayUserName}
      />

      {/* Variant Switcher */}
      <div className="variant-switcher">
        <button
          className="variant-switcher-trigger"
          onClick={() => setShowVariantMenu(!showVariantMenu)}
          title="Switch variant"
        >
          <Layers size={18} />
        </button>

        {showVariantMenu && (
          <>
            <div className="variant-menu">
              <div className="variant-menu-header">Variants</div>
              {VARIANTS.map((v) => (
                <button
                  key={v.id}
                  className={`variant-menu-item ${v.id === currentVariant ? 'active' : ''}`}
                  onClick={() => {
                    setCurrentVariant(v.id);
                    setShowVariantMenu(false);
                  }}
                >
                  {v.label}
                </button>
              ))}
              <div className="variant-menu-divider" />
              <button
                className={`variant-menu-item variant-menu-item-oz ${showOz ? 'active' : ''}`}
                onClick={() => {
                  setShowOz(!showOz);
                  setShowVariantMenu(false);
                }}
              >
                <Database size={16} />
                <span>Oz</span>
              </button>
            </div>
            <div
              className="variant-menu-backdrop"
              onClick={() => setShowVariantMenu(false)}
            />
          </>
        )}
      </div>

      {/* Dev Menu */}
      <DevMenu
        agentActive={agentActive}
        onToggleAgent={() => setAgentActive(!agentActive)}
        showOz={showOz}
        onToggleOz={() => setShowOz(!showOz)}
        customUserName={customUserName}
        onSetCustomName={handleSetCustomName}
        onClearCustomName={handleClearCustomName}
      />

      {/* Global Oz Panel Overlay */}
      <OzPanel isOpen={showOz} onClose={() => setShowOz(false)} />
    </>
  );
}
