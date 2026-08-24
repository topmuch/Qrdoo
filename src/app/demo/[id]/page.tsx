'use client';

import { use } from 'react';
import { WifiDisplay, type WifiContent } from '@/components/modules/wifi/WifiDisplay';
import { DoorbellDisplay, type DoorbellContent } from '@/components/modules/doorbell/DoorbellDisplay';
import { InfoDisplay, type InfoContent } from '@/components/modules/info/InfoDisplay';
import { LinkDisplay, type LinkContent } from '@/components/modules/link/LinkDisplay';
import { Wifi, DoorOpen, ShoppingBag, BookOpen, Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/* ------------------------------------------------------------------ */
/*  Demo Content (realistic data for each module)                      */
/* ------------------------------------------------------------------ */

const DEMO_MODULES: Record<string, {
  label: string;
  icon: React.ReactNode;
  color: string;
  component: React.ReactNode;
}> = {
  wifi: {
    label: 'Wi-Fi Invités',
    icon: <Wifi className="h-8 w-8" />,
    color: '#2563EB',
    component: (
      <WifiDisplay
        content={{
          ssid: 'MaisonDesDupont_5G',
          password: 'Bienvenue2024!',
          security: 'WPA',
          hidden: false,
        } satisfies WifiContent}
        qrName="QR Wi-Fi Entrée"
      />
    ),
  },
  porter: {
    label: 'Portier Virtuel',
    icon: <DoorOpen className="h-8 w-8" />,
    color: '#10B981',
    component: (
      <DoorbellDisplay
        content={{
          mode: 'present',
          instructions: [
            'Chez le gardien, au 2ème étage',
            'Dans la boîte à colis à gauche de la porte',
            'Déposer au bureau de poste si absent > 2h',
          ],
          allowMessages: true,
          allowDoorbell: true,
          presentMessage: 'Je suis là, merci de sonner !',
          absentMessage: 'Je suis absent pour le moment. Suivez les consignes ci-dessous.',
        } satisfies DoorbellContent}
        qrName="QR Portier Entrée"
      />
    ),
  },
  shopping: {
    label: 'Liste de courses',
    icon: <ShoppingBag className="h-8 w-8" />,
    color: '#F59E0B',
    component: (
      <InfoDisplay
        content={{
          title: '🛒 Liste de courses',
          body: `# Liste de courses partagée

Cochez les articles achetés en les scannant.

## Fruits & Légumes
- [ ] Tomates (1 kg)
- [ ] Avocats (x4)
- [ ] Bananes (1 botte)
- [ ] Salade verte

## Produits laitiers
- [ ] Lait demi-écrémé (1L)
- [x] Yaourts nature (x8)
- [ ] Fromage râpé (200g)

## Épicerie
- [x] Pain complet
- [ ] Pâtes penne (500g)
- [ ] Sauce tomate (2 bocaux)
- [ ] Huile d'olive

---

*Dernière mise à jour : aujourd'hui à 14h30*`,
        } satisfies InfoContent}
        qrName="QR Liste de courses"
      />
    ),
  },
  guide: {
    label: 'Manuel Maison',
    icon: <BookOpen className="h-8 w-8" />,
    color: '#8B5CF6',
    component: (
      <InfoDisplay
        content={{
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
        } satisfies InfoContent}
        qrName="QR Guide Maison"
      />
    ),
  },
  urgence: {
    label: 'Urgence',
    icon: <Shield className="h-8 w-8" />,
    color: '#EF4444',
    component: (
      <InfoDisplay
        content={{
          title: '🚨 Contacts d\'urgence',
          body: `# Numéros d'urgence

En cas d'urgence, contactez les services appropriés.

## Services d'urgence
- **SAMU** : 15
- **Pompiers** : 18
- **Police** : 17
- **Urgences européennes** : 112

## Contacts locaux
1. **Médecin** : Dr. Martin — 01 23 45 67 89
2. **Pharmacie de garde** : 01 23 45 67 90
3. **Plombier** : M. Durand — 06 12 34 56 78
4. **Électricien** : M. Bernard — 06 98 76 54 32

## Propriétaire
- **Nom** : M. et Mme Dupont
- **Téléphone** : 06 11 22 33 44

---

> En cas de fuite d'eau, coupez l'arrivée principale sous l'évier de la cuisine.`,
        } satisfies InfoContent}
        qrName="QR Urgence"
      />
    ),
  },
};

/* ------------------------------------------------------------------ */
/*  404 / Unknown module                                               */
/* ------------------------------------------------------------------ */

function UnknownModule({ id }: { id: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
      <div className="text-center px-4">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-200">
          <Shield className="h-8 w-8 text-gray-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Module introuvable</h1>
        <p className="text-muted-foreground mb-6">
          Le module de démo &quot;{id}&quot; n&apos;existe pas.
        </p>
        <Link href="/">
          <Button variant="outline" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour à l&apos;accueil
          </Button>
        </Link>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function DemoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const demo = DEMO_MODULES[id];

  if (!demo) return <UnknownModule id={id} />;

  return demo.component;
}
