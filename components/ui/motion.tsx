"use client";

import { motion, type Variants } from "framer-motion";

// Fade up animation (default)
export const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

// Fade in animation (no movement)
export const fadeInVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

// Scale up animation
export const scaleUpVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 }
};

// Stagger container for children
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

// Motion wrapper component
interface MotionDivProps {
  children: React.ReactNode;
  className?: string;
  variants?: Variants;
  delay?: number;
}

export function MotionDiv({
  children,
  className = "",
  variants = fadeUpVariants,
  delay = 0
}: MotionDivProps) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={variants}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

// Stagger wrapper for grids/lists
export function MotionStagger({
  children,
  className = ""
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      variants={staggerContainer}
    >
      {children}
    </motion.div>
  );
}

// Export motion for direct use
export { motion };
