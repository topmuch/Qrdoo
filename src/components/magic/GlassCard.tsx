'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import React from 'react';

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className = '', hover = true, ...motionProps }: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -2 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`
        bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20
        shadow-[0_8px_32px_rgba(0,0,0,0.12)]
        ${className}
      `}
      {...motionProps}
    >
      {children}
    </motion.div>
  );
}
