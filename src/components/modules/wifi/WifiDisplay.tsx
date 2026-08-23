'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Wifi, Copy, Check, Eye, EyeOff, Shield, Radio } from 'lucide-react';
import { toast } from 'sonner';

export interface WifiContent {
  ssid: string;
  password: string;
  security: 'WPA' | 'WEP' | 'nopass';
  hidden: boolean;
}

interface WifiDisplayProps {
  content: WifiContent;
  qrName?: string;
}

export function WifiDisplay({ content, qrName }: WifiDisplayProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

  const securityLabel = content.security === 'WPA' ? 'WPA/WPA2/WPA3' : content.security === 'WEP' ? 'WEP' : 'Ouvert';
  const securityVariant = content.security === 'WPA' ? 'default' as const : content.security === 'WEP' ? 'secondary' as const : 'outline' as const;

  const getWifiUrl = () => {
    return `WIFI:S:${content.ssid};T:${content.security};P:${content.password};H:${content.hidden ? 'true' : 'false'};;`;
  };

  const handleConnect = () => {
    const wifiUrl = getWifiUrl();
    // Try to open native Wi-Fi connection (works on iOS/Android)
    const link = document.createElement('a');
    link.href = wifiUrl;
    link.click();
    toast.success('Si votre appareil le supporte, la connexion Wi-Fi va s\'ouvrir');
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(content.password);
      setCopied(true);
      toast.success('Mot de passe copié !');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Impossible de copier');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/20 dark:to-background">
      <div className="mx-auto max-w-md px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 shadow-lg shadow-emerald-500/25">
            <Wifi className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Wi-Fi Invités</h1>
          {qrName && <p className="mt-1 text-sm text-muted-foreground">{qrName}</p>}
        </div>

        {/* Network Info Card */}
        <Card className="mb-4 border-2 border-emerald-100 dark:border-emerald-900/30">
          <CardContent className="p-6">
            <div className="space-y-4">
              {/* SSID */}
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Réseau</p>
                <p className="text-xl font-bold">{content.ssid}</p>
              </div>

              {/* Security Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Sécurité</span>
                </div>
                <Badge variant={securityVariant}>{securityLabel}</Badge>
              </div>

              {/* Hidden Network */}
              {content.hidden && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Réseau masqué</span>
                  </div>
                  <Badge variant="outline">Oui</Badge>
                </div>
              )}

              {/* Password */}
              {content.security !== 'nopass' && (
                <div className="rounded-lg border p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Mot de passe</p>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="flex-1 font-mono text-lg tracking-wider">
                      {showPassword ? content.password : '•'.repeat(content.password.length)}
                    </p>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-9 w-9"
                      onClick={handleCopyPassword}
                    >
                      {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleConnect}
            className="w-full h-12 text-base font-semibold bg-emerald-600 hover:bg-emerald-700"
            size="lg"
          >
            <Wifi className="mr-2 h-5 w-5" />
            Se connecter au Wi-Fi
          </Button>

          {content.security !== 'nopass' && (
            <Button
              variant="outline"
              className="w-full h-12 text-base"
              size="lg"
              onClick={handleCopyPassword}
            >
              {copied ? <Check className="mr-2 h-5 w-5 text-emerald-500" /> : <Copy className="mr-2 h-5 w-5" />}
              {copied ? 'Copié !' : 'Copier le mot de passe'}
            </Button>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          QR Domotik &middot; Scannez le QR pour accéder
        </p>
      </div>
    </div>
  );
}
