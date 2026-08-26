'use client';

import { motion } from 'framer-motion';
import React from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function PageTransition({ children, className = '', delay = 0 }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Animated entry for a page icon (spring + rotate) */
export function AnimatedIcon({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ scale: 0, rotate: -180, opacity: 0 }}
      animate={{ scale: 1, rotate: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 150, damping: 12, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Animated title that slides up */
export function AnimatedTitle({ children, delay = 0.2, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Branded footer for public scan pages */
export function BrandedFooter({ delay = 1 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay }}
      className="mt-10 pb-6 text-center"
    >
      <p className="text-white/50 text-xs flex items-center justify-center gap-1.5">
        Propulsé par{' '}
        <a
          href="https://qrdomotik.com"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-white/80 hover:text-white transition-colors underline underline-offset-2 decoration-white/30"
        >
          QR Domotik
        </a>
        {' '}•{' '}
        <a
          href="/"
          className="font-medium text-white/70 hover:text-white transition-colors"
        >
          Créer les miens →
        </a>
      </p>
    </motion.div>
  );
}
