'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  QrCode, CheckCircle2, XCircle, AlertCircle, Loader2,
  ArrowRight, Link as LinkIcon, Zap, Sparkles, UserPlus, LogIn,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { QR_MODULE_LABELS } from '@/types/database';
import {
  ModuleContentFields,
  moduleHasContentFields,
  validateModuleContent,
  MODULE_ACTIVATION_CONFIG,
} from '@/components/client/module-content-fields';

type CodeStatus = 'loading' | 'not_found' | 'inactive' | 'active' | 'lost' | 'cancelled' | 'error';

const POPULAR_MODULES = [
  'wifi', 'external_link', 'home_manual', 'note', 'meal_planner',
  'guestbook', 'doorbell', 'emergency', 'contact', 'shopping_list',
  'checklist', 'medication', 'energy_monitor', 'key_location', 'cleaning_schedule',
  'inventory', 'chore', 'timer', 'recipe',
] as const;

export function ActivatePageContent({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { data: session, status: authStatus } = useSession();
  const [codeStatus, setCodeStatus] = useState<CodeStatus>('loading');
  const [physicalQrId, setPhysicalQrId] = useState('');

  // Activation form state
  const [moduleType, setModuleType] = useState('');
  const [qrName, setQrName] = useState('');
  const [moduleContent, setModuleContent] = useState<Record<string, string>>({});
  const [contentErrors, setContentErrors] = useState<string[]>([]);
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

  const handleGoToSignup = () => {
    sessionStorage.setItem('pendingActivationCode', code);
    window.location.href = '/?action=activate';
  };

  const handleGoToLogin = () => {
    sessionStorage.setItem('pendingActivationCode', code);
    window.location.href = '/?action=activate';
  };

  const handleModuleChange = (type: string) => {
    setModuleType(type);
    setModuleContent({});
    setContentErrors([]);
    // Auto-fill name for wifi
    if (type === 'wifi') setQrName('Wi-Fi Invités');
    else if (!qrName) setQrName('');
  };

  const handleActivate = async () => {
    if (!moduleType) {
      toast.error('Choisissez un module');
      return;
    }

    // Validate content fields
    const errors = validateModuleContent(moduleType, moduleContent);
    if (errors.length > 0) {
      setContentErrors(errors);
      toast.error(`Champs requis : ${errors.join(', ')}`);
      return;
    }

    // Require name
    const moduleName = qrName.trim() || `${QR_MODULE_LABELS[moduleType as keyof typeof QR_MODULE_LABELS] || moduleType}`;

    setActivating(true);
    try {
      const hasContent = moduleHasContentFields(moduleType) && Object.keys(moduleContent).length > 0;
      const res = await fetch('/api/client/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          moduleType,
          name: moduleName,
          content: hasContent ? moduleContent : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setActivationSuccess(true);
      toast.success('QR code activé !');
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'activation");
    } finally {
      setActivating(false);
    }
  };

  // Still loading
  if (authStatus === 'loading' || codeStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-muted-foreground">Vérification du QR code...</p>
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
            <h1 className="text-xl font-bold mb-2">QR Code activé !</h1>
            <p className="text-sm text-muted-foreground mb-1">Code : <span className="font-mono font-semibold">{code}</span></p>
            <p className="text-sm text-muted-foreground mb-6">Module <span className="font-semibold">{QR_MODULE_LABELS[moduleType as keyof typeof QR_MODULE_LABELS] || moduleType}</span> configuré.</p>
            <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg p-3 mb-6">
              Scannez le QR code à nouveau pour voir le module en action.<br />
              Vous pouvez aussi modifier le contenu depuis votre dashboard.
            </p>
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
      not_found: { title: 'QR code introuvable', desc: "Ce code n'existe pas. Vérifiez et réessayez." },
      lost: { title: 'QR code perdu', desc: 'Ce code a été signalé comme perdu.' },
      cancelled: { title: 'QR code annulé', desc: 'Ce code a été annulé.' },
      error: { title: 'Erreur', desc: 'Impossible de vérifier le code. Réessayez.' },
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
            <Link href="/"><Button variant="outline" className="w-full gap-2"><LinkIcon className="h-4 w-4" />Retour à l'accueil</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already active
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
            <p className="text-sm text-muted-foreground mb-6">Ce QR code est déjà configuré.</p>
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
              <h1 className="text-xl font-bold">QR code prêt à activer</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Code : <span className="font-mono font-semibold">{code}</span>
              </p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-sm text-amber-800">
                Connectez-vous ou créez un compte pour activer ce QR code.
              </p>
            </div>
            <div className="space-y-3">
              <Button onClick={handleGoToSignup} className="w-full h-12 text-base font-bold gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-600/25">
                <UserPlus className="h-5 w-5" />
                Créer un compte et activer
              </Button>
              <Button onClick={handleGoToLogin} variant="outline" className="w-full h-12 text-base gap-2">
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
        <Card className="w-full max-w-lg border-2 border-emerald-200">
          <CardContent className="p-6 md:p-8 space-y-5">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/25">
                <QrCode className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-xl font-bold">Activer le QR code</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Code : <span className="font-mono font-semibold">{code}</span>
              </p>
            </div>

            {/* Module selector */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-emerald-600" />
                <Label className="font-semibold text-sm">Choisissez le module</Label>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                {POPULAR_MODULES.map((type) => {
                  const config = MODULE_ACTIVATION_CONFIG[type];
                  const IconComp = config?.icon;
                  const label = QR_MODULE_LABELS[type as keyof typeof QR_MODULE_LABELS] || type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleModuleChange(type)}
                      className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center transition-all ${
                        moduleType === type
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                          : 'border-border hover:border-emerald-300'
                      }`}
                    >
                      {IconComp ? (
                        <IconComp className="h-5 w-5" />
                      ) : (
                        <QrCode className="h-5 w-5" />
                      )}
                      <span className="text-[11px] font-medium leading-tight">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Module content fields */}
            {moduleType && moduleHasContentFields(moduleType) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <Label className="font-semibold text-sm">Configuration du module</Label>
                  {contentErrors.length > 0 && (
                    <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-2.5 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>Remplissez : {contentErrors.join(', ')}</span>
                    </div>
                  )}
                  <ModuleContentFields
                    moduleType={moduleType}
                    content={moduleContent}
                    onChange={(c) => { setModuleContent(c); setContentErrors([]); }}
                  />
                </div>
              </>
            )}

            {/* Name input */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Nom du QR code</Label>
              <div className="relative">
                <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="ex: Wi-Fi Invités Entrée"
                  value={qrName}
                  onChange={(e) => setQrName(e.target.value)}
                  className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            {/* Activate button */}
            <Button
              className="w-full h-12 text-base font-bold gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-600/25"
              onClick={handleActivate}
              disabled={activating || !moduleType}
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
