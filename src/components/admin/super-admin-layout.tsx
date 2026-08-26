'use client';

import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  QrCode,
  Package,
  ScanLine,
  Users,
  BarChart3,
  Menu,
  X,
  ChevronRight,
  LogOut,
  Shield,
  ArrowLeftRight,
  Moon,
  Sun,
  Store,
  ShoppingBag,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

export type SuperAdminPage =
  | 'overview'
  | 'generate'
  | 'batches'
  | 'physical-qr'
  | 'users'
  | 'stats'
  | 'admin-artisans'
  | 'admin-marketplace'
  | 'admin-packs';

interface SuperAdminLayoutProps {
  activePage: SuperAdminPage;
  onPageChange: (page: SuperAdminPage) => void;
  onSwitchToClient: () => void;
  onLogout: () => void;
  children: React.ReactNode;
}

const SUPER_ADMIN_ITEMS: { key: SuperAdminPage; label: string; icon: React.ReactNode; badge?: string; section?: string }[] = [
  { key: 'overview', label: 'Vue d\'ensemble', icon: <LayoutDashboard className="h-5 w-5" /> },
  { key: 'generate', label: 'Générer un lot', icon: <QrCode className="h-5 w-5" /> },
  { key: 'batches', label: 'Lots générés', icon: <Package className="h-5 w-5" /> },
  { key: 'physical-qr', label: 'QR physiques', icon: <ScanLine className="h-5 w-5" /> },
  { key: 'users', label: 'Utilisateurs', icon: <Users className="h-5 w-5" />, badge: 'Gestion' },
  { key: 'stats', label: 'Statistiques', icon: <BarChart3 className="h-5 w-5" /> },
  { key: 'admin-artisans', label: 'Artisans & Pros', icon: <Briefcase className="h-5 w-5" />, badge: 'V3', section: 'Marketplace' },
  { key: 'admin-marketplace', label: 'Marketplace', icon: <ShoppingBag className="h-5 w-5" />, badge: 'V3', section: 'Marketplace' },
  { key: 'admin-packs', label: 'Packs & Config', icon: <Store className="h-5 w-5" />, badge: 'B2B', section: 'Marketplace' },
];

export function SuperAdminLayout({ activePage, onPageChange, onSwitchToClient, onLogout, children }: SuperAdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const current = SUPER_ADMIN_ITEMS.find((n) => n.key === activePage);
  const { theme, setTheme } = useTheme();
  const handleLogout = () => { signOut({ redirect: false }); onLogout(); };

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r-rose-900/50 bg-gradient-to-b from-rose-950 via-rose-900 to-pink-950 transition-transform duration-300 lg:static lg:translate-x-0',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full',
      )}>
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-500">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-none">QR Domotik</h1>
            <p className="text-[11px] text-rose-300/70">Super Admin</p>
          </div>
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden h-8 w-8" onClick={() => setSidebarOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Separator className="bg-rose-800/50" />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-rose-300/60">
              Super Administration
            </p>
            {SUPER_ADMIN_ITEMS.filter(i => !i.section).map((item) => (
              <button
                key={item.key}
                onClick={() => { onPageChange(item.key); setSidebarOpen(false); }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  activePage === item.key
                    ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                    : 'text-rose-200/70 hover:bg-rose-800/40 hover:text-white',
                )}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                    activePage === item.key ? 'bg-white/20 text-white' : 'bg-rose-800/40 text-rose-300/60',
                  )}>
                    {item.badge}
                  </span>
                )}
                {activePage === item.key && <ChevronRight className="h-4 w-4" />}
              </button>
            ))}
            <p className="px-3 mt-4 mb-1 text-[11px] font-semibold uppercase tracking-wider text-rose-300/60">
              Marketplace & B2B
            </p>
            {SUPER_ADMIN_ITEMS.filter(i => i.section).map((item) => (
              <button
                key={item.key}
                onClick={() => { onPageChange(item.key); setSidebarOpen(false); }}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  activePage === item.key
                    ? 'bg-rose-500 text-white shadow-sm shadow-rose-500/30'
                    : 'text-rose-200/70 hover:bg-rose-800/40 hover:text-white',
                )}
              >
                {item.icon}
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge && (
                  <span className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                    activePage === item.key ? 'bg-white/20 text-white' : 'bg-rose-800/40 text-rose-300/60',
                  )}>
                    {item.badge}
                  </span>
                )}
                {activePage === item.key && <ChevronRight className="h-4 w-4" />}
              </button>
            ))}
          </nav>
        </ScrollArea>

        <Separator className="bg-rose-800/50" />

        {/* Footer */}
        <div className="p-3 flex flex-col gap-1">
          <button
            onClick={onSwitchToClient}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-200/70 hover:bg-rose-800/40 hover:text-white transition-all"
          >
            <ArrowLeftRight className="h-5 w-5" />
            Passer au client
          </button>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-rose-300/70 hover:bg-red-500/20 hover:text-red-300 transition-all"
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
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-rose-100 dark:bg-rose-500/10 px-3 py-1.5">
              <Shield className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">Superadmin</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 overflow-auto">{children}</main>

        <footer className="border-t bg-card px-4 py-3 lg:px-8">
          <p className="text-center text-xs text-muted-foreground">
            QR Domotik v1.0.0 &middot; Super Administration
          </p>
        </footer>
      </div>
    </div>
  );
}
