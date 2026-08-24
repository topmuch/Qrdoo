'use client';

import { useState, useCallback } from 'react';
import { useSession, SessionProvider } from 'next-auth/react';
import { LandingPage } from '@/components/landing/hero-section';
import { RoleSelector } from '@/components/role-selector';
import { AuthForm } from '@/components/auth/login-form';
import { SuperAdminLayout, type SuperAdminPage } from '@/components/admin/super-admin-layout';
import { ClientLayout, type ClientPage } from '@/components/client/client-layout';

import { ErrorBoundary } from '@/components/error-boundary';

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

type AppView = 'landing' | 'auth' | 'select' | 'superadmin' | 'client';

function AppContent() {
  const { data: session, status } = useSession();
  const [view, setView] = useState<AppView>('landing');
  const [adminPage, setAdminPage] = useState<SuperAdminPage>('overview');
  const [clientPage, setClientPage] = useState<ClientPage>('module-preview');

  const handleAuthSuccess = useCallback((role: string) => {
    setView(role === 'superadmin' ? 'superadmin' : 'client');
  }, []);

  const handleLogout = useCallback(() => {
    setView('landing');
  }, []);

  // Determine effective view
  let effectiveView: AppView = view;
  if (session?.user) {
    effectiveView = session.user.role === 'superadmin' ? 'superadmin' : 'client';
  } else if (status !== 'loading' && view !== 'landing' && view !== 'auth') {
    effectiveView = 'auth';
  }

  // === LOADING ===
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e]">
        <div className="h-8 w-8 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
      </div>
    );
  }

  // === AUTH (not logged in) ===
  if (!session) {
    if (effectiveView === 'landing') {
      return (
        <LandingPage
          onGoToDemo={() => setView('auth')}
          onGoToDashboard={() => setView('auth')}
        />
      );
    }
    return <AuthForm onSuccess={handleAuthSuccess} />;
  }

  // === ROLE SELECTOR ===
  if (effectiveView === 'select') {
    return (
      <RoleSelector
        onSelectAdmin={() => setView('superadmin')}
        onSelectClient={() => setView('client')}
      />
    );
  }

  // === SUPER ADMIN DASHBOARD ===
  if (effectiveView === 'superadmin') {
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
        onLogout={handleLogout}
      >
        <ErrorBoundary key={adminPage}>{renderAdminPage()}</ErrorBoundary>
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
      onLogout={handleLogout}
    >
      <ErrorBoundary key={clientPage}>{renderClientPage()}</ErrorBoundary>
    </ClientLayout>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <AppContent />
    </SessionProvider>
  );
}
