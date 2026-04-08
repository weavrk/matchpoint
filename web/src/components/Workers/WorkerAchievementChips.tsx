import { Trophy, Sparkles, Heart, HeartPlus, UserStar, ClockCheck } from 'lucide-react';
import type { MatchedWorker, WorkerProfile } from '../../types';

interface WorkerAchievementChipsProps {
  worker: MatchedWorker | WorkerProfile;
}

type ChipVariant = 'tag-pink' | 'tag-green';

interface ChipData {
  text: string;
  icon: React.ReactNode;
  variant: ChipVariant;
}

/**
 * WorkerAchievementChips - Reusable achievement/reliability chips (tag-sm)
 *
 * Display logic:
 * - Store Favorite: storeFavoriteCount > 2 (favorited at more than 2 stores) [pink]
 * - Consistently Punctual: on-time > 85% (100 - tardyPercent), or tardyRatio "0/x" / never late [green]
 * - Exceptional Commitment: urgentCancelPercent < 5% [green]
 * - 0 Call-Outs: urgentCancelRatio starts with "0/" [green]
 * - High Demand: storeFavoriteCount / uniqueStoreCount >= 85% [green]
 * - High Invite Back: invitedBackStores / uniqueStoreCount >= 94% [green]
 */
export function WorkerAchievementChips({ worker }: WorkerAchievementChipsProps) {
  const chips: ChipData[] = [];

  if ((worker.reflexActivity?.storeFavoriteCount ?? 0) > 2) {
    chips.push({
      text: 'Your Store Favorite',
      icon: <Heart size={14} />,
      variant: 'tag-pink',
    });
  }

  const neverLateByRatio =
    !!worker.tardyRatio &&
    (worker.tardyRatio.startsWith('0 /') || worker.tardyRatio.startsWith('0/'));
  const onTimePercent =
    worker.tardyPercent != null ? Math.min(100 - worker.tardyPercent, 100) : null;
  const meetsPunctualBar =
    neverLateByRatio ||
    worker.tardyPercent === 0 ||
    (onTimePercent != null && onTimePercent > 85);

  if (meetsPunctualBar) {
    chips.push({
      text: 'Consistently On-Time',
      icon: <ClockCheck size={14} />,
      variant: 'tag-green',
    });
  }

  if (worker.urgentCancelPercent != null && worker.urgentCancelPercent < 5) {
    chips.push({
      text: 'Low Cancel Rate',
      icon: <Sparkles size={14} />,
      variant: 'tag-green',
    });
  }

  if (worker.urgentCancelRatio && worker.urgentCancelRatio.startsWith('0 /')) {
    chips.push({
      text: 'Never Called Out',
      icon: <Trophy size={14} />,
      variant: 'tag-green',
    });
  }

  const storeFavoriteCount = worker.reflexActivity?.storeFavoriteCount;
  if (storeFavoriteCount != null && worker.uniqueStoreCount != null && worker.uniqueStoreCount > 0) {
    const favoritePercent = Math.min((storeFavoriteCount / worker.uniqueStoreCount) * 100, 100);
    if (favoritePercent >= 85) {
      chips.push({
        text: 'Strong Store Favorite',
        icon: <HeartPlus size={14} />,
        variant: 'tag-green',
      });
    }
  }

  if (worker.invitedBackStores != null && worker.uniqueStoreCount != null && worker.uniqueStoreCount > 0) {
    const inviteBackPercent = Math.min((worker.invitedBackStores / worker.uniqueStoreCount) * 100, 100);
    if (inviteBackPercent >= 94) {
      chips.push({
        text: 'Invite Back Standout',
        icon: <UserStar size={14} />,
        variant: 'tag-green',
      });
    }
  }

  if (chips.length === 0) return null;

  return (
    <div className="worker-achievement-chips">
      {chips.map((chip, idx) => (
        <span key={idx} className={`tag ${chip.variant} tag-sm`}>
          <span className="tag-icon">{chip.icon}</span>
          <span className="tag-text">{chip.text}</span>
        </span>
      ))}
    </div>
  );
}
