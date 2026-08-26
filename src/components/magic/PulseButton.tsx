'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import React from 'react';

interface PulseButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: React.ReactNode;
  pulse?: boolean;
  glow?: string;
  className?: string;
  onClick?: () => void;
}

export function PulseButton({
  children,
  pulse = true,
  glow = '0 0 20px rgba(255,255,255,0.4)',
  className = '',
  onClick,
  ...motionProps
}: PulseButtonProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05, boxShadow: glow }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={
        `relative overflow-hidden w-full font-bold py-4 px-6 rounded-2xl text-lg
        text-white bg-white/15 backdrop-blur-sm border border-white/25
        shadow-lg transition-colors ${className}`
      }
      {...motionProps}
    >
      {pulse && (
        <span
          className="absolute inset-0 rounded-2xl animate-ping-slow bg-white/10"
          aria-hidden="true"
        />
      )}
      {/* Shine sweep */}
      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
      <style>{`
        @keyframes ping-slow {
          0% { transform: scale(1); opacity: 0.4; }
          75%, 100% { transform: scale(1.15); opacity: 0; }
        }
        .animate-ping-slow {
          animation: ping-slow 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
      `}</style>
    </motion.button>
  );
}
