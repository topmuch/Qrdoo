'use client';

import { use, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode, CheckCircle2, XCircle, AlertCircle, Loader2, ArrowRight, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

type CodeStatus = 'loading' | 'not_found' | 'inactive' | 'active' | 'lost' | 'cancelled' | 'error';

export default function ActivatePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [status, setStatus] = useState<CodeStatus>('loading');
  const [designConfig, setDesignConfig] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch(`/api/client/check-code?code=${encodeURIComponent(code)}`);
        const data = await res.json();
        setStatus(data.status || 'not_found');
        if (data.physicalQr?.designConfig) {
          setDesignConfig(data.physicalQr.designConfig);
        }
      } catch {
        setStatus('error');
      }
    }
    check();
  }, [code]);

  /* ---- Loading ---- */
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-muted-foreground">Vérification du QR code...</p>
        </div>
      </div>
    );
  }

  /* ---- Not found / Lost / Cancelled / Error ---- */
  if (status === 'not_found' || status === 'lost' || status === 'cancelled' || status === 'error') {
    const messages: Record<string, { title: string; description: string; color: string }> = {
      not_found: { title: 'QR code introuvable', description: 'Ce code n\'existe pas dans notre système. Vérifiez le code et réessayez.', color: 'red' },
      lost: { title: 'QR code perdu', description: 'Ce code a été signalé comme perdu et ne peut plus être utilisé.', color: 'amber' },
      cancelled: { title: 'QR code annulé', description: 'Ce code a été annulé par l\'administrateur.', color: 'amber' },
      error: { title: 'Erreur de connexion', description: 'Impossible de vérifier le code. Réessayez plus tard.', color: 'gray' },
    };
    const msg = messages[status] || messages.error;
    const Icon = status === 'not_found' || status === 'error' ? XCircle : AlertCircle;

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-${msg.color}-100`}>
              <Icon className={`h-8 w-8 text-${msg.color}-600`} />
            </div>
            <h1 className="text-xl font-bold mb-2">{msg.title}</h1>
            <p className="text-sm text-muted-foreground mb-2">Code : <span className="font-mono font-semibold">{code}</span></p>
            <p className="text-sm text-muted-foreground mb-6">{msg.description}</p>
            <div className="flex flex-col gap-2">
              <Link href="/">
                <Button variant="outline" className="w-full gap-2">
                  <LinkIcon className="h-4 w-4" />
                  Retour à l\'accueil
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---- Inactive → Needs activation ---- */
  if (status === 'inactive') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-4">
        <Card className="w-full max-w-md border-2 border-emerald-200">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/25">
              <QrCode className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-xl font-bold mb-2">QR code prêt à activer</h1>
            <p className="text-sm text-muted-foreground mb-1">
              Code : <span className="font-mono font-semibold">{code}</span>
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Ce QR code n\'a pas encore été configuré. Connectez-vous à votre espace pour l\'activer et lui attribuer un module.
            </p>
            <Link href="/?tab=auth">
              <Button className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700 gap-2">
                Se connecter pour activer
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <p className="mt-4 text-xs text-muted-foreground">
              QR Domotik &middot; qrdomotik.roomscan.pro
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---- Active → QR is configured ---- */
  if (status === 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-4">
        <Card className="w-full max-w-md border-2 border-emerald-200">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold mb-2">QR code actif</h1>
            <p className="text-sm text-muted-foreground mb-1">
              Code : <span className="font-mono font-semibold">{code}</span>
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              Ce QR code est déjà configuré et fonctionnel.
            </p>
            <Link href="/">
              <Button variant="outline" className="w-full gap-2">
                <LinkIcon className="h-4 w-4" />
                Aller sur QR Domotik
              </Button>
            </Link>
            <p className="mt-4 text-xs text-muted-foreground">
              QR Domotik &middot; qrdomotik.roomscan.pro
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
