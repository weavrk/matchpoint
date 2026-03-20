import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import './UnmatchedRolesModal.css';

interface UnmatchedRole {
  title: string;
  company: string;
  count: number;
}

interface ExistingRole {
  id: string;
  title: string;
  category: string;
}

interface UnmatchedRolesModalProps {
  isOpen: boolean;
  onClose: () => void;
  unmatchedRoles: UnmatchedRole[];
  existingRoles: ExistingRole[];
  onAddRoles: (newRoles: { title: string; category: string }[]) => void;
  onMapRoles: (mappings: { unmatchedTitle: string; existingRoleId: string }[]) => void;
  onIgnoreRoles?: (titles: string[]) => void;
}

type RoleAction =
  | { type: 'add'; category: 'Entry-Level' | 'Specialized' | 'Management' }
  | { type: 'map'; existingRoleId: string }
  | { type: 'ignore' }
  | { type: 'none' };

export function UnmatchedRolesModal({
  isOpen,
  onClose,
  unmatchedRoles,
  existingRoles,
  onAddRoles,
  onMapRoles,
  onIgnoreRoles,
}: UnmatchedRolesModalProps) {
  // Track action for each unmatched role
  const [actions, setActions] = useState<Map<string, RoleAction>>(new Map());

  if (!isOpen) return null;

  const getAction = (title: string): RoleAction => {
    return actions.get(title) || { type: 'none' };
  };

  const setAction = (title: string, action: RoleAction) => {
    const newActions = new Map(actions);
    newActions.set(title, action);
    setActions(newActions);
  };

  const handleAddCheck = (title: string, checked: boolean) => {
    if (checked) {
      setAction(title, { type: 'add', category: 'Entry-Level' });
    } else {
      setAction(title, { type: 'none' });
    }
  };

  const handleCategoryChange = (title: string, category: 'Entry-Level' | 'Specialized' | 'Management') => {
    const current = getAction(title);
    if (current.type === 'add') {
      setAction(title, { type: 'add', category });
    }
  };

  const handleMapChange = (title: string, existingRoleId: string) => {
    if (existingRoleId === '') {
      // Reset to none if "Select" is chosen
      const current = getAction(title);
      if (current.type === 'map') {
        setAction(title, { type: 'none' });
      }
    } else {
      setAction(title, { type: 'map', existingRoleId });
    }
  };

  const handleIgnore = (title: string) => {
    setAction(title, { type: 'ignore' });
  };

  const handleConfirm = () => {
    const newRoles: { title: string; category: string }[] = [];
    const mappings: { unmatchedTitle: string; existingRoleId: string }[] = [];
    const ignoredTitles: string[] = [];

    for (const role of unmatchedRoles) {
      const action = getAction(role.title);
      if (action.type === 'add') {
        newRoles.push({ title: role.title, category: action.category });
      } else if (action.type === 'map') {
        mappings.push({ unmatchedTitle: role.title, existingRoleId: action.existingRoleId });
      } else if (action.type === 'ignore') {
        ignoredTitles.push(role.title);
      }
    }

    if (newRoles.length > 0) {
      onAddRoles(newRoles);
    }
    if (mappings.length > 0) {
      onMapRoles(mappings);
    }
    if (ignoredTitles.length > 0 && onIgnoreRoles) {
      onIgnoreRoles(ignoredTitles);
    }
    onClose();
  };

  const hasActions = Array.from(actions.values()).some(a => a.type !== 'none');

  return (
    <div className="unmatched-modal-overlay" onClick={onClose}>
      <div className="unmatched-modal" onClick={e => e.stopPropagation()}>
        <div className="unmatched-modal-header">
          <h2>Unmatched Job Titles</h2>
          <p className="unmatched-modal-subtitle">
            These job titles don't match any roles in our database. Add them as new roles or map them to existing ones.
          </p>
          <button className="unmatched-modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="unmatched-modal-body">
          <div className="unmatched-list-header">
            <span className="unmatched-col-title">Job Title</span>
            <span className="unmatched-col-add">Add</span>
            <span className="unmatched-col-category">Category</span>
            <span className="unmatched-col-divider"></span>
            <span className="unmatched-col-map">Map to Existing</span>
            <span className="unmatched-col-ignore"></span>
          </div>

          <div className="unmatched-list">
            {unmatchedRoles.map(role => {
              const action = getAction(role.title);
              const isAdding = action.type === 'add';
              const isMapped = action.type === 'map';
              const isIgnored = action.type === 'ignore';

              return (
                <div key={role.title} className={`unmatched-row ${isIgnored ? 'unmatched-row--ignored' : ''}`}>
                  <div className="unmatched-col-title">
                    <span className="unmatched-role-title">{role.title}</span>
                    <span className="unmatched-role-meta">
                      {role.company} • {role.count} posting{role.count > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="unmatched-col-add">
                    <input
                      type="checkbox"
                      checked={isAdding}
                      onChange={e => handleAddCheck(role.title, e.target.checked)}
                      disabled={isMapped || isIgnored}
                    />
                  </div>

                  <div className="unmatched-col-category">
                    <select
                      value={isAdding ? action.category : ''}
                      onChange={e => handleCategoryChange(role.title, e.target.value as any)}
                      disabled={!isAdding || isIgnored}
                      className={!isAdding || isIgnored ? 'disabled' : ''}
                    >
                      <option value="Entry-Level">Entry-Level</option>
                      <option value="Specialized">Specialized</option>
                      <option value="Management">Management</option>
                    </select>
                  </div>

                  <div className="unmatched-col-divider"></div>

                  <div className="unmatched-col-map">
                    <select
                      value={isMapped ? action.existingRoleId : ''}
                      onChange={e => handleMapChange(role.title, e.target.value)}
                      disabled={isAdding || isIgnored}
                      className={isAdding || isIgnored ? 'disabled' : ''}
                    >
                      <option value="">Select</option>
                      {existingRoles.map(er => (
                        <option key={er.id} value={er.id}>
                          {er.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="unmatched-col-ignore">
                    <button
                      className={`unmatched-ignore-btn ${isIgnored ? 'unmatched-ignore-btn--active' : ''}`}
                      onClick={() => handleIgnore(role.title)}
                    >
                      Ignore
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="unmatched-modal-footer">
          <button className="unmatched-skip-btn" onClick={onClose}>
            Skip
          </button>
          <button
            className="unmatched-confirm-btn"
            onClick={handleConfirm}
            disabled={!hasActions}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
