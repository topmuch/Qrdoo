'use client';

import { useState } from 'react';
import { LandingPage } from '@/components/landing/hero-section';
import { RoleSelector } from '@/components/role-selector';
import { SuperAdminLayout, type SuperAdminPage } from '@/components/admin/super-admin-layout';
import { ClientLayout, type ClientPage } from '@/components/client/client-layout';

// Superadmin pages
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
import { ModuleConfigPage } from '@/components/client/module-config';
import { ModulePreviewPage } from '@/components/client/module-preview';

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="rounded-2xl border-2 border-dashed border-muted-foreground/25 p-12 max-w-md">
        <p className="text-lg font-semibold">{title}</p>
        <p className="mt-2 text-sm text-muted-foreground">Cette fonctionnalite sera disponible prochainement.</p>
      </div>
    </div>
  );
}

type AppView = 'landing' | 'select' | 'superadmin' | 'client';

export default function App() {
  const [view, setView] = useState<AppView>('landing');
  const [adminPage, setAdminPage] = useState<SuperAdminPage>('overview');
  const [clientPage, setClientPage] = useState<ClientPage>('module-preview');

  // === LANDING PAGE ===
  if (view === 'landing') {
    return (
      <LandingPage
        onGoToDemo={() => setView('select')}
        onGoToDashboard={() => setView('select')}
      />
    );
  }

  // === ROLE SELECTOR ===
  if (view === 'select') {
    return (
      <RoleSelector
        onSelectAdmin={() => setView('superadmin')}
        onSelectClient={() => setView('client')}
      />
    );
  }

  // === SUPER ADMIN DASHBOARD ===
  if (view === 'superadmin') {
    const renderAdminPage = () => {
      switch (adminPage) {
        case 'overview': return <StatsOverview />;
        case 'generate': return <GenerateBatch />;
        case 'batches': return <ManageBatches />;
        case 'physical-qr': return <ManagePhysicalQr />;
        case 'users': return <AdminUsers />;
        case 'stats': return <AdminStats />;
        default: return <StatsOverview />;
      }
    };
    return (
      <SuperAdminLayout
        activePage={adminPage}
        onPageChange={setAdminPage}
        onSwitchToClient={() => setView('client')}
      >
        {renderAdminPage()}
      </SuperAdminLayout>
    );
  }

  // === CLIENT DASHBOARD ===
  const renderClientPage = () => {
    switch (clientPage) {
      case 'client-home': return <ClientDashboard />;
      case 'client-activate':
      case 'client-qr-codes': return <PhysicalQrCodes />;
      case 'client-homes': return <HomesManager />;
      case 'client-rooms': return <RoomsManager />;
      case 'client-activity': return <ActivityLogViewer />;
      case 'client-notifications': return <PlaceholderPage title="Notifications" />;
      case 'activation-public': return <ActivationPage />;
      case 'module-config': return <ModuleConfigPage />;
      case 'module-preview': return <ModulePreviewPage />;
      case 'modules': return <ModulePreviewPage />;
      case 'client-settings': return <PlaceholderPage title="Parametres" />;
      default: return <ModulePreviewPage />;
    }
  };
  return (
    <ClientLayout
      activePage={clientPage}
      onPageChange={setClientPage}
      onSwitchToAdmin={() => setView('superadmin')}
    >
      {renderClientPage()}
    </ClientLayout>
  );
}