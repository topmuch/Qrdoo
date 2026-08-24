'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Home,
  QrCode,
  Zap,
  Clock,
  Plus,
  ScanLine,
  ArrowRight,
  Activity,
} from 'lucide-react';

interface HomeData {
  id: string;
  name: string;
  _count?: { rooms: number; members: number; qrCodes: number };
}

interface QrCodeData {
  id: string;
  name: string;
  type: string;
  isActive: boolean;
  createdAt: string;
  room?: { name: string } | null;
}

interface ActivityData {
  id: string;
  actionType: string;
  createdAt: string;
  user?: { fullName: string | null } | null;
}

export function ClientDashboard() {
  const [homes, setHomes] = useState<HomeData[]>([]);
  const [qrCodes, setQrCodes] = useState<QrCodeData[]>([]);
  const [activities, setActivities] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/client/homes').then((r) => r.json()),
    ])
      .then(([homesData]) => {
        const homesList = homesData.homes || [];
        setHomes(homesList);
        const homeId = homesList[0]?.id;
        if (homeId) {
          return Promise.all([
            fetch(`/api/client/qr-codes?homeId=${homeId}`).then((r) => r.json()),
            fetch(`/api/client/activity?homeId=${homeId}&limit=10`).then((r) => r.json()),
          ]);
        }
        return [{ qrCodes: [] }, { logs: [] }];
      })
      .then(([qrData, actData]) => {
        if (qrData) setQrCodes(qrData.qrCodes || []);
        if (actData) setActivities(actData.logs || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><Skeleton className="h-4 w-24 mb-3" /><Skeleton className="h-8 w-16" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    { label: 'Mes maisons', value: homes.length, icon: <Home className="h-5 w-5 text-emerald-500" />, bg: 'bg-emerald-500/10' },
    { label: 'QR activés', value: qrCodes.length, icon: <QrCode className="h-5 w-5 text-amber-500" />, bg: 'bg-amber-500/10' },
    { label: 'Modules', value: new Set(qrCodes.map((q) => q.type)).size, icon: <Zap className="h-5 w-5 text-violet-500" />, bg: 'bg-violet-500/10' },
    { label: 'Dernière activité', value: activities.length > 0 ? new Date(activities[0].createdAt).toLocaleDateString('fr-FR') : '-', icon: <Clock className="h-5 w-5 text-rose-500" />, bg: 'bg-rose-500/10', isText: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Tableau de bord</h2>
        <p className="text-muted-foreground">Bienvenue sur QR Domotik. Gérez vos QR codes et votre maison.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className={s.isText ? 'text-lg font-semibold' : 'text-3xl font-bold tabular-nums'}>{s.value}</p>
                </div>
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}>{s.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <ScanLine className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Activer un QR code</h3>
              <p className="text-sm text-muted-foreground">Scannez ou saisissez votre code d'activation</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Créer un QR dynamique</h3>
              <p className="text-sm text-muted-foreground">Générez un QR code sans support physique</p>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Mes Maisons + Activité récente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Home className="h-4 w-4" /> Mes maisons</CardTitle>
          </CardHeader>
          <CardContent>
            {homes.length === 0 ? (
              <div className="text-center py-8">
                <Home className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-3">Aucune maison créée</p>
                <Button size="sm">Créer ma première maison</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {homes.map((h) => (
                  <div key={h.id} className="flex items-center justify-between rounded-lg border px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted"><Home className="h-4 w-4" /></div>
                      <div>
                        <p className="text-sm font-medium">{h.name}</p>
                        <p className="text-xs text-muted-foreground">{h._count?.rooms || 0} pièces · {h._count?.members || 0} membres</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{h._count?.qrCodes || 0} QR</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4" /> Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Aucune activité récente.</p>
            ) : (
              <div className="space-y-3">
                {activities.slice(0, 5).map((a) => (
                  <div key={a.id} className="flex items-center gap-3 rounded-lg border px-4 py-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                      <span className="text-xs font-bold text-muted-foreground uppercase">{(a.user?.fullName || '?')[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{a.actionType}</p>
                      <p className="text-xs text-muted-foreground">{a.user?.fullName || 'Système'}</p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(a.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
