import type { ReactNode } from 'react';
import { V2NavFooter } from './V2NavFooter';

/**
 * V2Main - Reusable main content area for V2 Talent Centric flow
 *
 * This IS the v2-main container - it provides consistent layout, padding,
 * animations, and navigation footer for each step in the flow.
 * Content renders directly inside without extra wrapper divs.
 *
 * DSL Reference: Page Components > .v2-main
 */

export type TransitionDirection = 'forward' | 'back';

export interface V2MainProps {
  /** Content to render inside */
  children: ReactNode;
  /** Whether the step is currently transitioning */
  isTransitioning?: boolean;
  /** Direction of the transition animation */
  transitionDirection?: TransitionDirection;
  /** Step-specific CSS class (e.g., 'v2-persona-step', 'v2-brands-step') */
  stepClassName?: string;
  /** Navigation footer props */
  footer?: {
    onBack?: () => void;
    onNext?: () => void;
    showBack?: boolean;
    nextDisabled?: boolean;
    nextLabel?: string;
    backLabel?: string;
  };
  /** Hide the footer entirely */
  hideFooter?: boolean;
}

/**
 * Get CSS classes for step transition animations
 */
function getTransitionClass(
  isTransitioning: boolean,
  direction: TransitionDirection
): string {
  if (isTransitioning) {
    return direction === 'forward' ? 'slide-out-left' : 'slide-out-right';
  }
  return 'slide-in-right';
}

export function V2Main({
  children,
  isTransitioning = false,
  transitionDirection = 'forward',
  stepClassName = '',
  footer,
  hideFooter = false,
}: V2MainProps) {
  const transitionClass = getTransitionClass(isTransitioning, transitionDirection);
  const combinedClassName = `v2-main ${transitionClass} ${stepClassName}`.trim();

  return (
    <div className={combinedClassName}>
      {children}

      {!hideFooter && footer && (
        <V2NavFooter
          onBack={footer.onBack}
          onNext={footer.onNext}
          showBack={footer.showBack}
          nextDisabled={footer.nextDisabled}
          nextLabel={footer.nextLabel}
          backLabel={footer.backLabel}
        />
      )}
    </div>
  );
}

export default V2Main;
