import { useState, useEffect } from 'react';
import { Layers } from 'lucide-react';
import { V1JobFocus } from './variants/V1JobFocus';
import { V2TalentCentric } from './variants/V2TalentCentric';
import { V3Wildcard } from './variants/V3Wildcard';
import { DevMenu } from '../components/DevMenu';
import './PermanentHiring.css';

type VariantId = 'v1-job-focus' | 'v2-talent-centric' | 'v3-wildcard';

// Props passed down to variants
export interface VariantProps {
  agentActive: boolean;
  showOz: boolean;
  onToggleOz: () => void;
}

const VARIANTS: { id: VariantId; label: string; component: React.ComponentType<VariantProps> }[] = [
  { id: 'v1-job-focus', label: 'V1: Job Focus', component: V1JobFocus },
  { id: 'v2-talent-centric', label: 'V2: Talent Centric', component: V2TalentCentric as React.ComponentType<VariantProps> },
  { id: 'v3-wildcard', label: 'V3: Wildcard', component: V3Wildcard as React.ComponentType<VariantProps> },
];

export function PermanentHiring() {
  const [currentVariant, setCurrentVariant] = useState<VariantId>(() => {
    const saved = localStorage.getItem('matchpoint-variant');
    return (saved as VariantId) || 'v1-job-focus';
  });
  const [showVariantMenu, setShowVariantMenu] = useState(false);

  // Global state for dev tools
  const [agentActive, setAgentActive] = useState(true);
  const [showOz, setShowOz] = useState(false);

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
      />
    </>
  );
}
