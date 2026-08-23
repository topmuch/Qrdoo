'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

export type AdminPage = 'overview' | 'generate' | 'batches' | 'physical-qr' | 'users' | 'stats';

interface AdminLayoutProps {
  activePage: AdminPage;
  onPageChange: (page: AdminPage) => void;
  children: React.ReactNode;
}

const NAV_ITEMS: { key: AdminPage; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Vue d\'ensemble', icon: <LayoutDashboard className="h-5 w-5" /> },
  { key: 'generate', label: 'Générer un lot', icon: <QrCode className="h-5 w-5" /> },
  { key: 'batches', label: 'Lots générés', icon: <Package className="h-5 w-5" /> },
  { key: 'physical-qr', label: 'QR codes physiques', icon: <ScanLine className="h-5 w-5" /> },
  { key: 'users', label: 'Utilisateurs', icon: <Users className="h-5 w-5" /> },
  { key: 'stats', label: 'Statistiques', icon: <BarChart3 className="h-5 w-5" /> },
];

export function AdminLayout({ activePage, onPageChange, children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-transform duration-300 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
            <QrCode className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-none">QR Domotik</h1>
            <p className="text-[11px] text-muted-foreground">Superadmin</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto lg:hidden h-8 w-8"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <Separator />

        {/* Navigation */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
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
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {item.icon}
                {item.label}
                {activePage === item.key && (
                  <ChevronRight className="ml-auto h-4 w-4" />
                )}
              </button>
            ))}
          </nav>
        </ScrollArea>

        <Separator />

        {/* Footer */}
        <div className="p-3">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all">
            <LogOut className="h-5 w-5" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar (mobile) */}
        <header className="flex h-16 items-center gap-4 border-b bg-card px-4 lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            {NAV_ITEMS.find((n) => n.key === activePage)?.icon}
            <h2 className="text-lg font-semibold">
              {NAV_ITEMS.find((n) => n.key === activePage)?.label}
            </h2>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 rounded-full bg-muted px-3 py-1.5">
              <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                <span className="text-[10px] font-bold text-primary-foreground">SA</span>
              </div>
              <span className="text-xs font-medium">Superadmin</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8 overflow-auto">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t bg-card px-4 py-3 lg:px-8">
          <p className="text-center text-xs text-muted-foreground">
            QR Domotik v1.0.0 &middot; Plateforme SaaS de QR codes domotiques
          </p>
        </footer>
      </div>
    </div>
  );
}
