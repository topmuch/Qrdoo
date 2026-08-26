'use client';

import { use, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle, QrCode } from 'lucide-react';

// ─── V3 Immersive Display Components ─────────────────────────────────────
import WifiDisplayV3 from '@/components/modules/v3/WifiDisplayV3';
import DoorbellDisplayV3 from '@/components/modules/v3/DoorbellDisplayV3';
import ShoppingListDisplayV3 from '@/components/modules/v3/ShoppingListDisplayV3';
import NoteDisplayV3 from '@/components/modules/v3/NoteDisplayV3';
import GuestbookDisplayV3 from '@/components/modules/v3/GuestbookDisplayV3';
import MedicationDisplayV3 from '@/components/modules/v3/MedicationDisplayV3';
import MealPlannerDisplayV3 from '@/components/modules/v3/MealPlannerDisplayV3';
import ContactDisplayV3 from '@/components/modules/v3/ContactDisplayV3';
import ChecklistDisplayV3 from '@/components/modules/v3/ChecklistDisplayV3';
import LinkDisplayV3 from '@/components/modules/v3/LinkDisplayV3';
import InfoDisplayV3 from '@/components/modules/v3/InfoDisplayV3';
import { GradientBackground } from '@/components/magic';

// ─── Types ──────────────────────────────────────────────────────────────────

interface QrData {
  qrCode: { id: string; name: string; type: string; publicSlug: string; isActive: boolean; homeName?: string | null };
  content: Record<string, unknown>;
  scanCount: number;
}

type DisplayComponentType = React.ComponentType<{
  content: any;
  qrCodeId?: string;
  qrName?: string;
}>;

// ─── V3 Display Map (immersive pages) ────────────────────────────────────────

const V3_DISPLAY_MAP: Record<string, DisplayComponentType> = {
  // Dedicated immersive displays
  wifi: WifiDisplayV3 as DisplayComponentType,
  doorbell: DoorbellDisplayV3,
  external_link: LinkDisplayV3 as DisplayComponentType,
  note: NoteDisplayV3,
  guestbook: GuestbookDisplayV3,
  medication: MedicationDisplayV3,
  meal_planner: MealPlannerDisplayV3,
  contact: ContactDisplayV3,
  shopping_list: ShoppingListDisplayV3,
  checklist: ChecklistDisplayV3,

  // Info-based modules → InfoDisplayV3 (adapts gradient per moduleType)
  home_manual: InfoDisplayV3 as DisplayComponentType,
  house_rules: InfoDisplayV3 as DisplayComponentType,
  visitor_info: InfoDisplayV3 as DisplayComponentType,
  appliance_manual: InfoDisplayV3 as DisplayComponentType,
  wifi_reset: InfoDisplayV3 as DisplayComponentType,
  first_aid: InfoDisplayV3 as DisplayComponentType,
  emergency_contacts: InfoDisplayV3 as DisplayComponentType,
  home_network: InfoDisplayV3 as DisplayComponentType,
  recycling_info: InfoDisplayV3 as DisplayComponentType,
  utility_shutoff: InfoDisplayV3 as DisplayComponentType,
  garage_instructions: InfoDisplayV3 as DisplayComponentType,
  laundry_guide: InfoDisplayV3 as DisplayComponentType,
  energy_monitor: InfoDisplayV3 as DisplayComponentType,
  key_location: InfoDisplayV3 as DisplayComponentType,
  cleaning_schedule: InfoDisplayV3 as DisplayComponentType,
};

// ─── Page Component ─────────────────────────────────────────────────────────

export function ViewPageContent({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const slug = resolvedParams.slug;
  const [data, setData] = useState<QrData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchQr() {
      try {
        const res = await fetch(`/api/public/qr/${slug}`);
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          setError(errData.error || 'QR code introuvable');
          return;
        }
        const qrData: QrData = await res.json();
        setData(qrData);
      } catch {
        setError('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    }
    fetchQr();
  }, [slug]);

  // ── Loading ──
  if (loading) {
    return (
      <GradientBackground from="#059669" via="#10b981" to="#34d399" animate={false}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            >
              <QrCode className="h-10 w-10 text-white" />
            </motion.div>
            <p className="text-white/70 text-sm">Chargement...</p>
          </div>
        </div>
      </GradientBackground>
    );
  }

  // ── Error ──
  if (error || !data) {
    return (
      <GradientBackground from="#dc2626" via="#ef4444" to="#fca5a5" animate={false}>
        <div className="min-h-screen flex items-center justify-center p-6">
          <div className="max-w-sm w-full text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 150 }}
              className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm"
            >
              <AlertCircle className="h-10 w-10 text-white" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-white mb-2"
            >
              QR code introuvable
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-white/70 text-sm mb-8"
            >
              {error || `Le code ${slug} ne correspond à aucun QR actif.`}
            </motion.p>
            <motion.a
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              href="/"
              className="inline-block bg-white/15 hover:bg-white/25 text-white font-medium py-3 px-8 rounded-2xl backdrop-blur-sm border border-white/20 transition-colors"
            >
              Retour à l'accueil
            </motion.a>
          </div>
        </div>
      </GradientBackground>
    );
  }

  // ── Render V3 Display ──
  const { qrCode, content } = data;
  const DisplayComponent = V3_DISPLAY_MAP[qrCode.type];

  if (DisplayComponent) {
    return (
      <DisplayComponent
        content={content}
        qrCodeId={qrCode.id}
        qrName={qrCode.name}
      />
    );
  }

  // Fallback for unknown module types (still V3 styled)
  return (
    <InfoDisplayV3
      content={content}
      qrCodeId={qrCode.id}
      qrName={qrCode.name}
    />
  );
}
