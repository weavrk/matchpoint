import { Award, Trophy, Sparkles, Heart, HeartPlus, UserStar, ClockCheck } from 'lucide-react';
import type { MatchedWorker, WorkerProfile } from '../../types';

interface WorkerAchievementChipsProps {
  worker: MatchedWorker | WorkerProfile;
}

interface ChipData {
  text: string;
  icon: React.ReactNode;
  variant: 'green' | 'green-light';
}

/**
 * WorkerAchievementChips - Reusable achievement/reliability chips (tag-md)
 *
 * Display logic:
 * - Market Favorite: marketFavorite === true (worker is favorited/approved by retailer stores) [green]
 * - 100% On-Time: tardyRatio = "0/x" (never late) [green]
 * - X% On-Time: 100 - tardyPercent (shown if tardyPercent < 10%, capped at 100%) [green-light]
 * - Exceptional Commitment: urgentCancelPercent < 5% [green-light]
 * - 0 Call-Outs: urgentCancelRatio starts with "0/" [green]
 * - X% Favorite Rating: storeFavoriteCount / uniqueStoreCount (shown if >= 89%, capped at 100%) [green]
 * - X% Invite Back Rate: invitedBackStores / uniqueStoreCount (shown if >= 94%, capped at 100%) [green-light]
 */
export function WorkerAchievementChips({ worker }: WorkerAchievementChipsProps) {
  const chips: ChipData[] = [];

  // Market Favorite: worker is favorited/approved by retailer stores in their market
  if (worker.marketFavorite) {
    chips.push({
      text: 'Market Favorite',
      icon: <Heart size={16} />,
      variant: 'green'
    });
  }

  // On-Time: show percentage if tardyPercent < 10% (90%+ on-time)
  if (worker.tardyRatio && worker.tardyRatio.startsWith('0 /')) {
    chips.push({
      text: '100% On-Time',
      icon: <Award size={16} />,
      variant: 'green'
    });
  } else if (worker.tardyPercent != null && worker.tardyPercent < 10) {
    const onTimePercent = Math.min(100 - worker.tardyPercent, 100);
    chips.push({
      text: `${Math.round(onTimePercent)}% On-Time`,
      icon: <ClockCheck size={16} />,
      variant: 'green-light'
    });
  }

  // Exceptional Commitment: urgentCancelPercent < 5%
  if (worker.urgentCancelPercent != null && worker.urgentCancelPercent < 5) {
    chips.push({
      text: 'Exceptional Commitment',
      icon: <Sparkles size={16} />,
      variant: 'green-light'
    });
  }

  // 0 Call-Outs: urgentCancelRatio = "0/x"
  if (worker.urgentCancelRatio && worker.urgentCancelRatio.startsWith('0 /')) {
    chips.push({
      text: '0 Call-Outs',
      icon: <Trophy size={16} />,
      variant: 'green'
    });
  }

  // 90% Favorite Rating: storeFavoriteCount >= 89% of uniqueStoreCount
  const storeFavoriteCount = worker.reflexActivity?.storeFavoriteCount;
  if (storeFavoriteCount != null && worker.uniqueStoreCount != null && worker.uniqueStoreCount > 0) {
    const favoritePercent = Math.min((storeFavoriteCount / worker.uniqueStoreCount) * 100, 100);
    if (favoritePercent >= 89) {
      chips.push({
        text: `${Math.round(favoritePercent)}% Favorite Rating`,
        icon: <HeartPlus size={16} />,
        variant: 'green'
      });
    }
  }

  // 95% Invite Back Rate: invitedBackStores >= 94% of uniqueStoreCount
  if (worker.invitedBackStores != null && worker.uniqueStoreCount != null && worker.uniqueStoreCount > 0) {
    const inviteBackPercent = Math.min((worker.invitedBackStores / worker.uniqueStoreCount) * 100, 100);
    if (inviteBackPercent >= 94) {
      chips.push({
        text: `${Math.round(inviteBackPercent)}% Invite Back Rate`,
        icon: <UserStar size={16} />,
        variant: 'green-light'
      });
    }
  }

  if (chips.length === 0) return null;

  // Sort chips: green (dark) first, then green-light
  const sortedChips = [...chips].sort((a, b) => {
    if (a.variant === 'green' && b.variant === 'green-light') return -1;
    if (a.variant === 'green-light' && b.variant === 'green') return 1;
    return 0;
  });

  return (
    <div className="worker-achievement-chips">
      {sortedChips.map((chip, idx) => (
        <span key={idx} className={`tag tag-${chip.variant} tag-md`}>
          <span className="tag-icon">{chip.icon}</span>
          <span className="tag-text">{chip.text}</span>
        </span>
      ))}
    </div>
  );
}
