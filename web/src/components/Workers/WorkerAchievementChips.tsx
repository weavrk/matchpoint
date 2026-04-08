import { Award, Trophy, Sparkles, Heart, HeartPlus, UserStar, ClockCheck } from 'lucide-react';
import type { MatchedWorker, WorkerProfile } from '../../types';
import { hasEliteStoreFavorite } from '../../utils/storeFavoriteElite';

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
 * WorkerAchievementChips - Reusable achievement/reliability chips (tag-md)
 *
 * Display logic:
 * - Store Favorite: favoritedByBrands intersects elite retailer list [pink]
 * - 100% On-Time: tardyRatio = "0/x" (never late) [green]
 * - X% On-Time: 100 - tardyPercent (if tardyPercent < 10%) [green]
 * - Exceptional Commitment: urgentCancelPercent < 5% [green]
 * - 0 Call-Outs: urgentCancelRatio starts with "0/" [green]
 * - X% Favorite Rating: storeFavoriteCount / uniqueStoreCount (if >= 89%) [green]
 * - X% Invite Back Rate: invitedBackStores / uniqueStoreCount (if >= 94%) [green]
 */
export function WorkerAchievementChips({ worker }: WorkerAchievementChipsProps) {
  const chips: ChipData[] = [];

  if (hasEliteStoreFavorite(worker.favoritedByBrands)) {
    chips.push({
      text: 'Store Favorite',
      icon: <Heart size={16} />,
      variant: 'tag-pink',
    });
  }

  if (worker.tardyRatio && worker.tardyRatio.startsWith('0 /')) {
    chips.push({
      text: '100% On-Time',
      icon: <Award size={16} />,
      variant: 'tag-green',
    });
  } else if (worker.tardyPercent != null && worker.tardyPercent < 10) {
    const onTimePercent = Math.min(100 - worker.tardyPercent, 100);
    chips.push({
      text: `${Math.round(onTimePercent)}% On-Time`,
      icon: <ClockCheck size={16} />,
      variant: 'tag-green',
    });
  }

  if (worker.urgentCancelPercent != null && worker.urgentCancelPercent < 5) {
    chips.push({
      text: 'Exceptional Commitment',
      icon: <Sparkles size={16} />,
      variant: 'tag-green',
    });
  }

  if (worker.urgentCancelRatio && worker.urgentCancelRatio.startsWith('0 /')) {
    chips.push({
      text: '0 Call-Outs',
      icon: <Trophy size={16} />,
      variant: 'tag-green',
    });
  }

  const storeFavoriteCount = worker.reflexActivity?.storeFavoriteCount;
  if (storeFavoriteCount != null && worker.uniqueStoreCount != null && worker.uniqueStoreCount > 0) {
    const favoritePercent = Math.min((storeFavoriteCount / worker.uniqueStoreCount) * 100, 100);
    if (favoritePercent >= 89) {
      chips.push({
        text: `${Math.round(favoritePercent)}% Favorite Rating`,
        icon: <HeartPlus size={16} />,
        variant: 'tag-green',
      });
    }
  }

  if (worker.invitedBackStores != null && worker.uniqueStoreCount != null && worker.uniqueStoreCount > 0) {
    const inviteBackPercent = Math.min((worker.invitedBackStores / worker.uniqueStoreCount) * 100, 100);
    if (inviteBackPercent >= 94) {
      chips.push({
        text: `${Math.round(inviteBackPercent)}% Invite Back Rate`,
        icon: <UserStar size={16} />,
        variant: 'tag-green',
      });
    }
  }

  if (chips.length === 0) return null;

  return (
    <div className="worker-achievement-chips">
      {chips.map((chip, idx) => (
        <span key={idx} className={`tag ${chip.variant} tag-md`}>
          <span className="tag-icon">{chip.icon}</span>
          <span className="tag-text">{chip.text}</span>
        </span>
      ))}
    </div>
  );
}
