'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, Wifi, Link2, FileText, Smartphone } from 'lucide-react';
import { MODULE_DEFINITIONS } from '@/components/modules/registry';
import { WifiDisplay, type WifiContent } from '@/components/modules/wifi/WifiDisplay';
import { LinkDisplay, type LinkContent } from '@/components/modules/link/LinkDisplay';
import { InfoDisplay, type InfoContent } from '@/components/modules/info/InfoDisplay';

const DEMO_CONTENT: Record<string, unknown> = {
  wifi: {
    ssid: 'MaisonDesDupont_5G',
    password: 'Bienvenue2024!',
    security: 'WPA',
    hidden: false,
  } satisfies WifiContent,
  external_link: {
    url: 'https://qrdomotik.com',
    title: 'QR Domotik',
    description: 'Découvrez la plateforme qui rend votre maison phygitale. Gérez vos QR codes, configurez vos modules et bien plus encore.',
  } satisfies LinkContent,
  home_manual: {
    title: 'Bienvenue chez nous !',
    body: `# Guide de la maison

Merci de votre visite ! Voici les informations utiles.

## Wi-Fi
- **SSID** : MaisonDesDupont_5G
- **Mot de passe** : Scannez le QR code dans l'entrée

## Consignes
> Merci de retirer vos chaussures
> Pas de bruit après 22h

## Équipements
1. **Cuisine** : Ouverte, aidez-vous !
2. **Salle de bain** : Serviettes dans le placard
3. **Jardin** : Accès libre

---

*Pour toute question, n'hésitez pas à nous contacter.*`,
  } satisfies InfoContent,
};

export function ModulePreviewPage() {
  const [activeModule, setActiveModule] = useState('wifi');

  const renderDisplay = (type: string) => {
    const content = DEMO_CONTENT[type];
    if (!content) return null;

    switch (type) {
      case 'wifi':
        return <WifiDisplay content={content as WifiContent} qrName={"QR Wi-Fi Entrée"} />;
      case 'external_link':
        return <LinkDisplay content={content as LinkContent} qrName={"QR Site Web"} />;
      case 'home_manual':
        return <InfoDisplay content={content as InfoContent} qrName={"QR Guide Maison"} />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Eye className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Aperçu des Modules</h2>
          <p className="text-sm text-muted-foreground">Visualisez l'apparence de chaque module côté public</p>
        </div>
      </div>

      {/* Module selector tabs */}
      <Tabs value={activeModule} onValueChange={setActiveModule}>
        <TabsList className="grid w-full grid-cols-3">
          {MODULE_DEFINITIONS.map((mod) => {
            const Icon = mod.type === 'wifi' ? Wifi : mod.type === 'external_link' ? Link2 : FileText;
            return (
              <TabsTrigger key={mod.type} value={mod.type} className="gap-2 text-xs sm:text-sm">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{mod.label}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {MODULE_DEFINITIONS.map((mod) => (
          <TabsContent key={mod.type} value={mod.type} className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Info Card */}
              <div className="lg:col-span-4 space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${mod.bgColor}`}>
                        <span className={mod.color}>
                          {mod.type === 'wifi' ? <Wifi className="h-4 w-4" /> : mod.type === 'external_link' ? <Link2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        </span>
                      </div>
                      <CardTitle className="text-base">{mod.label}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{mod.description}</p>
                    <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
                      <Smartphone className="h-3.5 w-3.5" />
                      <span>Vue mobile ci-contre</span>
                    </div>
                  </CardContent>
                </Card>

                {/* QR code info */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Données du module</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-lg bg-muted/50 p-3">
                      <pre className="text-xs text-muted-foreground overflow-x-auto whitespace-pre-wrap font-mono">
                        {JSON.stringify(DEMO_CONTENT[mod.type], null, 2)}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Phone Preview */}
              <div className="lg:col-span-8">
                <div className="rounded-xl border shadow-sm overflow-hidden">
                  <div className="bg-muted/30 px-4 py-2 flex items-center gap-2 border-b">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-400" />
                      <div className="h-3 w-3 rounded-full bg-yellow-400" />
                      <div className="h-3 w-3 rounded-full bg-green-400" />
                    </div>
                    <div className="flex-1 text-center">
                      <span className="text-xs text-muted-foreground">{mod.label} — Aperçu mobile</span>
                    </div>
                  </div>
                  <div className="mx-auto max-w-[390px] max-h-[700px] overflow-y-auto border-x">
                    {renderDisplay(mod.type)}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
