import type { MatchedWorker, WorkerProfile } from '../../types';

interface WorkerAchievementChipsProps {
  worker: MatchedWorker | WorkerProfile;
}

/**
 * WorkerAchievementChips - Reusable achievement/reliability chips
 *
 * Display logic:
 * - Punctual: tardyPercent < 10%
 * - Exceptional Commitment: urgentCancelPercent < 5%
 * - 0 Call-Outs: urgentCancelRatio starts with "0/"
 * - 90% Favorite Rating: storeFavoriteCount >= 89% of uniqueStoreCount
 * - 95% Invite Back Rate: invitedBackStores >= 94% of uniqueStoreCount
 */
export function WorkerAchievementChips({ worker }: WorkerAchievementChipsProps) {
  const chips: string[] = [];

  // 100% On-Time: tardyRatio = "0/x" (never late)
  // Consistently Punctual: tardyPercent < 10% (but not perfect)
  if (worker.tardyRatio && worker.tardyRatio.startsWith('0 /')) {
    chips.push('100% On-Time');
  } else if (worker.tardyPercent != null && worker.tardyPercent < 10) {
    chips.push('Consistently Punctual');
  }

  // Exceptional Commitment: urgentCancelPercent < 5%
  if (worker.urgentCancelPercent != null && worker.urgentCancelPercent < 5) {
    chips.push('Exceptional Commitment');
  }

  // 0 Call-Outs: urgentCancelRatio = "0/x"
  if (worker.urgentCancelRatio && worker.urgentCancelRatio.startsWith('0 /')) {
    chips.push('0 Call-Outs');
  }

  // 90% Favorite Rating: storeFavoriteCount >= 89% of uniqueStoreCount
  const storeFavoriteCount = worker.reflexActivity?.storeFavoriteCount;
  if (storeFavoriteCount != null && worker.uniqueStoreCount != null && worker.uniqueStoreCount > 0) {
    const favoritePercent = (storeFavoriteCount / worker.uniqueStoreCount) * 100;
    if (favoritePercent >= 89) {
      chips.push(`${Math.round(favoritePercent)}% Favorite Rating`);
    }
  }

  // 95% Invite Back Rate: invitedBackStores >= 94% of uniqueStoreCount
  if (worker.invitedBackStores != null && worker.uniqueStoreCount != null && worker.uniqueStoreCount > 0) {
    const inviteBackPercent = (worker.invitedBackStores / worker.uniqueStoreCount) * 100;
    if (inviteBackPercent >= 94) {
      chips.push(`${Math.round(inviteBackPercent)}% Invite Back Rate`);
    }
  }

  if (chips.length === 0) return null;

  return (
    <div className="worker-achievement-chips">
      {chips.map((chip, idx) => (
        <span key={idx} className="tag tag-green tag-sm">
          <span className="tag-text">{chip}</span>
        </span>
      ))}
    </div>
  );
}
