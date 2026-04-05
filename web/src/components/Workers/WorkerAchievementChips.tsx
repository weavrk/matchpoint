import type { MatchedWorker, WorkerProfile } from '../../types';

interface WorkerAchievementChipsProps {
  worker: MatchedWorker | WorkerProfile;
}

/**
 * WorkerAchievementChips - Reusable achievement/reliability chips
 *
 * Display logic:
 * - X% On-Time: 100 - tardyPercent (shown if tardyPercent < 10%, capped at 100%)
 * - Exceptional Commitment: urgentCancelPercent < 5%
 * - 0 Call-Outs: urgentCancelRatio starts with "0/"
 * - X% Favorite Rating: storeFavoriteCount / uniqueStoreCount (shown if >= 89%, capped at 100%)
 * - X% Invite Back Rate: invitedBackStores / uniqueStoreCount (shown if >= 94%, capped at 100%)
 */
export function WorkerAchievementChips({ worker }: WorkerAchievementChipsProps) {
  const chips: string[] = [];

  // On-Time: show percentage if tardyPercent < 10% (90%+ on-time)
  if (worker.tardyRatio && worker.tardyRatio.startsWith('0 /')) {
    chips.push('100% On-Time');
  } else if (worker.tardyPercent != null && worker.tardyPercent < 10) {
    const onTimePercent = Math.min(100 - worker.tardyPercent, 100);
    chips.push(`${Math.round(onTimePercent)}% On-Time`);
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
    const favoritePercent = Math.min((storeFavoriteCount / worker.uniqueStoreCount) * 100, 100);
    if (favoritePercent >= 89) {
      chips.push(`${Math.round(favoritePercent)}% Favorite Rating`);
    }
  }

  // 95% Invite Back Rate: invitedBackStores >= 94% of uniqueStoreCount
  if (worker.invitedBackStores != null && worker.uniqueStoreCount != null && worker.uniqueStoreCount > 0) {
    const inviteBackPercent = Math.min((worker.invitedBackStores / worker.uniqueStoreCount) * 100, 100);
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
