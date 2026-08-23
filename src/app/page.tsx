'use client';

import { useState } from 'react';
import { AdminLayout, type AdminPage } from '@/components/admin/admin-layout';

// Admin pages
import { StatsOverview } from '@/components/admin/stats-overview';
import { GenerateBatch } from '@/components/admin/generate-batch';
import { ManageBatches } from '@/components/admin/manage-batches';
import { ManagePhysicalQr } from '@/components/admin/manage-physical-qr';
import { AdminUsers } from '@/components/admin/admin-users';
import { AdminStats } from '@/components/admin/admin-stats';

// Client pages
import { ClientDashboard } from '@/components/client/client-dashboard';
import { PhysicalQrCodes } from '@/components/client/physical-qr-codes';
import { HomesManager } from '@/components/client/homes-manager';
import { RoomsManager } from '@/components/client/rooms-manager';
import { ActivityLogViewer } from '@/components/client/activity-log-viewer';
import { ActivationPage } from '@/components/client/activation-page';

// Module pages
import { ModuleConfigPage } from '@/components/client/module-config';
import { ModulePreviewPage } from '@/components/client/module-preview';

export default function App() {
  const [activePage, setActivePage] = useState<AdminPage>('module-preview');

  const renderPage = () => {
    switch (activePage) {
      case 'overview':
        return <StatsOverview />;
      case 'generate':
        return <GenerateBatch />;
      case 'batches':
        return <ManageBatches />;
      case 'physical-qr':
        return <ManagePhysicalQr />;
      case 'users':
        return <AdminUsers />;
      case 'stats':
        return <AdminStats />;
      case 'client-home':
        return <ClientDashboard />;
      case 'client-activate':
      case 'client-qr-codes':
        return <PhysicalQrCodes />;
      case 'client-homes':
        return <HomesManager />;
      case 'client-rooms':
        return <RoomsManager />;
      case 'client-activity':
        return <ActivityLogViewer />;
      case 'activation-public':
        return <ActivationPage />;
      case 'module-config':
        return <ModuleConfigPage />;
      case 'module-preview':
        return <ModulePreviewPage />;
      case 'modules':
        return <ModulePreviewPage />;
      default:
        return <ModulePreviewPage />;
    }
  };

  return (
    <AdminLayout activePage={activePage} onPageChange={setActivePage}>
      {renderPage()}
    </AdminLayout>
  );
}