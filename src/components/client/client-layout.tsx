'use client';

import { useState, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  QrCode,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Home,
  Plus,
  DoorOpen,
  Activity,
  Zap,
  Eye,
  Settings2,
  Layers,
  ArrowLeftRight,
  Bell,
  Store,
  Briefcase,
  Sparkles,
  BarChart3,
  Plug,
  Globe,
  ShieldAlert,
  Package,
  Users,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export type ClientPage =
  | 'client-home'
  | 'client-activate'
  | 'client-qr-codes'
  | 'client-homes'
  | 'client-rooms'
  | 'client-activity'
  | 'client-chores'
  | 'client-settings'
  | 'activation-public'
  | 'modules'
  | 'module-config'
  | 'module-preview'
  | 'client-notifications'
  | 'client-analytics'
  | 'client-automations'
  | 'client-webhooks'
  | 'client-stock'
  | 'client-packs'
  | 'client-artisans'
  | 'client-monetization';

interface ClientLayoutProps {
  activePage: ClientPage;
  onPageChange: (page: ClientPage) => void;
  onSwitchToAdmin: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const DASHBOARD_ITEMS: { key: ClientPage; label: string; icon: React.ReactNode; badge?: string }[] = [
  { key: 'client-home', label: 'Mon Dashboard', icon: <Home className="h-5 w-5" /> },
  { key: 'client-activate', label: 'Activer QR codes', icon: <Plus className="h-5 w-5" /> },
  { key: 'client-homes', label: 'Mes Maisons', icon: <Home className="h-5 w-5" /> },
  { key: 'client-rooms', label: 'Mes Pièces', icon: <DoorOpen className="h-5 w-5" /> },
  { key: 'client-activity', label: "Journal d'activité", icon: <Activity className="h-5 w-5" /> },
  { key: 'client-chores', label: 'Corvées & Récompenses', icon: <Sparkles className="h-5 w-5" />, badge: 'V2' },
  { key: 'client-stock', label: 'Stock & DLC', icon: <ShieldAlert className="h-5 w-5" />, badge: 'V2' },
  { key: 'client-packs', label: 'Packs Pré-configurés', icon: <Package className="h-5 w-5" />, badge: 'B2B' },
  { key: 'client-artisans', label: 'Artisans & Réservations', icon: <Users className="h-5 w-5" />, badge: 'V3' },
  { key: 'client-monetization', label: 'Monétisation', icon: <CreditCard className="h-5 w-5" />, badge: 'V3' },
  { key: 'client-notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" /> },
  { key: 'client-analytics', label: 'Statistiques Scan', icon: <BarChart3 className="h-5 w-5" />, badge: 'V3' },
];

const INTEGRATION_ITEMS: { key: ClientPage; label: string; icon: React.ReactNode; badge?: string }[] = [
  { key: 'client-automations', label: 'Domotique (HA/Jeedom)', icon: <Plug className="h-5 w-5" />, badge: 'V3' },
  { key: 'client-webhooks', label: 'Webhooks & Automations', icon: <Globe className="h-5 w-5" />, badge: 'V3' },
];

const MODULE_ITEMS_V1: { key: ClientPage; label: string; icon: React.ReactNode; badge?: string }[] = [
  { key: 'module-config', label: 'Configurer un module', icon: <Settings2 className="h-5 w-5" /> },
  { key: 'module-preview', label: 'Aperçu des modules', icon: <Eye className="h-5 w-5" /> },
  { key: 'modules', label: 'Catalogue Modules', icon: <Layers className="h-5 w-5" /> },
];

const MODULE_ITEMS_V3: { key: ClientPage; label: string; icon: React.ReactNode; badge?: string }[] = [
  { key: 'client-artisans', label: 'Mon Quartier', icon: <Store className="h-5 w-5" />, badge: 'V3' },
  { key: 'client-artisans', label: 'Services Pro', icon: <Briefcase className="h-5 w-5" />, badge: 'V3' },
];

export function ClientLayout({ activePage, onPageChange, onSwitchToAdmin, onLogout, children }: ClientLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleLogout = () => { signOut({ redirect: false }); onLogout(); };

  // Listen for programmatic navigation from child components
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail;
      if (detail && (detail as string).startsWith('client-')) {
        onPageChange(detail as ClientPage);
      }
    };
    window.addEventListener('navigate', handler);
    return () => window.removeEventListener('navigate', handler);
  }, [onPageChange]);

  // Register service worker for PWA
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const allItems = [
    ...DASHBOARD_ITEMS,
    ...INTEGRATION_ITEMS,
    ...MODULE_ITEMS_V1,
    ...MODULE_ITEMS_V3,
  ];
  const current = allItems.find((n) => n.key === activePage) || allItems[0];

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - Violet/Purple gradient */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r-violet-900/50 bg-gradient-to-b from-violet-950 via-violet-900 to-purple-950 transition-transform duration-300 lg:static lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500">
            <QrCode className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-none text-white">QR Domotik</h1>
            <p className="text-[11px] text-violet-300/70">Espace Client</p>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden h-8 w-8 text-white hover:bg-violet-800/50" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="h-px bg-violet-800/50" />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {/* Dashboard section */}
            <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-violet-300/60">
              Mon Espace
            </p>
            {DASHBOARD_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  onPageChange(item.key);
                  setSidebarOpen(false);
                }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  activePage === item.key
                    ? 'bg-violet-500 text-white shadow-sm shadow-violet-500/30'
                    : 'text-violet-200/70 hover:bg-violet-800/40 hover:text-white',
                )}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {activePage === item.key && <ChevronRight className="h-4 w-4" />}
              </button>
            ))}

            <div className="my-3 h-px bg-violet-800/50" />

            {/* Integrations V3 section */}
            <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-violet-300/60">
              Intégrations
            </p>
            {INTEGRATION_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  onPageChange(item.key);
                  setSidebarOpen(false);
                }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  activePage === item.key
                    ? 'bg-violet-500 text-white shadow-sm shadow-violet-500/30'
                    : 'text-violet-200/70 hover:bg-violet-800/40 hover:text-white',
                )}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-violet-800/40 text-violet-300/60 hover:bg-violet-800/60">
                    {item.badge}
                  </Badge>
                )}
                {activePage === item.key && <ChevronRight className="h-4 w-4" />}
              </button>
            ))}

            <div className="my-3 h-px bg-violet-800/50" />

            {/* Modules V1 section */}
            <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-violet-300/60">
              Modules V1
            </p>
            {MODULE_ITEMS_V1.map((item) => (
              <button
                key={item.key}
                onClick={() => {
                  onPageChange(item.key);
                  setSidebarOpen(false);
                }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  activePage === item.key
                    ? 'bg-violet-500 text-white shadow-sm shadow-violet-500/30'
                    : 'text-violet-200/70 hover:bg-violet-800/40 hover:text-white',
                )}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {activePage === item.key && <ChevronRight className="h-4 w-4" />}
              </button>
            ))}

            <div className="my-3 h-px bg-violet-800/50" />

            {/* Marketplace V3 section */}
            <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-violet-300/60">
              Marketplace V3
            </p>
            {MODULE_ITEMS_V3.map((item, idx) => (
              <button
                key={`v3-${idx}`}
                onClick={() => {
                  onPageChange(item.key);
                  setSidebarOpen(false);
                }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  activePage === item.key
                    ? 'bg-violet-500 text-white shadow-sm shadow-violet-500/30'
                    : 'text-violet-200/70 hover:bg-violet-800/40 hover:text-white',
                )}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <Badge className="text-[10px] px-1.5 py-0 bg-violet-800/40 text-violet-300/60 hover:bg-violet-800/60">
                    {item.badge}
                  </Badge>
                )}
                {activePage === item.key && <ChevronRight className="h-4 w-4" />}
              </button>
            ))}

            <div className="my-3 h-px bg-violet-800/50" />

            {/* Demo section */}
            <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-violet-300/60">
              Démo
            </p>
            <button
              onClick={() => {
                onPageChange('activation-public');
                setSidebarOpen(false);
              }}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                activePage === 'activation-public'
                  ? 'bg-violet-500 text-white shadow-sm shadow-violet-500/30'
                  : 'text-violet-200/70 hover:bg-violet-800/40 hover:text-white',
              )}
            >
              <Zap className="h-5 w-5" />
              <span className="flex-1 text-left">Page activation</span>
              {activePage === 'activation-public' && <ChevronRight className="h-4 w-4" />}
            </button>
          </nav>
        </ScrollArea>

        <div className="h-px bg-violet-800/50" />

        {/* Footer */}
        <div className="p-3 flex flex-col gap-1">
          <button
            onClick={onSwitchToAdmin}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-violet-200/70 hover:bg-violet-800/40 hover:text-white transition-all"
          >
            <ArrowLeftRight className="h-5 w-5" />
            Passer en admin
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-violet-300/70 hover:bg-red-500/20 hover:text-red-300 transition-all"
          >
            <LogOut className="h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            {current?.icon}
            <h2 className="text-lg font-semibold">{current?.label}</h2>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-violet-100 dark:bg-violet-500/10 px-3 py-1.5">
              <div className="h-6 w-6 rounded-full bg-violet-600 flex items-center justify-center">
                <span className="text-[10px] font-bold text-white">UD</span>
              </div>
              <span className="text-xs font-medium text-violet-700 dark:text-violet-300">Utilisateur Démo</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>

        <footer className="border-t bg-card px-4 py-3 lg:px-8">
          <p className="text-center text-xs text-muted-foreground">
            QR Domotik v2.0.0 &middot; Espace Client
          </p>
        </footer>
      </div>
    </div>
  );
}
