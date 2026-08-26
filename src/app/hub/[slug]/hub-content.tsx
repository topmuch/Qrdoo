'use client';

import { use, useState, useEffect, useCallback, type ElementType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, User, Users, XCircle, AlertCircle, Loader2,
  Wifi, Lock, MessageCircle, ChevronRight, QrCode,
  DoorOpen, Shield, Volume2, Mic, ArrowLeft,
  Utensils, Bed, Bath, Sofa, Tv, BookOpen, Car,
  Flower2, Gamepad2, Music, Dumbbell, Briefcase, Heart,
  Package, ShoppingCart, CheckSquare, Clock, ExternalLink,
  Zap, Ticket, Store, Wine, Box,
} from 'lucide-react';
import { QR_MODULE_LABELS } from '@/types/database';
import { MODULE_GRADIENTS } from '@/components/magic/GradientBackground';

// ── Types ──
interface QrCodeInfo {
  id: string;
  name: string;
  type: string;
  publicSlug: string | null;
  isPrivate: boolean;
  content: Record<string, any>;
}

interface RoomInfo {
  id: string;
  name: string;
  icon: string | null;
  qrCodes: QrCodeInfo[];
}

interface HubData {
  home: { id: string; name: string; address: string | null; hasPin: boolean };
  ownerName: string | null;
  guestRooms: RoomInfo[];
  familyRooms: RoomInfo[];
  voiceMessages: Array<{
    id: string;
    senderName: string;
    senderType: string;
    audioUrl: string;
    durationSec: number;
    createdAt: string;
  }>;
}

type HubView = 'mode-select' | 'pin' | 'guest' | 'family';

// ── Room icon mapping ──
const ROOM_ICONS: Record<string, ElementType> = {
  salon: Sofa, cuisine: Utensils, chambre: Bed, 'chambre-principale': Bed,
  'salle-de-bain': Bath, sdb: Bath, bureau: Briefcase, 'chambre-amis': Bed,
  entree: DoorOpen, 'piece-a-vivre': Sofa, jardin: Flower2, garage: Car,
  'salle-de-jeux': Gamepad2, musique: Music, sport: Dumbbell, bibliotheque: BookOpen,
  tv: Tv, sejour: Sofa, 'salle-a-manger': Utensils, couloir: DoorOpen,
  wc: Bath, cave: Wine, grenier: Box, balcon: Flower2, terrasse: Flower2,
};

// Module type → icon
const MODULE_ICONS: Record<string, ElementType> = {
  wifi: Wifi, guestbook: BookOpen, doorbell: Volume2, emergency: AlertCircle,
  note: BookOpen, contact: Users, shopping_list: ShoppingCart, inventory: Package,
  chore: CheckSquare, checklist: CheckSquare, timer: Clock, recipe: Utensils,
  medication: Heart, meal_planner: Utensils, external_link: ExternalLink,
  home_manual: BookOpen, house_rules: Shield, voice_assistant: Mic,
  merchant: Store, flash_sale: Zap, coupon: Ticket,
};

const DEFAULT_GRADIENT = { from: '#059669', via: '#10b981', to: '#34d399' };

function getModuleGradient(type: string) {
  return MODULE_GRADIENTS[type] || DEFAULT_GRADIENT;
}
function getModuleLabel(type: string): string {
  return (QR_MODULE_LABELS as Record<string, string>)[type] || type;
}

// ── Animation variants ──
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// ── Icon render component (avoids "component created during render" lint) ──
function DynamicIcon({ type, iconMap, fallback: Fallback = QrCode, className }: {
  type: string; iconMap: Record<string, ElementType>; fallback?: ElementType; className?: string;
}) {
  const Comp = iconMap[type] || Fallback;
  return <Comp className={className} />;
}

function DynamicRoomIcon({ iconStr, className }: { iconStr: string | null; className?: string }) {
  const Comp = iconStr ? (ROOM_ICONS[iconStr.toLowerCase()] || Home) : Home;
  return <Comp className={className} />;
}

// ── Main Component ──
export function HubPageContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<HubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<HubView>('mode-select');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinVerifying, setPinVerifying] = useState(false);

  const fetchHub = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/hub/${encodeURIComponent(slug)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Hub non trouvé');
      setData(json);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [slug]);

  useEffect(() => { fetchHub(); }, [fetchHub]);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Home className="h-7 w-7 text-white" />
          </div>
          <p className="text-sm text-slate-400">Chargement du Hub...</p>
        </motion.div>
      </div>
    );
  }

  // ── Error ──
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/20">
            <XCircle className="h-8 w-8 text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Hub introuvable</h1>
          <p className="text-sm text-slate-400 mb-6">{error || 'Ce Hub n\'existe pas ou a été désactivé.'}</p>
          <div className="h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center gap-2 text-sm text-slate-300">
            <QrCode className="h-4 w-4" />
            <span className="font-mono text-xs">{slug}</span>
          </div>
        </motion.div>
      </div>
    );
  }

  const rooms = view === 'family' ? data.familyRooms : data.guestRooms;
  const totalGuestModules = data.guestRooms.reduce((sum, r) => sum + r.qrCodes.length, 0);
  const totalFamilyModules = data.familyRooms.reduce((sum, r) => sum + r.qrCodes.length, 0);

  const doVerifyPin = (pinVal: string) => {
    setPinVerifying(true);
    setPinError('');
    fetch(`/api/public/hub/${encodeURIComponent(slug)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pinVal }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) { setPinError(json.error || 'PIN incorrect'); setPin(''); }
        else { setView('family'); }
      })
      .catch(() => { setPinError('Erreur réseau'); setPin(''); })
      .finally(() => setPinVerifying(false));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Top bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/80 border-b border-slate-700/50">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          {view === 'guest' || view === 'family' ? (
            <button onClick={() => { setView('mode-select'); setPin(''); }} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" /> Retour
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <QrCode className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="text-sm font-bold tracking-tight">QR Domotik</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            {view === 'guest' && <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">INVITÉ</span>}
            {view === 'family' && <span className="text-[10px] font-bold bg-violet-500/20 text-violet-300 px-2 py-0.5 rounded-full">FAMILLE</span>}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-lg mx-auto px-4 py-6 pb-24">
        <AnimatePresence mode="wait">
          {/* ─── MODE SELECT ─── */}
          {view === 'mode-select' && (
            <motion.div key="mode-select" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              {/* Home header */}
              <div className="text-center space-y-3">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-2xl shadow-emerald-500/20"
                >
                  <Home className="h-10 w-10 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold">{data.home.name}</h1>
                  {data.ownerName && <p className="text-sm text-slate-400 mt-1">Propriété de <span className="text-emerald-300 font-medium">{data.ownerName}</span></p>}
                </div>
                <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Home className="h-3.5 w-3.5" />{data.guestRooms.length} pièces</span>
                  <span className="flex items-center gap-1"><QrCode className="h-3.5 w-3.5" />{totalGuestModules} modules</span>
                </div>
              </div>

              {/* Mode buttons */}
              <div className="space-y-3">
                <motion.button whileTap={{ scale: 0.98 }} onClick={() => setView('guest')}
                  className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-left shadow-lg shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center"><User className="h-6 w-6 text-white" /></div>
                      <div>
                        <p className="font-bold text-base">Mode Invité</p>
                        <p className="text-xs text-emerald-100/70 mt-0.5">Accès Wi-Fi, infos pratiques, laisser un message vocal</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-white/60" />
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[11px] bg-white/15 rounded-full px-2.5 py-0.5">{totalGuestModules} modules disponibles</span>
                    <span className="text-[11px] bg-white/15 rounded-full px-2.5 py-0.5">Sans code</span>
                  </div>
                </motion.button>

                {data.home.hasPin && (
                  <motion.button whileTap={{ scale: 0.98 }} onClick={() => setView('pin')}
                    className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 p-5 text-left shadow-lg shadow-violet-600/20 hover:from-violet-700 hover:to-purple-700 transition-all">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-white/15 flex items-center justify-center"><Users className="h-6 w-6 text-white" /></div>
                        <div>
                          <p className="font-bold text-base">Mode Famille</p>
                          <p className="text-xs text-violet-100/70 mt-0.5">Accès complet à tous les modules du logement</p>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-white/60" />
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[11px] bg-white/15 rounded-full px-2.5 py-0.5">{totalFamilyModules} modules</span>
                      <span className="text-[11px] bg-white/15 rounded-full px-2.5 py-0.5 flex items-center gap-1"><Lock className="h-3 w-3" />Code PIN requis</span>
                    </div>
                  </motion.button>
                )}
              </div>

              {/* Voice messages preview */}
              {data.voiceMessages.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-400">
                    <MessageCircle className="h-4 w-4" />
                    <span>{data.voiceMessages.length} message{data.voiceMessages.length > 1 ? 's' : ''} vocal{data.voiceMessages.length > 1 ? 'aux' : ''}</span>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {data.voiceMessages.slice(0, 3).map((vm) => (
                      <div key={vm.id} className="flex items-center gap-3 rounded-xl bg-slate-800/60 border border-slate-700/50 px-4 py-3">
                        <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                          <Volume2 className="h-4 w-4 text-emerald-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{vm.senderName}</p>
                          <p className="text-xs text-slate-500">{vm.durationSec}s</p>
                        </div>
                        <span className="text-[11px] text-slate-500">{new Date(vm.createdAt).toLocaleDateString('fr-FR')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ─── PIN MODAL ─── */}
          {view === 'pin' && (
            <motion.div key="pin" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-6">
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/20">
                  <Shield className="h-7 w-7 text-violet-400" />
                </div>
                <h2 className="text-xl font-bold">Code PIN Famille</h2>
                <p className="text-sm text-slate-400">Entrez le code à 4 chiffres</p>
              </div>

              {/* PIN dots */}
              <div className="flex gap-4 justify-center">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`h-14 w-14 rounded-2xl border-2 flex items-center justify-center text-2xl font-bold font-mono transition-all duration-150 ${
                    i < pin.length ? 'border-violet-500 bg-violet-500/15 text-violet-300' : 'border-slate-700 bg-slate-800/50 text-slate-600'
                  }`}>
                    {i < pin.length ? '●' : ''}
                  </div>
                ))}
              </div>

              <AnimatePresence>
                {pinError && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-center text-sm text-red-400 flex items-center justify-center gap-1.5">
                    <XCircle className="h-4 w-4" />{pinError}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto">
                {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key) => {
                  if (key === '') return <div key="empty" />;
                  return (
                    <button key={key} type="button"
                      onClick={() => {
                        if (key === '⌫') { setPin((p) => p.slice(0, -1)); setPinError(''); }
                        else if (pin.length < 4) {
                          const np = pin + key; setPin(np); setPinError('');
                          if (np.length === 4) setTimeout(() => doVerifyPin(np), 200);
                        }
                      }}
                      className="h-14 rounded-2xl bg-slate-800 border border-slate-700 text-white text-xl font-semibold hover:bg-slate-700 active:scale-95 transition-all disabled:opacity-50"
                      disabled={pinVerifying}
                    >
                      {pinVerifying && pin.length === 4 ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : key}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ─── GUEST / FAMILY VIEW ─── */}
          {(view === 'guest' || view === 'family') && (
            <motion.div key={view} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">
              <div>
                <h2 className="text-xl font-bold">{data.home.name}</h2>
                <p className="text-sm text-slate-400 mt-1">
                  {view === 'guest' ? 'Mode Invité' : 'Mode Famille'}
                  {data.home.address && ` · ${data.home.address}`}
                </p>
              </div>

              {/* Quick WiFi card */}
              {rooms.some((r) => r.qrCodes.some((qr) => qr.type === 'wifi')) && <QuickWifiCard rooms={rooms} />}

              {/* Room grid */}
              {rooms.length > 0 ? (
                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
                  {rooms.map((room) => <RoomSection key={room.id} room={room} />)}
                </motion.div>
              ) : (
                <div className="text-center py-12">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800">
                    <QrCode className="h-7 w-7 text-slate-500" />
                  </div>
                  <p className="text-sm text-slate-400">
                    {view === 'guest' ? 'Aucun module public disponible' : 'Aucun module configuré'}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-xl border-t border-slate-800">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-center">
          <p className="text-[11px] text-slate-500">QR Domotik · qrdomotik.roomscan.pro</p>
        </div>
      </footer>
    </div>
  );
}

// ── Quick WiFi Card ──
function QuickWifiCard({ rooms }: { rooms: RoomInfo[] }) {
  const wifiQr = rooms.flatMap((r) => r.qrCodes).find((qr) => qr.type === 'wifi');
  if (!wifiQr?.content) return null;
  const { network_name, password, security_type } = wifiQr.content;

  return (
    <motion.div variants={itemVariants} className="rounded-2xl bg-gradient-to-br from-emerald-600/20 to-teal-600/10 border border-emerald-500/30 p-4">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
          <Wifi className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-emerald-400 font-medium">Wi-Fi</p>
          <p className="text-sm font-bold text-white truncate">{network_name || 'Non configuré'}</p>
          {password && (
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs font-mono text-emerald-200 bg-emerald-900/40 px-2 py-0.5 rounded">{password}</code>
              {security_type && <span className="text-[10px] text-emerald-400/60">{security_type}</span>}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Room Section ──
function RoomSection({ room }: { room: RoomInfo }) {
  return (
    <motion.div variants={itemVariants} className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <DynamicRoomIcon iconStr={room.icon} className="h-4 w-4 text-slate-400" />
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider">{room.name}</h3>
        <span className="text-xs text-slate-600">({room.qrCodes.length})</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {room.qrCodes.map((qr) => <ModuleCard key={qr.id} qr={qr} />)}
      </div>
    </motion.div>
  );
}

// ── Module Card ──
function ModuleCard({ qr }: { qr: QrCodeInfo }) {
  const gradient = getModuleGradient(qr.type);
  const label = getModuleLabel(qr.type);

  return (
    <motion.button
      variants={itemVariants} whileTap={{ scale: 0.97 }}
      onClick={() => { if (qr.publicSlug) window.location.href = `/view/${qr.publicSlug}`; }}
      disabled={!qr.publicSlug}
      className="text-left relative rounded-2xl bg-slate-800/70 border border-slate-700/50 p-4 hover:border-slate-600 transition-all disabled:opacity-60 group"
    >
      <div className="h-10 w-10 rounded-xl flex items-center justify-center mb-3 shadow-sm"
        style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}>
        <DynamicIcon type={qr.type} iconMap={MODULE_ICONS} className="h-5 w-5 text-white" />
      </div>
      <p className="text-sm font-semibold text-white truncate group-hover:text-emerald-300 transition-colors">{qr.name}</p>
      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{label}</p>
      {qr.isPrivate && (
        <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-violet-400">
          <Lock className="h-3 w-3" /> Privé
        </div>
      )}
      {qr.publicSlug && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="h-4 w-4 text-slate-500" />
        </div>
      )}
    </motion.button>
  );
}
