import { ChevronRight, ChevronLeft } from 'lucide-react';
import { WorkerCardCompact } from '../../../components/Workers/WorkerCardCompact';
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
}

export function V2WorkerSidebar({
  workers,
  isOpen,
  onToggle,
  title,
  showCount = true,
  onWorkerClick,
  emptyMessage = 'No matches yet. Try selecting different brands or criteria.',
}: V2WorkerSidebarProps) {
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
        {workers.length === 0 ? (
          <div className="v2-no-matches">
            <p>{emptyMessage}</p>
          </div>
        ) : (
          workers.map(worker => (
            <WorkerCardCompact
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
