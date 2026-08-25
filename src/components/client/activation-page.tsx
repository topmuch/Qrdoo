'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { QrCode, CheckCircle2, XCircle, AlertCircle, Loader2, ArrowRight, ArrowLeft, Zap, Home, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { QR_MODULE_LABELS } from '@/types/database';

const POPULAR_MODULES = ['wifi', 'guestbook', 'doorbell', 'emergency', 'note', 'contact', 'shopping_list', 'inventory', 'chore', 'checklist', 'timer', 'recipe'];

export function ActivationPage() {
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'input' | 'check' | 'configure'>('input');
  const [status, setStatus] = useState<'loading' | 'not_found' | 'inactive' | 'active' | 'lost' | 'cancelled'>('loading');
  const [physicalQrId, setPhysicalQrId] = useState('');
  const [moduleType, setModuleType] = useState('');
  const [roomName, setRoomName] = useState('');
  const [qrName, setQrName] = useState('');
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([]);
  const [homeId, setHomeId] = useState('');
  const [activating, setActivating] = useState(false);
  const [success, setSuccess] = useState(false);

  const checkCode = async (codeToCheck: string) => {
    if (codeToCheck.length < 3) return;
    setStatus('loading');
    try {
      const res = await fetch(`/api/client/check-code?code=${codeToCheck}`);
      const data = await res.json();
      setStatus(data.status);
      if (data.status === 'inactive' && data.physicalQr) {
        setPhysicalQrId(data.physicalQr.id);
        // Fetch homes and rooms
        const homesRes = await fetch('/api/client/homes');
        const homesData = await homesRes.json();
        const home = homesData.homes?.[0];
        if (home) {
          setHomeId(home.id);
          const roomsRes = await fetch(`/api/client/rooms?homeId=${home.id}`);
          const roomsData = await roomsRes.json();
          setRooms(roomsData.rooms || []);
        }
      }
    } catch { setStatus('not_found'); }
  };

  useEffect(() => {
    // Debounce check after 500ms of no typing
    const timer = setTimeout(() => {
      if (code.length >= 6) checkCode(code);
      else { setStatus('loading'); setStep('input'); }
    }, 500);
    return () => clearTimeout(timer);
  }, [code]);

  const formatCode = (val: string) => {
    return val.replace(/[^A-Z0-9-]/gi, '').toUpperCase();
  };

  const handleActivate = async () => {
    if (!physicalQrId || !moduleType || !qrName) return;
    setActivating(true);
    try {
      const res = await fetch('/api/client/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, moduleType, roomId: rooms[0]?.id || '', name: qrName, homeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur');
      setSuccess(true);
      toast.success('QR code activé avec succès !');
    } catch (e: any) { toast.error(e.message); }
    finally { setActivating(false); }
  };

  // Success state
  if (success) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-white p-4'>
        <Card className='w-full max-w-md text-center'>
          <CardContent className='p-8'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100'><CheckCircle2 className='h-8 w-8 text-emerald-600' /></div>
            <h2 className='text-xl font-bold mb-2'>QR Code activé !</h2>
            <p className='text-muted-foreground mb-2'>Votre QR code <span className='font-mono font-semibold'>{code}</span> est maintenant actif.</p>
            <p className='text-sm text-muted-foreground'>Connectez-vous à votre dashboard pour le configurer.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white p-4'>
      <Card className='w-full max-w-lg'>
        <CardHeader className='text-center pb-2'>
          <div className='mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary'><QrCode className='h-7 w-7 text-primary-foreground' /></div>
          <CardTitle className='text-xl'>Activer un QR Code</CardTitle>
          <CardDescription>Entrez le code imprimé sur votre QR code physique.</CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Step 1: Code input */}
          <div className='space-y-2'>
            <Label>Code d'activation</Label>
            <div className='relative'>
              <Input
                className='text-center font-mono text-xl tracking-widest h-14'
                placeholder='QR-XXXXXXXX'
                value={code}
                onChange={(e) => setCode(formatCode(e.target.value))}
                maxLength={30}
                disabled={step !== 'input'}
              />
              {status === 'loading' && code.length >= 3 && (
                <p className='text-xs text-muted-foreground text-center mt-1'>Entrez le code impré sur votre QR code</p>
              )}
            </div>
            {/* Status feedback */}
            {status === 'not_found' && (
              <div className='flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive'><XCircle className='h-4 w-4 shrink-0' /><span>Code introuvable. Vérifiez et réessayez.</span></div>
            )}
            {status === 'active' && (
              <div className='flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/5 p-3 text-sm text-amber-700'><AlertCircle className='h-4 w-4 shrink-0' /><span>Ce code est déjà activé. Connectez-vous pour le gérer.</span></div>
            )}
            {(status === 'lost' || status === 'cancelled') && (
              <div className='flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive'><XCircle className='h-4 w-4 shrink-0' /><span>Ce code n'est plus valable. Contactez le support.</span></div>
            )}
            {status === 'inactive' && (
              <div className='flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/5 p-3 text-sm text-emerald-700'><CheckCircle2 className='h-4 w-4 shrink-0' /><span>Code valide et prêt à être activé !</span></div>
            )}
          </div>

          {status === 'inactive' && (
            <>
              <Separator />
              {/* Step 2: Module type */}
              <div className='space-y-3'>
                <div className='flex items-center gap-2'><Zap className='h-4 w-4 text-primary' /><Label className='font-semibold'>Choisissez le module</Label></div>
                <div className='grid grid-cols-3 gap-2 max-h-48 overflow-y-auto'>
                  {POPULAR_MODULES.map((type) => (
                    <button key={type} onClick={() => setModuleType(type)}
                      className={`rounded-lg border-2 px-3 py-2 text-xs font-medium text-center transition-all ${moduleType === type ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                      {QR_MODULE_LABELS[type] || type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Name + Room */}
              <div className='space-y-3'>
                <div className='space-y-2'>
                  <Label>Nom du QR code</Label>
                  <Input placeholder='ex: Wi-Fi Invités' value={qrName} onChange={(e) => setQrName(e.target.value)} />
                </div>
                {rooms.length > 0 && (
                  <div className='space-y-2'>
                    <Label>Pièce</Label>
                    <div className='flex flex-wrap gap-2'>
                      {rooms.map((r) => (
                        <button key={r.id} onClick={() => setRoomName(r.name)}
                          className={`rounded-md border-2 px-3 py-1.5 text-xs font-medium transition-all ${roomName === r.name ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'}`}>
                          {r.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Button className='w-full' size='lg' onClick={handleActivate} disabled={activating || !moduleType || !qrName}>
                {activating ? <><Loader2 className='mr-2 h-4 w-4 animate-spin' />Activation...</> : <>Activer maintenant <ArrowRight className='ml-2 h-4 w-4' /></>}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
