import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import { WorkerCardAllAvailableData } from '../Workers/WorkerCardAllAvailableData';
import { fetchWorkersPaginated, workerRowToProfile } from '../../services/supabase';
import type { MatchedWorker } from '../../types';
import './WorkerDataDrawer.css';

interface WorkerDataDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const WORKERS_PER_PAGE = 10;

export function WorkerDataDrawer({ isOpen, onClose }: WorkerDataDrawerProps) {
  const [workers, setWorkers] = useState<MatchedWorker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch workers from Supabase
  const loadMoreWorkers = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const { workers: newWorkers, hasMore: more } = await fetchWorkersPaginated(
        workers.length,
        WORKERS_PER_PAGE
      );

      // Convert WorkerRow to MatchedWorker
      const profiles = newWorkers.map(row => {
        const profile = workerRowToProfile(row);
        return { ...profile, matchScore: 0, matchReasons: [] } as MatchedWorker;
      });

      setWorkers(prev => [...prev, ...profiles]);
      setHasMore(more);

      // Update total count on first load
      if (totalCount === null && newWorkers.length > 0) {
        // Estimate from hasMore - if we got a full page and hasMore, there are more
        setTotalCount(more ? workers.length + WORKERS_PER_PAGE + 100 : workers.length + newWorkers.length);
      }
    } catch (error) {
      console.error('Error fetching workers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [workers.length, isLoading, hasMore, totalCount]);

  // Reset and load initial workers when drawer opens
  useEffect(() => {
    if (isOpen) {
      setWorkers([]);
      setHasMore(true);
      setTotalCount(null);
    }
  }, [isOpen]);

  // Load initial workers after reset
  useEffect(() => {
    if (isOpen && workers.length === 0 && hasMore && !isLoading) {
      loadMoreWorkers();
    }
  }, [isOpen, workers.length, hasMore, isLoading, loadMoreWorkers]);

  // Intersection observer for infinite scroll
  const handleObserver = useCallback((entries: IntersectionObserverEntry[]) => {
    const target = entries[0];
    if (target.isIntersecting && hasMore && !isLoading) {
      loadMoreWorkers();
    }
  }, [hasMore, isLoading, loadMoreWorkers]);

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, {
      root: containerRef.current,
      rootMargin: '200px',
      threshold: 0.1,
    });

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [handleObserver]);

  if (!isOpen) return null;

  return (
    <>
      <div className="worker-data-backdrop" onClick={onClose} />
      <div className="worker-data-drawer">
        <div className="worker-data-header">
          <h1>Worker Data</h1>
          <span className="worker-data-count">
            {workers.length}{hasMore ? '+' : ''} workers
          </span>
          <button className="worker-data-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="worker-data-content" ref={containerRef}>
          <div className="worker-data-grid">
            {workers.map((worker) => (
              <WorkerCardAllAvailableData key={worker.id} worker={worker} />
            ))}
          </div>

          {(hasMore || isLoading) && (
            <div ref={loaderRef} className="worker-data-loader">
              {isLoading ? (
                <span>Loading workers...</span>
              ) : (
                <span>Scroll for more</span>
              )}
            </div>
          )}

          {!hasMore && workers.length > 0 && (
            <div className="worker-data-loader">
              <span>All {workers.length} workers loaded</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default WorkerDataDrawer;
