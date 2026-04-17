import { useState, useRef, useCallback, useEffect } from 'react';
import { ChevronRight, ChevronLeft, MapPin, Users, Loader2 } from 'lucide-react';
import { WorkerCardChip } from '../../../components/Workers/WorkerCardChip';
import type { MatchedWorker } from '../../../types';
import type { ReactNode } from 'react';

/**
 * V2SidebarShell - Reusable sidebar shell with expand/collapse toggle
 *
 * Provides the outer container with shadow, toggle button, and header.
 * Content is passed as children for flexibility.
 */
export interface V2SidebarShellProps {
  /** Whether the sidebar is open/expanded */
  isOpen: boolean;
  /** Callback to toggle sidebar open/closed */
  onToggle: () => void;
  /** Title to display in the header */
  title?: string;
  /** Optional subtitle/count badge */
  subtitle?: string;
  /** Content to render in the sidebar body */
  children: ReactNode;
  /** Additional class name for the sidebar */
  className?: string;
}

export function V2SidebarShell({
  isOpen,
  onToggle,
  title,
  subtitle,
  children,
  className = '',
}: V2SidebarShellProps) {
  return (
    <div className={`v2-sidebar ${isOpen ? '' : 'collapsed'} ${className}`}>
      <button
        className="v2-sidebar-toggle"
        onClick={onToggle}
        aria-label={isOpen ? 'Close panel' : 'Open panel'}
      >
        {isOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
      {title && (
        <div className="v2-sidebar-header">
          <h2 className="type-section-header-md">{title}</h2>
          {subtitle && (
            <span className="v2-sidebar-count">{subtitle}</span>
          )}
        </div>
      )}
      <div className="v2-sidebar-cards">
        {children}
      </div>
    </div>
  );
}

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
  /** Check if a worker is connected */
  isWorkerConnected?: (workerId: string) => boolean;
  /** Check if a worker is saved/liked */
  isWorkerLiked?: (workerId: string) => boolean;
  /** Connect callback */
  onWorkerConnect?: (worker: MatchedWorker) => void;
  /** Disconnect callback */
  onWorkerDisconnect?: (worker: MatchedWorker) => void;
  /** Like/save callback */
  onWorkerLike?: (worker: MatchedWorker) => void;
  /** Unlike/unsave callback */
  onWorkerUnlike?: (worker: MatchedWorker) => void;
}

const PAGE_SIZE = 20;

export function V2WorkerSidebar({
  workers,
  isOpen,
  onToggle,
  title,
  showCount = true,
  onWorkerClick,
  emptyMessage = 'No matches yet. Try selecting different brands or criteria.',
  isLoading = false,
  isWorkerConnected,
  isWorkerLiked,
  onWorkerConnect,
  onWorkerDisconnect,
  onWorkerLike,
  onWorkerUnlike,
}: V2WorkerSidebarProps) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset visible count when workers change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [workers]);

  // Intersection observer for infinite scroll
  const observerCallback = useCallback((entries: IntersectionObserverEntry[]) => {
    if (entries[0]?.isIntersecting && visibleCount < workers.length) {
      setVisibleCount(prev => Math.min(prev + PAGE_SIZE, workers.length));
    }
  }, [visibleCount, workers.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(observerCallback, { rootMargin: '200px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, [observerCallback]);

  const isLocationEmpty = emptyMessage.toLowerCase().includes('market');
  const visibleWorkers = workers.slice(0, visibleCount);

  return (
    <V2SidebarShell
      isOpen={isOpen}
      onToggle={onToggle}
      title={title}
      subtitle={showCount && workers.length > 0 ? `${workers.length} found` : undefined}
    >
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
        <>
          {visibleWorkers.map(worker => (
            <WorkerCardChip
              key={worker.id}
              worker={worker}
              onClick={() => onWorkerClick?.(worker)}
              isConnected={isWorkerConnected?.(worker.id)}
              isLiked={isWorkerLiked?.(worker.id)}
              onConnect={onWorkerConnect ? () => onWorkerConnect(worker) : undefined}
              onDisconnect={onWorkerDisconnect ? () => onWorkerDisconnect(worker) : undefined}
              onLike={onWorkerLike ? () => onWorkerLike(worker) : undefined}
              onUnlike={onWorkerUnlike ? () => onWorkerUnlike(worker) : undefined}
            />
          ))}
          {visibleCount < workers.length && (
            <div ref={sentinelRef} style={{ height: 1 }} />
          )}
        </>
      )}
    </V2SidebarShell>
  );
}

export default V2WorkerSidebar;
