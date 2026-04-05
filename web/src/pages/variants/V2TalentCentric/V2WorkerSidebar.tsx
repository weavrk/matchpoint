import { ChevronRight, ChevronLeft, MapPin, Users, Loader2 } from 'lucide-react';
import { WorkerCardChip } from '../../../components/Workers/WorkerCardChip';
import type { MatchedWorker } from '../../../types';

/**
 * V2WorkerSidebar - Reusable right sidebar showing matching workers
 *
 * Displays a collapsible panel with worker cards based on current filter criteria.
 * Used across all V2 flow steps except welcome and user persona screens.
 */

export interface V2WorkerSidebarProps {
  /** Array of workers to display */
  workers: MatchedWorker[];
  /** Whether the sidebar is open/expanded */
  isOpen: boolean;
  /** Callback to toggle sidebar open/closed */
  onToggle: () => void;
  /** Title to display in the header */
  title: string;
  /** Whether to show the count badge */
  showCount?: boolean;
  /** Callback when a worker card is clicked */
  onWorkerClick?: (worker: MatchedWorker) => void;
  /** Empty state message */
  emptyMessage?: string;
  /** Whether workers are currently loading */
  isLoading?: boolean;
}

export function V2WorkerSidebar({
  workers,
  isOpen,
  onToggle,
  title,
  showCount = true,
  onWorkerClick,
  emptyMessage = 'No matches yet. Try selecting different brands or criteria.',
  isLoading = false,
}: V2WorkerSidebarProps) {
  // Determine if this is a location-specific empty state
  const isLocationEmpty = emptyMessage.toLowerCase().includes('market');

  return (
    <div className={`v2-sidebar ${isOpen ? '' : 'collapsed'}`}>
      <button
        className="v2-sidebar-toggle"
        onClick={onToggle}
        aria-label={isOpen ? 'Close panel' : 'Open panel'}
      >
        {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
      <div className="v2-sidebar-header">
        <h2 className="type-section-header-md">{title}</h2>
        {showCount && workers.length > 0 && (
          <span className="v2-sidebar-count">{workers.length} found</span>
        )}
      </div>

      <div className="v2-sidebar-cards">
        {isLoading ? (
          <div className="v2-no-matches v2-loading-state">
            <div className="v2-empty-icon">
              <Loader2 size={32} className="v2-spinner" />
            </div>
            <p>Loading talent...</p>
          </div>
        ) : workers.length === 0 ? (
          <div className="v2-no-matches">
            <div className="v2-empty-icon">
              {isLocationEmpty ? (
                <MapPin size={32} strokeWidth={1.5} />
              ) : (
                <Users size={32} strokeWidth={1.5} />
              )}
            </div>
            <p>{emptyMessage}</p>
          </div>
        ) : (
          workers.map(worker => (
            <WorkerCardChip
              key={worker.id}
              worker={worker}
              onClick={() => onWorkerClick?.(worker)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default V2WorkerSidebar;
