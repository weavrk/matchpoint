import { useState, useRef, useEffect } from 'react';
import { BotOff, BotMessageSquare, Palette, Send, X, Layers, Database, Users } from 'lucide-react';
import { DesignSystemPanel } from './DesignSystemPanel';

type VariantId = 'v1-job-focus' | 'v2-talent-centric' | 'v3-wildcard';

interface DevMenuProps {
  agentActive: boolean;
  onToggleAgent: () => void;
  showOz: boolean;
  onToggleOz: () => void;
  showWorkerData: boolean;
  onToggleWorkerData: () => void;
  currentVariant: VariantId;
  onChangeVariant: (variant: VariantId) => void;
  customUserName: string | null;
  onSetCustomName: (name: string) => void;
  onClearCustomName: () => void;
}

const VARIANTS: { id: VariantId; label: string }[] = [
  { id: 'v1-job-focus', label: 'V1: Job Focus' },
  { id: 'v2-talent-centric', label: 'V2: Talent Centric' },
  { id: 'v3-wildcard', label: 'V3: Wildcard' },
];

export function DevMenu({ agentActive, onToggleAgent, showOz, onToggleOz, showWorkerData, onToggleWorkerData, currentVariant, onChangeVariant, customUserName, onSetCustomName, onClearCustomName }: DevMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDesignSystem, setShowDesignSystem] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMenu]);

  return (
    <>
      <div className="dev-menu-container" ref={menuRef}>
        <button
          className="dev-menu-trigger"
          onClick={() => setShowMenu(!showMenu)}
          title="Dev Tools"
        />
        {showMenu && (
          <div className="dev-menu-dropdown">
            {/* Name input at top */}
            <div className="dev-menu-name-input">
              <input
                type="text"
                placeholder={customUserName || "Change name..."}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && nameInput.trim()) {
                    onSetCustomName(nameInput.trim());
                    setNameInput('');
                  }
                }}
              />
              <button
                className="dev-menu-name-send"
                onClick={() => {
                  if (nameInput.trim()) {
                    onSetCustomName(nameInput.trim());
                    setNameInput('');
                  }
                }}
                disabled={!nameInput.trim()}
              >
                <Send size={12} />
              </button>
              {customUserName && (
                <button
                  className="dev-menu-name-clear"
                  onClick={() => {
                    onClearCustomName();
                    setNameInput('');
                  }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              className="dev-menu-item"
              onClick={() => {
                setShowDesignSystem(true);
                setShowMenu(false);
              }}
            >
              <span className="dev-menu-icon">
                <Palette size={16} />
              </span>
              <span className="dev-menu-label">Design System</span>
            </button>
            <div className="dev-menu-divider" />
            {/* Source Data */}
            <div className="dev-menu-section-header">Source Data</div>
            <button
              className={`dev-menu-item${showOz ? ' active' : ''}`}
              onClick={() => {
                onToggleOz();
                setShowMenu(false);
              }}
            >
              <span className="dev-menu-icon">
                <Database size={16} />
              </span>
              <span className="dev-menu-label">Oz</span>
            </button>
            <button
              className={`dev-menu-item${showWorkerData ? ' active' : ''}`}
              onClick={() => {
                onToggleWorkerData();
                setShowMenu(false);
              }}
            >
              <span className="dev-menu-icon">
                <Users size={16} />
              </span>
              <span className="dev-menu-label">Worker Data</span>
            </button>
            <div className="dev-menu-divider" />
            {/* Variants */}
            <div className="dev-menu-section-header">Variants</div>
            {VARIANTS.map((v) => (
              <button
                key={v.id}
                className={`dev-menu-item${v.id === currentVariant ? ' active' : ''}`}
                onClick={() => {
                  onChangeVariant(v.id);
                  setShowMenu(false);
                }}
              >
                <span className="dev-menu-icon">
                  <Layers size={16} />
                </span>
                <span className="dev-menu-label">{v.label}</span>
              </button>
            ))}
            <div className="dev-menu-divider" />
            {/* Good Bot at bottom */}
            <button
              className={`dev-menu-item dev-menu-item-bot${agentActive ? ' bot-on' : ''}`}
              onClick={() => {
                onToggleAgent();
                setShowMenu(false);
              }}
            >
              <span className="dev-menu-icon">
                {agentActive ? <BotMessageSquare size={16} /> : <BotOff size={16} />}
              </span>
              <span className="dev-menu-label">Good Bot {agentActive ? 'On' : 'Off'}</span>
            </button>
          </div>
        )}

        {showDesignSystem && (
          <DesignSystemPanel onClose={() => setShowDesignSystem(false)} />
        )}
      </div>

      {showDesignSystem && (
        <div className="design-system-backdrop" onClick={() => setShowDesignSystem(false)} />
      )}
    </>
  );
}

export { DevMenu as default };
