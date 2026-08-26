'use client';

import { useEffect, useRef } from 'react';

export const MODULE_GRADIENTS: Record<string, { from: string; via: string; to: string }> = {
  wifi:             { from: '#2563eb', via: '#3b82f6', to: '#06b6d4' },
  shopping_list:    { from: '#059669', via: '#10b981', to: '#34d399' },
  doorbell:         { from: '#ea580c', via: '#f59e0b', to: '#fbbf24' },
  guestbook:        { from: '#7c3aed', via: '#a855f7', to: '#fbbf24' },
  medication:       { from: '#e11d48', via: '#f472b6', to: '#fda4af' },
  meal_planner:     { from: '#dc2626', via: '#f97316', to: '#fbbf24' },
  note:             { from: '#ca8a04', via: '#eab308', to: '#fde68a' },
  home_manual:      { from: '#4f46e5', via: '#7c3aed', to: '#a78bfa' },
  external_link:    { from: '#0f766e', via: '#14b8a6', to: '#5eead4' },
  checklist:        { from: '#7c3aed', via: '#8b5cf6', to: '#c4b5fd' },
  contact:          { from: '#0369a1', via: '#0ea5e9', to: '#7dd3fc' },
  emergency:        { from: '#dc2626', via: '#ef4444', to: '#fca5a5' },
  energy_monitor:   { from: '#ca8a04', via: '#eab308', to: '#fef08a' },
  key_location:     { from: '#475569', via: '#64748b', to: '#94a3b8' },
  cleaning_schedule:{ from: '#0891b2', via: '#06b6d4', to: '#67e8f9' },
};

const DEFAULT_GRADIENT = { from: '#059669', via: '#10b981', to: '#34d399' };

interface GradientBackgroundProps {
  moduleType?: string;
  from?: string;
  via?: string;
  to?: string;
  animate?: boolean;
  children?: React.ReactNode;
}

export function GradientBackground({
  moduleType,
  from: fromProp,
  via: viaProp,
  to: toProp,
  animate = true,
  children,
}: GradientBackgroundProps) {
  const g = moduleType ? (MODULE_GRADIENTS[moduleType] ?? DEFAULT_GRADIENT) : { from: fromProp ?? '#059669', via: viaProp ?? '#10b981', to: toProp ?? '#34d399' };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Animated gradient base */}
      <div
        className={`absolute inset-0 ${animate ? 'animate-gradient-shift' : ''}`}
        style={{
          background: `linear-gradient(135deg, ${g.from} 0%, ${g.via} 50%, ${g.to} 100%)`,
          backgroundSize: animate ? '400% 400%' : undefined,
        }}
      />
      {/* Radial glow */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.15) 0%, transparent 70%)`,
        }}
        aria-hidden="true"
      />
      {/* Content */}
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-gradient-shift {
          animation: gradient-shift 12s ease infinite;
        }
      `}</style>
    </div>
  );
}
