import { Suspense } from 'react';
import { HubPageContent } from './hub-content';

export default async function HubPage({ params }: { params: Promise<{ slug: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
            <p className="text-sm text-slate-400">Chargement du Hub...</p>
          </div>
        </div>
      }
    >
      <HubPageContent params={params} />
    </Suspense>
  );
}
