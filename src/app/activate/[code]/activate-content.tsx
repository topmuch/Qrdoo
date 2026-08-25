'use client';

import { use, useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  QrCode, CheckCircle2, XCircle, AlertCircle, Loader2,
  ArrowRight, Link as LinkIcon, Zap, Sparkles, UserPlus, LogIn,
  Eye, EyeOff, Wifi, BookOpen, Phone, Bell, Shield, ListChecks, Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { QR_MODULE_LABELS } from '@/types/database';

type CodeStatus = 'loading' | 'not_found' | 'inactive' | 'active' | 'lost' | 'cancelled' | 'error';

const MODULES_WITH_ICONS = [
  { key: 'wifi', label: 'Wi-Fi', Icon: Wifi },
  { key: 'doorbell', label: 'Portier', Icon: Bell },
  { key: 'emergency', label: 'Urgence', Icon: Shield },
  { key: 'note', label: 'Note', Icon: BookOpen },
  { key: 'contact', label: 'Contact', Icon: Phone },
  { key: 'shopping_list', label: 'Liste de courses', Icon: ListChecks },
  { key: 'inventory', label: 'Inventaire', Icon: ListChecks },
  { key: 'guestbook', label: "Livre d'or", Icon: BookOpen },
  { key: 'chore', label: 'Corvees', Icon: ListChecks },
  { key: 'checklist', label: 'Checklist', Icon: ListChecks },
  { key: 'timer', label: 'Minuterie', Icon: Clock },
  { key: 'recipe', label: 'Recette', Icon: BookOpen },
];

/* Module content state shape */
interface WifiContent {
  ssid: string;
  password: string;
  security: string;
}
interface ContactContent {
  name: string;
  phone: string;
  email: string;
}
interface GenericContent {
  title: string;
  body: string;
}

type ModuleContent = WifiContent | ContactContent | GenericContent;

function getDefaultContent(type: string): ModuleContent {
 switch (type) {
    case 'wifi': return { ssid: '', password: '', security: 'WPA' } as WifiContent;
    case 'contact': return { name: '', phone: '', email: '' } as ContactContent;
    default: return { title: '', body: '' } as GenericContent;
  }
}

function getModuleFields(type: string): { requireName: boolean; description: string } {
  switch (type) {
    case 'wifi': return { requireName: false, description: 'Entrez les informations de votre reseau Wi-Fi' };
    case 'contact': return { requireName: false, description: 'Entrez les informations de contact' };
    case 'doorbell': return { requireName: true, description: 'Vous pourrez configurer les consignes depuis le dashboard' };
    case 'emergency': return { requireName: true, description: 'Vous pourrez configurer les contacts depuis le dashboard' };
    case 'guestbook': return { requireName: true, description: 'Les visiteurs pourront laisser des messages' };
    default: return { requireName: true, description: 'Vous pourrez modifier le contenu depuis le dashboard' };
  }
}

export function ActivatePageContent({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const { data: session, status: authStatus } = useSession();
  const [codeStatus, setCodeStatus] = useState<CodeStatus>('loading');
  const [physicalQrId, setPhysicalQrId] = useState('');

  // Activation form state
  const [moduleType, setModuleType] = useState('');
  const [qrName, setQrName] = useState('');
  const [moduleContent, setModuleContent] = useState<ModuleContent | null>(null);
  const [showPassword, setShowPassword] = useState(false);
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

  // When module type changes, reset content
  const handleModuleChange = (type: string) => {
    setModuleType(type);
    setModuleContent(getDefaultContent(type));
    if (type === 'wifi') setQrName('');
  };

  const updateContent = (field: string, value: string) => {
    setModuleContent(prev => prev ? { ...prev, [field]: value } : null);
  };

  const handleActivate = async () => {
    if (!moduleType) {
      toast.error('Choisissez un module');
      return;
    }
    const fields = getModuleFields(moduleType);
    if (fields.requireName && !qrName.trim()) {
      toast.error('Entrez un nom pour ce QR code');
      return;
    }

    // Validate module-specific required fields
    if (moduleType === 'wifi') {
      const wc = moduleContent as WifiContent | null;
      if (!wc?.ssid?.trim()) { toast.error('Entrez le nom du reseau Wi-Fi'); return; }
      if (!wc?.password?.trim()) { toast.error('Entrez le mot de passe Wi-Fi'); return; }
    }
    if (moduleType === 'contact') {
      const cc = moduleContent as ContactContent | null;
      if (!cc?.name?.trim()) { toast.error('Entrez le nom du contact'); return; }
    }

    setActivating(true);
    try {
      const res = await fetch('/api/client/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          moduleType,
          name: qrName || `${QR_MODULE_LABELS[moduleType] || moduleType}`,
          content: moduleContent,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setActivationSuccess(true);
      toast.success('QR code active !');
    } catch (e: any) {
      toast.error(e.message || "Erreur lors de l'activation");
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
            <p className="text-sm text-muted-foreground mb-6">Module <span className="font-semibold">{QR_MODULE_LABELS[moduleType] || moduleType}</span> configure.</p>
            <p className="text-xs text-emerald-600 bg-emerald-50 rounded-lg p-3 mb-6">
              Vous pouvez modifier le contenu a tout moment depuis votre dashboard.
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
      not_found: { title: 'QR code introuvable', desc: "Ce code n'existe pas. Verifiez et reessayez." },
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
              <Button onClick={handleGoToSignup} className="w-full h-12 text-base font-bold gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg shadow-emerald-600/25">
                <UserPlus className="h-5 w-5" />
                Creer un compte et activer
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

  // ===== Module content fields =====
  const fields = moduleType ? getModuleFields(moduleType) : null;
  const wc = moduleType === 'wifi' ? moduleContent as WifiContent | null : null;
  const cc = moduleType === 'contact' ? moduleContent as ContactContent | null : null;
  const gc = (!['wifi', 'contact'].includes(moduleType) && moduleContent) ? moduleContent as GenericContent | null : null;

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
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto pr-1">
                {MODULES_WITH_ICONS.map(({ key, label, Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleModuleChange(key)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 px-2 py-3 text-center transition-all ${
                      moduleType === key
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                        : 'border-border hover:border-emerald-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="text-[11px] font-medium leading-tight">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Module content fields */}
            {moduleType && moduleContent && (
              <>
                <Separator />
                {fields && (
                  <p className="text-xs text-muted-foreground text-center -mt-2">{fields.description}</p>
                )}

                {/* WIFI FIELDS */}
                {moduleType === 'wifi' && wc && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Nom du reseau (SSID)</Label>
                      <div className="relative">
                        <Wifi className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="MonWifi_5G"
                          value={wc.ssid}
                          onChange={(e) => updateContent('ssid', e.target.value)}
                          className="h-11 pl-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Mot de passe</Label>
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Mot de passe Wi-Fi"
                          value={wc.password}
                          onChange={(e) => updateContent('password', e.target.value)}
                          className="h-11 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Securite</Label>
                      <Select value={wc.security} onValueChange={(v) => updateContent('security', v)}>
                        <SelectTrigger className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="WPA">WPA/WPA2/WPA3</SelectItem>
                          <SelectItem value="WEP">WEP</SelectItem>
                          <SelectItem value="NONE">Ouvert (pas de mot de passe)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* CONTACT FIELDS */}
                {moduleType === 'contact' && cc && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Nom</Label>
                      <Input placeholder="Jean Dupont" value={cc.name} onChange={(e) => updateContent('name', e.target.value)} className="h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Telephone</Label>
                      <Input placeholder="+33 6 12 34 56 78" value={cc.phone} onChange={(e) => updateContent('phone', e.target.value)} className="h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Email</Label>
                      <Input placeholder="jean@exemple.com" value={cc.email} onChange={(e) => updateContent('email', e.target.value)} className="h-11" />
                    </div>
                  </div>
                )}

                {/* GENERIC FIELDS (note, checklist, recipe, etc.) */}
                {!['wifi', 'contact'].includes(moduleType) && gc && (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Titre</Label>
                      <Input placeholder="ex: Liste de courses" value={gc.title} onChange={(e) => updateContent('title', e.target.value)} className="h-11" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-sm font-medium">Contenu</Label>
                      <Textarea
                        placeholder="Votre contenu ici..."
                        value={gc.body}
                        onChange={(e) => updateContent('body', e.target.value)}
                        rows={4}
                      />
                    </div>
                  </div>
                )}

                {/* Name (optional for wifi/contact, required for others) */}
                {fields?.requireName && (
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Nom du QR code</Label>
                    <Input placeholder="ex: Wi-Fi Invites Entree" value={qrName} onChange={(e) => setQrName(e.target.value)} className="h-11" />
                  </div>
                )}
              </>
            )}

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
