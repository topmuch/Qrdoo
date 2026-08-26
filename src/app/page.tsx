'use client';

import { useState, useCallback, useEffect, Suspense, useRef } from 'react';
import { useSession, SessionProvider } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
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
import { ChoresManager } from '@/components/client/chores-manager';
import { NotificationCenter } from '@/components/client/notifications-center';
import { ScanAnalytics } from '@/components/client/scan-analytics';
import { AutomationsManager } from '@/components/client/automations-manager';
import { WebhooksManager } from '@/components/client/webhooks-manager';
import { StockManager } from '@/components/client/stock-manager';
import { PackManager } from '@/components/client/pack-manager';
import { ArtisanManager } from '@/components/client/artisan-manager';

function ScanAnalyticsWrapper() {
  const [homeId, setHomeId] = useState('');
  useEffect(() => {
    async function fetchHomes() {
      try {
        const res = await fetch('/api/client/homes');
        const data = await res.json();
        if (data.homes?.length > 0) setHomeId(data.homes[0].id);
      } catch { /* empty */ }
    }
    fetchHomes();
  }, []);
  if (!homeId) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  return <ScanAnalytics homeId={homeId} />;
}

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
  const searchParams = useSearchParams();
  const isActivateFlow = searchParams.get('action') === 'activate';
  const [view, setView] = useState<AppView>(isActivateFlow ? 'auth' : 'landing');
  const [adminPage, setAdminPage] = useState<SuperAdminPage>('overview');
  const [clientPage, setClientPage] = useState<ClientPage>('module-preview');
  const initialRegister = isActivateFlow;
  const hasCheckedPending = useRef(false);

  // Redirect to activate page after auth if coming from QR scan
  useEffect(() => {
    if (!hasCheckedPending.current && session && sessionStorage.getItem('pendingActivationCode')) {
      hasCheckedPending.current = true;
      const code = sessionStorage.getItem('pendingActivationCode');
      sessionStorage.removeItem('pendingActivationCode');
      window.location.href = `/activate/${code}`;
    }
  }, [session]);

  const handleAuthSuccess = useCallback((role: string) => {
    // If coming from QR activation flow, redirect back to the activate page
    const pendingCode = sessionStorage.getItem('pendingActivationCode');
    if (pendingCode) {
      sessionStorage.removeItem('pendingActivationCode');
      window.location.href = `/activate/${pendingCode}`;
      return;
    }
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
          onGoToDashboard={() => setView('auth')}
        />
      );
    }
    return <AuthForm onSuccess={handleAuthSuccess} initialRegister={initialRegister} />;
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
      case 'client-chores': return <ChoresManager />;
      case 'client-stock': return <StockManager />;
      case 'client-packs': return <PackManager />;
      case 'client-artisans': return <ArtisanManager />;
      case 'client-notifications': return <NotificationCenter />;
      case 'client-analytics': return <ScanAnalyticsWrapper />;
      case 'client-automations': return <AutomationsManager />;
      case 'client-webhooks': return <WebhooksManager />;
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

function AuthLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e]">
      <div className="h-8 w-8 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
    </div>
  );
}

export default function App() {
  return (
    <SessionProvider>
      <Suspense fallback={<AuthLoadingFallback />}>
        <AppContent />
      </Suspense>
    </SessionProvider>
  );
}
