'use client';

import { use, useState, useEffect } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScanPageWrapper } from '@/components/modules/scan-page-wrapper';

// Dedicated display components (existing)
import { WifiDisplay } from '@/components/modules/wifi/WifiDisplay';
import { LinkDisplay } from '@/components/modules/link/LinkDisplay';
import { InfoDisplay } from '@/components/modules/info/InfoDisplay';
import { DoorbellDisplay } from '@/components/modules/doorbell/DoorbellDisplay';

// V1 display components (new)
import { NoteDisplay } from '@/components/modules/display/NoteDisplay';
import { MealPlannerDisplay } from '@/components/modules/display/MealPlannerDisplay';
import { ContactDisplay } from '@/components/modules/display/ContactDisplay';
import { MedicationDisplay } from '@/components/modules/display/MedicationDisplay';
import { EnergyMonitorDisplay } from '@/components/modules/display/EnergyMonitorDisplay';
import { KeyLocationDisplay } from '@/components/modules/display/KeyLocationDisplay';
import { CleaningScheduleDisplay } from '@/components/modules/display/CleaningScheduleDisplay';
import { GuestbookDisplay } from '@/components/modules/display/GuestbookDisplay';
import { ShoppingListDisplay } from '@/components/modules/display/ShoppingListDisplay';
import { ChecklistDisplay } from '@/components/modules/display/ChecklistDisplay';
import { GenericDisplay } from '@/components/modules/display/GenericDisplay';

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

const DISPLAY_MAP: Record<string, DisplayComponentType> = {
  // V1 core (dedicated displays)
  wifi: WifiDisplay as DisplayComponentType,
  external_link: LinkDisplay as DisplayComponentType,
  doorbell: DoorbellDisplay,
  // V1 core (info-based)
  home_manual: InfoDisplay as DisplayComponentType,
  house_rules: InfoDisplay as DisplayComponentType,
  visitor_info: InfoDisplay as DisplayComponentType,
  // V1 extended (new displays)
  note: NoteDisplay,
  meal_planner: MealPlannerDisplay,
  contact: ContactDisplay,
  medication: MedicationDisplay,
  energy_monitor: EnergyMonitorDisplay,
  key_location: KeyLocationDisplay,
  cleaning_schedule: CleaningScheduleDisplay,
  guestbook: GuestbookDisplay,
  shopping_list: ShoppingListDisplay,
  checklist: ChecklistDisplay,
  // V2 info-based (reuse InfoDisplay)
  appliance_manual: InfoDisplay as DisplayComponentType,
  wifi_reset: InfoDisplay as DisplayComponentType,
  first_aid: InfoDisplay as DisplayComponentType,
  emergency_contacts: InfoDisplay as DisplayComponentType,
  home_network: InfoDisplay as DisplayComponentType,
  recycling_info: InfoDisplay as DisplayComponentType,
  utility_shutoff: InfoDisplay as DisplayComponentType,
  garage_instructions: InfoDisplay as DisplayComponentType,
  laundry_guide: InfoDisplay as DisplayComponentType,
  // V2 generic (use GenericDisplay)
  inventory: GenericDisplay,
  chore: GenericDisplay,
  timer: GenericDisplay,
  recipe: GenericDisplay,
  pet_info: GenericDisplay,
  plant_care: GenericDisplay,
  delivery: GenericDisplay,
  baby_sitter: GenericDisplay,
  pet_sitter: GenericDisplay,
  rental_guest: GenericDisplay,
  airbnb_guest: GenericDisplay,
  shared_calendar: GenericDisplay,
  package_tracking: GenericDisplay,
  entertainment: GenericDisplay,
  music_room: GenericDisplay,
  game_room: GenericDisplay,
  library: GenericDisplay,
  photo_gallery: GenericDisplay,
  family_board: GenericDisplay,
  announcement: GenericDisplay,
  mood_tracker: GenericDisplay,
  habit_tracker: GenericDisplay,
  weather_station: GenericDisplay,
  smart_home_control: GenericDisplay,
  voice_assistant: GenericDisplay,
  // V3
  merchant: GenericDisplay,
  service_request: GenericDisplay,
  promo: GenericDisplay,
  flash_sale: GenericDisplay,
  coupon: GenericDisplay,
  emergency_service: GenericDisplay,
  artisan_directory: GenericDisplay,
};


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

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-bold mb-2">QR code introuvable</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {error || `Le code ${slug} ne correspond à aucun QR actif.`}
          </p>
          <Button variant="outline" onClick={() => { window.location.href = '/'; }}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  // Render the appropriate display component wrapped in ScanPageWrapper
  const { qrCode, content, scanCount, homeName } = data;
  const DisplayComponent = DISPLAY_MAP[qrCode.type] || GenericDisplay;

  return (
    <ScanPageWrapper homeName={homeName} scanCount={scanCount}>
      <DisplayComponent
        content={content}
        qrCodeId={qrCode.id}
        qrName={qrCode.name}
      />
    </ScanPageWrapper>
  );
}
