'use client';

import { Suspense } from 'react';
import { SessionProvider } from 'next-auth/react';
import { ActivatePageContent } from './activate-content';
import { Loader2 } from 'lucide-react';

function ActivateFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <p className="text-sm text-muted-foreground">Chargement...</p>
      </div>
    </div>
  );
}

export default function ActivatePage(props: { params: Promise<{ code: string }> }) {
  return (
    <SessionProvider>
      <Suspense fallback={<ActivateFallback />}>
        <ActivatePageContent params={props.params} />
      </Suspense>
    </SessionProvider>
  );
}
