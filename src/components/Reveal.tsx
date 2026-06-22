import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer } from '@/lib/motion';

/**
 * Entrance wrapper. By default fades + lifts itself in; with `stagger`, it
 * orchestrates `RevealItem` children one after another. Reduced-motion users get
 * the end state instantly (framer-motion handles that).
 */
export function Reveal({
  children,
  className,
  stagger = false,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: boolean;
}) {
  return (
    <motion.div
      className={className}
      variants={stagger ? staggerContainer : fadeInUp}
      initial="hidden"
      animate="show"
    >
      {children}
    </motion.div>
  );
}

/** A single item inside a `<Reveal stagger>` container. */
export function RevealItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div className={className} variants={fadeInUp}>
      {children}
    </motion.div>
  );
}
