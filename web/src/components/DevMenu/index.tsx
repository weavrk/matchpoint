import { useState, useRef, useEffect } from 'react';
import { BotOff, BotMessageSquare, Palette } from 'lucide-react';
import { DesignSystemPanel } from './DesignSystemPanel';

interface DevMenuProps {
  agentActive: boolean;
  onToggleAgent: () => void;
  showOz: boolean;
  onToggleOz: () => void;
}

export function DevMenu({ agentActive, onToggleAgent, showOz: _showOz, onToggleOz: _onToggleOz }: DevMenuProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showDesignSystem, setShowDesignSystem] = useState(false);
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
