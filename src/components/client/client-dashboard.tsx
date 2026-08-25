'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  QrCode,
  Plus,
  ArrowUpRight,
  TrendingUp,
  Eye,
  Home,
  Zap,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from 'recharts';

interface HomeData {
  id: string;
  name: string;
  _count?: { rooms: number; qrCodes: number };
}

interface ScanStats {
  totalScans: number;
  scansToday: number;
  scansThisWeek: number;
  scansThisMonth: number;
  dailyScans: { date: string; count: number }[];
}

export function ClientDashboard() {
  const [homes, setHomes] = useState<HomeData[]>([]);
  const [stats, setStats] = useState<ScanStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [qrCount, setQrCount] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const homesRes = await fetch('/api/client/homes');
      const homesData = await homesRes.json();
      const homesList = homesData.homes || [];
      setHomes(homesList);

      const homeId = homesList[0]?.id;
      if (homeId) {
        const [qrRes, statsRes] = await Promise.all([
          fetch(`/api/client/qr-codes?homeId=${homeId}`).then(r => r.json()),
          fetch(`/api/client/scan-stats?homeId=${homeId}`).then(r => r.json()),
        ]);
        setQrCount((qrRes.qrCodes || []).length);
        if (statsRes.totalScans !== undefined) {
          setStats(statsRes);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const homeName = homes[0]?.name || 'votre espace';
  const totalQr = homes.reduce((acc, h) => acc + (h._count?.qrCodes || 0), 0) || qrCount;

  // Mini chart data - last 14 days
  const chartData = (stats?.dailyScans || []).slice(-14).map(d => ({
    name: new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 2),
    scans: d.count,
  }));

  const hasAnyData = totalQr > 0 || (stats?.totalScans ?? 0) > 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full max-w-lg rounded-2xl" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Hero - Welcome + main stat */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Bonjour 👋</p>
          <h1 className="text-2xl font-bold tracking-tight">{homeName}</h1>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'client-activate' }))}
            className="gap-2 rounded-xl"
          >
            <Plus className="h-4 w-4" />
            Activer un QR
          </Button>
        </div>
      </div>

      {/* 3 Clean KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Scans - Hero card */}
        <Card className="rounded-2xl border-0 bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-lg shadow-violet-500/20">
          <CardContent className="p-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-white/70 uppercase tracking-wider">Scans totaux</p>
              <p className="text-3xl font-bold mt-1 tabular-nums">{stats?.totalScans ?? 0}</p>
              {stats && stats.scansToday > 0 && (
                <p className="text-xs text-white/60 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +{stats.scansToday} aujourd&apos;hui
                </p>
              )}
            </div>
            <div className="h-10 w-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Eye className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* QR Codes */}
        <Card className="rounded-2xl">
          <CardContent className="p-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">QR Codes</p>
              <p className="text-3xl font-bold mt-1 tabular-nums">{totalQr}</p>
              <p className="text-xs text-muted-foreground mt-1">{homes.length} maison{homes.length !== 1 ? 's' : ''}</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <QrCode className="h-5 w-5 text-amber-600" />
            </div>
          </CardContent>
        </Card>

        {/* Ce mois */}
        <Card className="rounded-2xl">
          <CardContent className="p-5 flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Ce mois</p>
              <p className="text-3xl font-bold mt-1 tabular-nums">{stats?.scansThisMonth ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">{stats?.scansThisWeek ?? 0} cette semaine</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mini trend chart */}
      {chartData.length > 0 && (
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Activité des 14 derniers jours</h3>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'client-analytics' }))}
                className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-0.5 transition-colors"
              >
                Voir tout <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="dashGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: '#a1a1aa' }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#18181b',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: '#fff',
                    }}
                    labelStyle={{ color: '#a1a1aa' }}
                    formatter={(value: number) => [`${value} scan${value > 1 ? 's' : ''}`, '']}
                  />
                  <Area
                    type="monotone"
                    dataKey="scans"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    fill="url(#dashGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {!hasAnyData && (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="py-16 flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
              <Zap className="h-8 w-8 text-violet-500" />
            </div>
            <h3 className="font-semibold text-lg">Commencez par activer un QR code</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Scannez le code d&apos;activation imprimé sur votre support QR ou créez-en un nouveau.
            </p>
            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'client-activate' }))}
                className="gap-2 rounded-xl"
              >
                <QrCode className="h-4 w-4" />
                Activer un QR code
              </Button>
              <Button
                variant="outline"
                onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'client-homes' }))}
                className="gap-2 rounded-xl"
              >
                <Home className="h-4 w-4" />
                Créer une maison
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
