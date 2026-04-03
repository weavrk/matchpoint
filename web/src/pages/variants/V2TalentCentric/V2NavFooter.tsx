import { ChevronLeft, ChevronRight } from 'lucide-react';

interface V2NavFooterProps {
  onBack?: () => void;
  onNext?: () => void;
  showBack?: boolean;
  nextDisabled?: boolean;
  nextLabel?: string;
  backLabel?: string;
}

export function V2NavFooter({
  onBack,
  onNext,
  showBack = true,
  nextDisabled = false,
  nextLabel = 'Next',
  backLabel = 'Back',
}: V2NavFooterProps) {
  return (
    <div className="v2-nav-footer">
      <div className="v2-nav-footer-buttons">
        {showBack && onBack && (
          <button className="v2-btn-back" onClick={onBack}>
            <ChevronLeft size={20} />
            {backLabel}
          </button>
        )}
        {onNext && (
          <button
            className="v2-btn-next"
            onClick={onNext}
            disabled={nextDisabled}
          >
            {nextLabel}
            <ChevronRight size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
