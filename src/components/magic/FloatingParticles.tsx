'use client';

import { useEffect, useRef } from 'react';

interface FloatingParticlesProps {
  count?: number;
  color?: string;
  size?: number;
  duration?: number;
}

export function FloatingParticles({
   count = 20,
  color = 'rgba(255,255,255,0.3)',
  size = 4,
  duration = 15,
}: FloatingParticlesProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const container = containerRef.current;
    if (!container) return;

    const particles: HTMLDivElement[] = [];
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      const s = size * (0.5 + Math.random());
      const left = Math.random() * 100;
      const delay = Math.random() * duration;
      const dur = duration * (0.6 + Math.random() * 0.8);
      p.style.cssText = `
        position:absolute;
        width:${s}px;height:${s}px;
        border-radius:50%;
        background:${color};
        left:${left}%;
        bottom:-10px;
        opacity:0;
        animation:float-up ${dur}s ${delay}s infinite ease-out;
        will-change:transform,opacity;
      `;
      container.appendChild(p);
      particles.push(p);
    }

    return () => {
      particles.forEach((p) => p.remove());
    };
  }, [count, color, size, duration]);

  return (
    <>
      <style>{`
        @keyframes float-up {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.2; }
          100% { transform: translateY(-100vh) translateX(${Math.random() > 0.5 ? '' : '-'}30px); opacity: 0; }
        }
      `}</style>
      <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true" />
    </>
  );
}
