import { Suspense } from 'react';
import { ViewPageContent } from './view-content';

export default async function ViewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense>
      <ViewPageContent params={params} />
    </Suspense>
  );
}
