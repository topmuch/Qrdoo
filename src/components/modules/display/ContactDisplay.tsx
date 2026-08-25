'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Phone, Mail, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface ContactDisplayProps {
  content: Record<string, any>;
  qrCodeId?: string;
  qrName?: string;
}

export function ContactDisplay({ content, qrCodeId, qrName }: ContactDisplayProps) {
  const name = content?.name || 'Contact';
  const phone = content?.phone || '';
  const email = content?.email || '';
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success('Copié dans le presse-papier');
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error('Impossible de copier');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white dark:from-teal-950/20 dark:to-background">
      <div className="mx-auto max-w-md px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-500 shadow-lg shadow-teal-500/25">
            <User className="h-8 w-8 text-white" />
          </div>
          {qrName && <p className="text-sm text-muted-foreground">{qrName}</p>}
        </div>

        {/* Name Card */}
        <Card className="mb-4 border-2 border-teal-100 dark:border-teal-900/30">
          <CardContent className="p-6 text-center">
            <h1 className="text-3xl font-bold text-teal-900 dark:text-teal-100">
              {name}
            </h1>
          </CardContent>
        </Card>

        {/* Phone Card */}
        {phone && (
          <Card className="mb-4 border-2 border-teal-100 dark:border-teal-900/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <a
                  href={`tel:${phone}`}
                  className="flex flex-1 items-center gap-3 rounded-lg p-2 -ml-2 transition-colors hover:bg-teal-50 dark:hover:bg-teal-950/30"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/40">
                    <Phone className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Téléphone</p>
                    <p className="truncate font-medium text-teal-700 dark:text-teal-300">
                      {phone}
                    </p>
                  </div>
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-teal-600"
                  onClick={() => handleCopy(phone, 'phone')}
                >
                  {copiedField === 'phone' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="sr-only">Copier le numéro</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Email Card */}
        {email && (
          <Card className="mb-4 border-2 border-teal-100 dark:border-teal-900/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <a
                  href={`mailto:${email}`}
                  className="flex flex-1 items-center gap-3 rounded-lg p-2 -ml-2 transition-colors hover:bg-teal-50 dark:hover:bg-teal-950/30"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-100 dark:bg-teal-900/40">
                    <Mail className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">E-mail</p>
                    <p className="truncate font-medium text-teal-700 dark:text-teal-300">
                      {email}
                    </p>
                  </div>
                </a>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 text-muted-foreground hover:text-teal-600"
                  onClick={() => handleCopy(email, 'email')}
                >
                  {copiedField === 'email' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="sr-only">Copier l'e-mail</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* No contact info fallback */}
        {!phone && !email && (
          <Card className="border-2 border-teal-100 dark:border-teal-900/30">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                Aucune information de contact disponible.
              </p>
            </CardContent>
          </Card>
        )}

        <p className="mt-6 text-center text-xs text-muted-foreground">
          QR Domotik &middot; Scannez le QR pour accéder
        </p>
      </div>
    </div>
  );
}
