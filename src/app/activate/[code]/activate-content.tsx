'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  QrCode, CheckCircle2, XCircle, AlertCircle, Loader2,
  ArrowRight, Link as LinkIcon, Zap, Sparkles, UserPlus, LogIn,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { QR_MODULE_LABELS } from '@/types/database';

type CodeStatus = 'loading' | 'not_found' | 'inactive' | 'active' | 'lost' | 'cancelled' | 'error';

const POPULAR_MODULES = ['wifi', 'guestbook', 'doorbell', 'emergency', 'note', 'contact', 'shopping_list', 'inventory', 'chore', 'checklist', 'timer', 'recipe'];

export function ActivatePageContent({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { data: session, status: authStatus } = useSession();
  const [codeStatus, setCodeStatus] = useState<CodeStatus>('loading');
  const [physicalQrId, setPhysicalQrId] = useState('');

  // Activation form state
  const [moduleType, setModuleType] = useState('');
  const [qrName, setQrName] = useState('');
  const [activating, setActivating] = useState(false);
  const [activationSuccess, setActivationSuccess] = useState(false);

  // Check code
  const checkCode = useCallback(async () => {
    try {
      const res = await fetch(`/api/client/check-code?code=${encodeURIComponent(code)}`);
      const data = await res.json();
      setCodeStatus(data.status || 'not_found');
      if (data.physicalQr?.id) setPhysicalQrId(data.physicalQr.id);
    } catch {
      setCodeStatus('error');
    }
  }, [code]);

  useEffect(() => { checkCode(); }, [checkCode]);

  // After signup/login, redirect happens via sessionStorage in page.tsx
  // This useEffect is a safety net
  useEffect(() => {
    if (session && sessionStorage.getItem('pendingActivationCode')) {
      const pendingCode = sessionStorage.getItem('pendingActivationCode');
      if (pendingCode === code) {
        sessionStorage.removeItem('pendingActivationCode');
        // Don't redirect, just let the activation form show
      }
    }
  }, [session, code]);

  const handleGoToSignup = () => {
    sessionStorage.setItem('pendingActivationCode', code);
    window.location.href = '/?action=activate';
  };

  const handleGoToLogin = () => {
    sessionStorage.setItem('pendingActivationCode', code);
    window.location.href = '/?action=activate';
  };

  const handleActivate = async () => {
    if (!physicalQrId || !moduleType || !qrName) {
      toast.error('Choisissez un module et un nom');
      return;
    }
    setActivating(true);
    try {
      const res = await fetch('/api/client/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, moduleType, name: qrName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setActivationSuccess(true);
      toast.success('QR code active !');
    } catch (e: any) {
      toast.error(e.message || 'Erreur lors de l\'activation');
    } finally {
      setActivating(false);
    }
  };

  // Still loading auth or code
  if (authStatus === 'loading' || codeStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-muted-foreground">Verification du QR code...</p>
        </div>
      </div>
    );
  }

  // Activation success
  if (activationSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-4">
        <Card className="w-full max-w-md text-center border-2 border-emerald-200">
          <CardContent className="p-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold mb-2">QR Code active !</h1>
            <p className="text-sm text-muted-foreground mb-1">Code : <span className="font-mono font-semibold">{code}</span></p>
            <p className="text-sm text-muted-foreground mb-6">Module <span className="font-semibold">{QR_MODULE_LABELS[moduleType] || moduleType}</span> assigne.</p>
            <Link href="/">
              <Button className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700">
                Aller au dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not found / Lost / Cancelled / Error
  if (['not_found', 'lost', 'cancelled', 'error'].includes(codeStatus)) {
    const msgs: Record<string, { title: string; desc: string }> = {
      not_found: { title: 'QR code introuvable', desc: 'Ce code n\'existe pas. Verifiez et reessayez.' },
      lost: { title: 'QR code perdu', desc: 'Ce code a ete signale comme perdu.' },
      cancelled: { title: 'QR code annule', desc: 'Ce code a ete annule par l\'administrateur.' },
      error: { title: 'Erreur', desc: 'Impossible de verifier le code. Reessayez.' },
    };
    const msg = msgs[codeStatus] || msgs.error;
    const Icon = codeStatus === 'error' ? AlertCircle : XCircle;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <Icon className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold mb-2">{msg.title}</h1>
            <p className="text-sm text-muted-foreground mb-1">Code : <span className="font-mono font-semibold">{code}</span></p>
            <p className="text-sm text-muted-foreground mb-6">{msg.desc}</p>
            <Link href="/"><Button variant="outline" className="w-full gap-2"><LinkIcon className="h-4 w-4" />Retour a l\'accueil</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Active
  if (codeStatus === 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-4">
        <Card className="w-full max-w-md border-2 border-emerald-200">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-xl font-bold mb-2">QR code actif</h1>
            <p className="text-sm text-muted-foreground mb-1">Code : <span className="font-mono font-semibold">{code}</span></p>
            <p className="text-sm text-muted-foreground mb-6">Ce QR code est deja configure.</p>
            <Link href="/"><Button variant="outline" className="w-full gap-2"><LinkIcon className="h-4 w-4" />Aller au dashboard</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not logged in + inactive = show signup/login buttons
  if (!session && codeStatus === 'inactive') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-4">
        <Card className="w-full max-w-md border-2 border-emerald-200">
          <CardContent className="p-8 space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/25">
                <QrCode className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-xl font-bold">QR code pret a activer</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Code : <span className="font-mono font-semibold">{code}</span>
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-sm text-amber-800">
                Connectez-vous ou creez un compte pour activer ce QR code.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleGoToSignup}
                className="w-full h-12 text-base font-bold gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-600/25"
              >
                <UserPlus className="h-5 w-5" />
                Creer un compte et activer
              </Button>
              <Button
                onClick={handleGoToLogin}
                variant="outline"
                className="w-full h-12 text-base gap-2"
              >
                <LogIn className="h-5 w-5" />
                Se connecter
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              QR Domotik &middot; qrdomotik.roomscan.pro
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Logged in + inactive = show activation form
  if (session && codeStatus === 'inactive') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50 to-white p-4">
        <Card className="w-full max-w-lg border-2 border-emerald-200">
          <CardContent className="p-6 md:p-8 space-y-6">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/25">
                <QrCode className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-xl font-bold">Activer le QR code</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Code : <span className="font-mono font-semibold">{code}</span>
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-600" />
                <Label className="font-semibold">Choisissez le module</Label>
              </div>
              <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {POPULAR_MODULES.map((type) => (
                  <button
                    key={type}
                    onClick={() => setModuleType(type)}
                    className={`rounded-lg border-2 px-3 py-2.5 text-xs font-medium text-center transition-all ${
                      moduleType === type
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-border hover:border-emerald-300'
                    }`}
                  >
                    {QR_MODULE_LABELS[type] || type}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="font-semibold">Nom du QR code</Label>
              <Input
                placeholder="ex: Wi-Fi Invites Entree"
                value={qrName}
                onChange={(e) => setQrName(e.target.value)}
                className="h-11"
              />
            </div>

            <Button
              className="w-full h-12 text-base font-bold gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-600/25"
              onClick={handleActivate}
              disabled={activating || !moduleType || !qrName}
            >
              {activating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
              {activating ? 'Activation...' : 'Activer maintenant'}
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              QR Domotik &middot; qrdomotik.roomscan.pro
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
