'use client';

import { Card, CardContent } from '@/components/ui/card';
import { QrCode } from 'lucide-react';

interface GenericDisplayProps {
  content: Record<string, any>;
  qrCodeId?: string;
  qrName?: string;
}

export function GenericDisplay({ content, qrName }: GenericDisplayProps) {
  const title = content?.title || 'Module';
  const body = content?.body || '';

  // Try to render body as simple text with line breaks
  const renderBody = (text: string) => {
    if (!text) return <p className="text-muted-foreground italic">Aucun contenu configuré</p>;
    return text.split('\n').map((line: string, i: number) => (
      <p key={i} className="text-sm leading-relaxed">{line}</p>
    ));
  };

  // Render any other key-value pairs from content
  const otherEntries = Object.entries(content || {}).filter(
    ([key]) => !['title', 'body', 'items'].includes(key)
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto max-w-md px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-500 shadow-lg shadow-slate-500/25">
            <QrCode className="h-8 w-8 text-white" />
          </div>
          {qrName && <p className="text-sm text-muted-foreground">{qrName}</p>}
        </div>

        {/* Content Card */}
        <Card className="border-2 border-slate-100">
          <CardContent className="p-6 space-y-4">
            <h1 className="text-xl font-bold">{title}</h1>
            {body && <div className="space-y-1">{renderBody(body)}</div>}

            {/* Other fields */}
            {otherEntries.length > 0 && (
              <div className="mt-4 space-y-2 rounded-lg bg-muted/50 p-4">
                {otherEntries.map(([key, value]) => (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground capitalize">{key}</span>
                    <span className="font-medium text-right max-w-[60%]">
                      {typeof value === 'boolean' ? (value ? 'Oui' : 'Non') : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          QR Domotik · Scannez le QR pour accéder
        </p>
      </div>
    </div>
  );
}
