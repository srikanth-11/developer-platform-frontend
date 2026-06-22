import { useEffect, useRef, useState } from 'react';
import { animate, useReducedMotion, type Variants } from 'framer-motion';

/** A calm, slightly springy ease used across entrance animations. */
const EASE = [0.16, 1, 0.3, 1] as const;

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.4, ease: EASE } },
};

/** Parent that staggers its `fadeInUp` children. */
export const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

/**
 * Count a number up from its previous value → `value`. Honors reduced-motion
 * (jumps straight to the value). Returns the live (fractional) number — format
 * it at the call site.
 */
export function useCountUp(value: number, duration = 0.9): number {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(value);
  const from = useRef(value);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      from.current = value;
      return;
    }
    const controls = animate(from.current, value, {
      duration,
      ease: EASE,
      onUpdate: (v) => setDisplay(v),
    });
    from.current = value;
    return () => controls.stop();
  }, [value, duration, reduce]);

  return display;
}
