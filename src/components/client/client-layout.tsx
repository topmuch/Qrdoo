'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export type ClientPage =
  | 'client-home'
  | 'client-activate'
  | 'client-qr-codes'
  | 'client-homes'
  | 'client-rooms'
  | 'client-activity'
  | 'client-settings'
  | 'activation-public'
  | 'modules'
  | 'module-config'
  | 'module-preview'
  | 'client-notifications';

interface ClientLayoutProps {
  activePage: ClientPage;
  onPageChange: (page: ClientPage) => void;
  onSwitchToAdmin: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const DASHBOARD_ITEMS: { key: ClientPage; label: string; icon: React.ReactNode }[] = [
  { key: 'client-home', label: 'Mon Dashboard', icon: <Home className="h-5 w-5" /> },
  { key: 'client-activate', label: 'Activer QR codes', icon: <Plus className="h-5 w-5" /> },
  { key: 'client-homes', label: 'Mes Maisons', icon: <Home className="h-5 w-5" /> },
  { key: 'client-rooms', label: 'Mes Pièces', icon: <DoorOpen className="h-5 w-5" /> },
  { key: 'client-activity', label: 'Journal d\'activité', icon: <Activity className="h-5 w-5" /> },
  { key: 'client-notifications', label: 'Notifications', icon: <Bell className="h-5 w-5" /> },
];

const MODULE_ITEMS_V1: { key: ClientPage; label: string; icon: React.ReactNode }[] = [
  { key: 'module-config', label: 'Configurer un module', icon: <Settings2 className="h-5 w-5" /> },
  { key: 'module-preview', label: 'Aperçu des modules', icon: <Eye className="h-5 w-5" /> },
  { key: 'modules', label: 'Catalogue Modules', icon: <Layers className="h-5 w-5" /> },
];

const MODULE_ITEMS_V3: { key: ClientPage; label: string; icon: React.ReactNode; badge?: string }[] = [
  { key: 'modules', label: 'Mon Quartier', icon: <Store className="h-5 w-5" />, badge: 'V3' },
  { key: 'modules', label: 'Services Pro', icon: <Briefcase className="h-5 w-5" />, badge: 'V3' },
];

export function ClientLayout({ activePage, onPageChange, onSwitchToAdmin, onLogout, children }: ClientLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const handleLogout = () => { signOut({ redirect: false }); onLogout(); };

  const allItems = [
    ...DASHBOARD_ITEMS,
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

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-300 lg:static lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <QrCode className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-none">QR Domotik</h1>
            <p className="text-[11px] text-muted-foreground">Espace Client</p>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden h-8 w-8" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {/* Dashboard section */}
            <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {activePage === item.key && <ChevronRight className="h-4 w-4" />}
              </button>
            ))}

            <Separator className="my-3" />

            {/* Modules V1 section */}
            <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {activePage === item.key && <ChevronRight className="h-4 w-4" />}
              </button>
            ))}

            <Separator className="my-3" />

            {/* Marketplace V3 section */}
            <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {item.badge}
                  </Badge>
                )}
                {activePage === item.key && <ChevronRight className="h-4 w-4" />}
              </button>
            ))}

            <Separator className="my-3" />

            {/* Demo section */}
            <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )}
            >
              <Zap className="h-5 w-5" />
              <span className="flex-1 text-left">Page activation</span>
              {activePage === 'activation-public' && <ChevronRight className="h-4 w-4" />}
            </button>
          </nav>
        </ScrollArea>

        <Separator />

        {/* Footer */}
        <div className="p-3 flex flex-col gap-1">
          <button
            onClick={onSwitchToAdmin}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
          >
            <ArrowLeftRight className="h-5 w-5" />
            Passer en admin
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
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
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5">
              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary-foreground">UD</span>
              </div>
              <span className="text-xs font-medium">Utilisateur Démo</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>

        <footer className="border-t bg-card px-4 py-3 lg:px-8">
          <p className="text-center text-xs text-muted-foreground">
            QR Domotik v1.0.0 &middot; Espace Client
          </p>
        </footer>
      </div>
    </div>
  );
}
