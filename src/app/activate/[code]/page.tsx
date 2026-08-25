'use client';

import { SessionProvider } from 'next-auth/react';
import { ActivatePageContent } from './activate-content';

export default function ActivatePage(props: { params: Promise<{ code: string }> }) {
  return (
    <SessionProvider>
      <ActivatePageContent params={props.params} />
    </SessionProvider>
  );
}
