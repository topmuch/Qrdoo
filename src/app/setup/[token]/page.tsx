'use client';

import { Suspense } from 'react';
import { SessionProvider } from 'next-auth/react';
import { SetupPageContent } from './setup-content';

export default function SetupPage(props: { params: Promise<{ token: string }> }) {
  return (
    <SessionProvider>
      <Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center bg-violet-950">
            <div className="flex flex-col items-center gap-3">
              <div className="h-10 w-10 rounded-full border-2 border-white/30 border-t-white animate-spin" />
              <p className="text-sm text-white/60">Chargement...</p>
            </div>
          </div>
        }
      >
        <SetupPageContent params={props.params} />
      </Suspense>
    </SessionProvider>
  );
}
