import { useState, useEffect } from 'react';
import { V1JobFocus } from './variants/V1JobFocus';
import { V2TalentCentric } from './variants/V2TalentCentric';
import { V3Wildcard } from './variants/V3Wildcard';
import { DevMenu } from '../components/DevMenu';
import { OzPanel } from '../components/OzPanel';
import { WorkerDataDrawer } from '../components/WorkerDataDrawer';
import './PermanentHiring.css';

type VariantId = 'v1-job-focus' | 'v2-talent-centric' | 'v3-wildcard';

// Props passed down to variants
export interface VariantProps {
  agentActive: boolean;
  showOz: boolean;
  onToggleOz: () => void;
  userName?: string;
}

interface PermanentHiringProps {
  userName: string;
  customUserName: string | null;
  onSetCustomName: (name: string) => void;
  onClearCustomName: () => void;
}

const VARIANTS: { id: VariantId; label: string; component: React.ComponentType<VariantProps> }[] = [
  { id: 'v1-job-focus', label: 'V1: Job Focus', component: V1JobFocus },
  { id: 'v2-talent-centric', label: 'V2: Talent Centric', component: V2TalentCentric as React.ComponentType<VariantProps> },
  { id: 'v3-wildcard', label: 'V3: Wildcard', component: V3Wildcard as React.ComponentType<VariantProps> },
];

export function PermanentHiring({ userName, customUserName, onSetCustomName, onClearCustomName }: PermanentHiringProps) {
  const [currentVariant, setCurrentVariant] = useState<VariantId>(() => {
    const saved = localStorage.getItem('matchpoint-variant');
    return (saved as VariantId) || 'v2-talent-centric';
  });

  // Global state for dev tools
  const [agentActive, setAgentActive] = useState(true);
  const [showOz, setShowOz] = useState(false);
  const [showWorkerData, setShowWorkerData] = useState(false);

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
        userName={userName}
      />

      {/* Dev Menu */}
      <DevMenu
        agentActive={agentActive}
        onToggleAgent={() => setAgentActive(!agentActive)}
        showOz={showOz}
        onToggleOz={() => setShowOz(!showOz)}
        showWorkerData={showWorkerData}
        onToggleWorkerData={() => setShowWorkerData(!showWorkerData)}
        currentVariant={currentVariant}
        onChangeVariant={setCurrentVariant}
        customUserName={customUserName}
        onSetCustomName={onSetCustomName}
        onClearCustomName={onClearCustomName}
      />

      {/* Global Oz Panel Overlay */}
      <OzPanel isOpen={showOz} onClose={() => setShowOz(false)} />

      {/* Worker Data Drawer */}
      <WorkerDataDrawer isOpen={showWorkerData} onClose={() => setShowWorkerData(false)} />
    </>
  );
}
