"use client";

import { motion } from "framer-motion";

export function MotionFade({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={className}
      initial={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.3, delay }}
    >
      {children}
    </motion.div>
  );
}
