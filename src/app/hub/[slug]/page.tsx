'use client';

import { Suspense } from 'react';
import { HubPageContent } from './hub-content';

export default function HubPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-emerald-950">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            <p className="text-sm text-white/60">Chargement du Hub...</p>
          </div>
        </div>
      }
    >
      <HubPageContent params={params} />
    </Suspense>
  );
}
