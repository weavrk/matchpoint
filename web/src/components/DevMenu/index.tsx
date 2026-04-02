import { useState, useRef, useEffect } from 'react';
import { BotOff, BotMessageSquare, Palette, Send, X } from 'lucide-react';
import { DesignSystemPanel } from './DesignSystemPanel';

interface DevMenuProps {
  agentActive: boolean;
  onToggleAgent: () => void;
  showOz: boolean;
  onToggleOz: () => void;
  customUserName: string | null;
  onSetCustomName: (name: string) => void;
  onClearCustomName: () => void;
}

export function DevMenu({ agentActive, onToggleAgent, showOz: _showOz, onToggleOz: _onToggleOz, customUserName, onSetCustomName, onClearCustomName }: DevMenuProps) {
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
            <div className="dev-menu-divider" />
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
