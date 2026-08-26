'use client';

import { use, useState, useEffect, useCallback, useRef, type ElementType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, User, Users, XCircle, AlertCircle, Loader2,
  Wifi, Lock, MessageCircle, ChevronRight, QrCode,
  Settings, ArrowLeft, Shield, Volume2, Mic, Send,
  Pause, Play, ExternalLink,
  Utensils, Bed, Bath, Sofa, Tv, BookOpen, Car,
  Flower2, Gamepad2, Music, Dumbbell, Briefcase, Heart,
  Package, ShoppingCart, CheckSquare, Clock,
  Zap, Ticket, Store, Wine, Box, DoorOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  AnimatedGradient,
  GlassCard,
  NumericKeypad,
  FloatingParticles,
} from '@/components/magic';
import { QR_MODULE_LABELS } from '@/types/database';
import { MODULE_GRADIENTS } from '@/components/magic/GradientBackground';

// ── Types ──
interface QrCodeInfo {
  id: string;
  name: string;
  type: string;
  publicSlug: string | null;
  isPrivate: boolean;
  content: Record<string, unknown>;
}

interface RoomInfo {
  id: string;
  name: string;
  icon: string | null;
  qrCodes: QrCodeInfo[];
}

interface VoiceMsg {
  id: string;
  senderName: string;
  senderType: string;
  audioUrl: string;
  durationSec: number;
  createdAt: string;
}

interface HubData {
  home: { id: string; name: string; address: string | null; hasPin: boolean };
  ownerName: string | null;
  guestRooms: RoomInfo[];
  familyRooms: RoomInfo[];
  voiceMessages: VoiceMsg[];
}

type HubView = 'mode-select' | 'guest' | 'family';
type PinModalFor = 'family' | 'settings' | null;

// ── Icon mappings ──
const ROOM_ICONS: Record<string, ElementType> = {
  salon: Sofa, cuisine: Utensils, chambre: Bed, 'chambre-principale': Bed,
  'salle-de-bain': Bath, sdb: Bath, bureau: Briefcase, 'chambre-amis': Bed,
  entree: DoorOpen, 'piece-a-vivre': Sofa, jardin: Flower2, garage: Car,
  'salle-de-jeux': Gamepad2, musique: Music, sport: Dumbbell, bibliotheque: BookOpen,
  tv: Tv, sejour: Sofa, 'salle-a-manger': Utensils, couloir: DoorOpen,
  wc: Bath, cave: Wine, grenier: Box, balcon: Flower2, terrasse: Flower2,
};

const MODULE_ICONS: Record<string, ElementType> = {
  wifi: Wifi, guestbook: BookOpen, doorbell: Volume2, emergency: AlertCircle,
  note: BookOpen, contact: Users, shopping_list: ShoppingCart, inventory: Package,
  chore: CheckSquare, checklist: CheckSquare, timer: Clock, recipe: Utensils,
  medication: Heart, meal_planner: Utensils, external_link: ExternalLink,
  home_manual: BookOpen, house_rules: Shield, voice_assistant: Mic,
  merchant: Store, flash_sale: Zap, coupon: Ticket,
};

const DEFAULT_GRADIENT = { from: '#059669', via: '#10b981', to: '#34d399' };

function getModuleGradient(type: string) { return MODULE_GRADIENTS[type] || DEFAULT_GRADIENT; }
function getModuleLabel(type: string) { return (QR_MODULE_LABELS as Record<string, string>)[type] || type; }

const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.06 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

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

// ── Voice Player Component ──
function VoicePlayer({ msg }: { msg: VoiceMsg }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      if (intervalRef.current != null) clearInterval(intervalRef.current);
    } else {
      audioRef.current.play().catch(() => {});
      intervalRef.current = setInterval(() => {
        if (audioRef.current) {
          const pct = audioRef.current.duration ? (audioRef.current.currentTime / audioRef.current.duration) * 100 : 0;
          setProgress(pct);
        }
      }, 200);
    }
    setPlaying(!playing);
  };

  useEffect(() => {
    const onEnded = () => {
      setPlaying(false);
      setProgress(0);
      if (intervalRef.current != null) clearInterval(intervalRef.current);
    };
    const el = audioRef.current;
    el?.addEventListener('ended', onEnded);
    return () => { el?.removeEventListener('ended', onEnded); if (intervalRef.current != null) clearInterval(intervalRef.current); };
  }, []);

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-3">
      <audio ref={audioRef} src={msg.audioUrl} preload="metadata" />
      <button onClick={togglePlay} className="h-9 w-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
        {playing ? <Pause className="h-4 w-4 text-white" /> : <Play className="h-4 w-4 text-white ml-0.5" />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium text-white truncate">{msg.senderName}</p>
          <span className="text-[10px] text-white/40 shrink-0 ml-2">{msg.durationSec}s</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full bg-white/60 transition-all duration-200" style={{ width: `${progress}%` }} />
        </div>
      </div>
      <span className="text-[10px] text-white/30 shrink-0">
        {new Date(msg.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
      </span>
    </div>
  );
}

// ── Voice Recorder Component ──
function VoiceRecorder({ slug, onSent }: { slug: string; onSent: () => void }) {
  const [recording, setRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [senderName, setSenderName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        if (chunksRef.current.length > 0) setShowNameInput(true);
        else toast.error('Enregistrement vide');
      };
      mr.start();
      mediaRecorderRef.current = mr;
      startTimeRef.current = Date.now();
      setDuration(0);
      setRecording(true);
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
        if (elapsed >= 30) stopRecording();
      }, 200);
    } catch {
      toast.error('Accès au micro refusé');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    if (timerRef.current != null) clearInterval(timerRef.current);
    setRecording(false);
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current != null) clearInterval(timerRef.current);
    chunksRef.current = [];
    setRecording(false);
    setDuration(0);
    setShowNameInput(false);
  };

  const handleSend = async () => {
    if (chunksRef.current.length === 0) return;
    setUploading(true);
    try {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      const formData = new FormData();
      formData.append('audio', blob, 'voice.webm');
      formData.append('senderName', senderName.trim() || 'Invité');
      formData.append('durationSec', String(duration));
      const res = await fetch(`/api/public/hub/${encodeURIComponent(slug)}/voice`, { method: 'POST', body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erreur');
      toast.success('Message vocal envoyé !');
      setShowNameInput(false); setDuration(0); setSenderName(''); chunksRef.current = [];
      onSent();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erreur d'envoi";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    return () => { if (timerRef.current != null) clearInterval(timerRef.current); };
  }, []);

  return (
    <div className="space-y-3">
      {recording && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-sm font-semibold text-red-300">Enregistrement en cours</span>
            </div>
            <span className="text-sm font-mono text-red-300">{String(Math.floor(duration / 60)).padStart(2, '0')}:{String(duration % 60).padStart(2, '0')}</span>
          </div>
          <div className="h-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${Math.min((duration / 30) * 100, 100)}%` }} />
          </div>
          <div className="flex gap-2">
            <button onClick={cancelRecording} className="flex-1 h-10 rounded-xl bg-white/10 text-sm text-white/70">Annuler</button>
            <button onClick={stopRecording} className="flex-1 h-10 rounded-xl bg-red-600 text-sm text-white font-semibold">Arrêter</button>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {showNameInput && !recording && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-4 space-y-3">
            <p className="text-sm font-semibold text-white">Votre message ({duration}s)</p>
            <input
              type="text" placeholder="Votre nom (optionnel)" maxLength={50}
              value={senderName} onChange={(e) => setSenderName(e.target.value)}
              className="w-full h-10 rounded-xl bg-white/10 border border-white/20 px-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-all"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={() => { setShowNameInput(false); chunksRef.current = []; }}
                className="flex-1 h-10 rounded-xl bg-white/10 text-sm text-white/70">Annuler</button>
              <button onClick={handleSend} disabled={uploading}
                className="flex-1 h-10 rounded-xl bg-white text-emerald-700 text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {uploading ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!recording && !showNameInput && (
        <motion.button whileTap={{ scale: 0.95 }} onClick={startRecording}
          className="w-full rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-4 flex items-center justify-center gap-3 hover:bg-white/20 transition-all">
          <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
            <Mic className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">Laisser un message vocal</p>
            <p className="text-xs text-white/40">Appuyez pour enregistrer (max 30s)</p>
          </div>
        </motion.button>
      )}
    </div>
  );
}

// ── PIN Modal Component ──
function PinModal({
  title,
 onVerify,
  onCancel,
  verifying,
}: {
  title: string;
  onVerify: (pin: string) => void;
  onCancel: () => void;
  verifying: boolean;
}) {
  const [key, setKey] = useState(0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <GlassCard className="w-full max-w-sm p-8" hover={false}>
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
          </div>

          {verifying ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 text-white/60 animate-spin" />
            </div>
          ) : (
            <NumericKeypad
              key={key}
              length={4}
              onComplete={onVerify}
            />
          )}

          <button
            onClick={() => { setKey((k) => k + 1); onCancel(); }}
            className="mt-6 text-white/50 hover:text-white/80 text-sm w-full text-center transition-colors"
          >
            Annuler
          </button>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
}

// ── Main Component ──
export function HubPageContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [data, setData] = useState<HubData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState<HubView>('mode-select');
  const [pinModalFor, setPinModalFor] = useState<PinModalFor>(null);
  const [pinVerifying, setPinVerifying] = useState(false);
  const [voiceMsgs, setVoiceMsgs] = useState<VoiceMsg[]>([]);

  const fetchHub = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/hub/${encodeURIComponent(slug)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Hub non trouvé');
      setData(json);
      setVoiceMsgs(json.voiceMessages || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const refreshVoice = useCallback(async () => {
    try {
      const res = await fetch(`/api/public/hub/${encodeURIComponent(slug)}/voice?limit=10`);
      if (res.ok) { const json = await res.json(); setVoiceMsgs(json.messages || []); }
    } catch { /* silent */ }
  }, [slug]);

  useEffect(() => { fetchHub(); }, [fetchHub]);
  useEffect(() => { if (view === 'guest') refreshVoice(); }, [view, refreshVoice]);

  // PIN verification
  const doVerifyPin = useCallback((pinVal: string) => {
    setPinVerifying(true);
    fetch(`/api/public/hub/${encodeURIComponent(slug)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pinVal }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) {
          toast.error(j.error || 'PIN incorrect');
          setPinModalFor(null);
        } else {
          setPinModalFor(null);
          if (pinModalFor === 'family') setView('family');
          else if (pinModalFor === 'settings') toast.success('Accès paramètres autorisé');
        }
      })
      .catch(() => { toast.error('Erreur réseau'); setPinModalFor(null); })
      .finally(() => setPinVerifying(false));
  }, [slug, pinModalFor]);

  // Determine gradient preset based on view
  const gradientPreset = view === 'family' ? 'hub-family' : 'hub-guest';

  // ── Loading state ──
  if (loading) {
    return (
      <AnimatedGradient preset="hub-guest">
        <div className="min-h-screen flex items-center justify-center">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center">
              <Home className="h-7 w-7 text-white" />
            </div>
            <p className="text-sm text-white/60">Chargement du Hub...</p>
          </motion.div>
        </div>
      </AnimatedGradient>
    );
  }

  // ── Error state ──
  if (error || !data) {
    return (
      <AnimatedGradient preset="hub-guest">
        <div className="min-h-screen flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-sm p-8 text-center" hover={false}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/20">
              <XCircle className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Hub introuvable</h1>
            <p className="text-sm text-white/50 mb-6">{error || 'Ce Hub n\'existe pas ou a été désactivé.'}</p>
            <div className="h-12 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center gap-2 text-sm text-white/60">
              <QrCode className="h-4 w-4" /><span className="font-mono text-xs">{slug}</span>
            </div>
          </GlassCard>
        </div>
      </AnimatedGradient>
    );
  }

  const rooms = view === 'family' ? data.familyRooms : data.guestRooms;
  const totalGuestModules = data.guestRooms.reduce((s, r) => s + r.qrCodes.length, 0);
  const totalFamilyModules = data.familyRooms.reduce((s, r) => s + r.qrCodes.length, 0);

  return (
    <>
      <AnimatedGradient preset={gradientPreset}>
        <FloatingParticles count={18} color="rgba(255,255,255,0.12)" size={3} duration={24} />

        <div className="min-h-screen flex flex-col relative z-10">
          {/* Header */}
          <header className="w-full px-6 pt-6 pb-2">
            <div className="max-w-lg mx-auto">
              <div className="flex items-center justify-between">
                {view === 'guest' || view === 'family' ? (
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setView('mode-select')}
                    className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" /> Retour
                  </motion.button>
                ) : (
                  <h1 className="text-2xl font-bold text-white">
                    {data.home.name}
                  </h1>
                )}

                <div className="flex items-center gap-2">
                  {view === 'guest' && (
                    <span className="text-[10px] font-bold bg-white/20 text-emerald-200 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      INVITÉ
                    </span>
                  )}
                  {view === 'family' && (
                    <span className="text-[10px] font-bold bg-white/20 text-fuchsia-200 px-2.5 py-1 rounded-full backdrop-blur-sm">
                      FAMILLE
                    </span>
                  )}

                  {view === 'mode-select' && data.home.hasPin && (
                    <motion.button
                      whileTap={{ rotate: 90 }}
                      onClick={() => setPinModalFor('settings')}
                      className="p-3 bg-white/10 backdrop-blur-xl rounded-full border border-white/20"
                    >
                      <Settings className="w-5 h-5 text-white/80" />
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1 flex flex-col px-6 py-6 max-w-lg mx-auto w-full">
            <AnimatePresence mode="wait">

              {/* ══════════ MODE SELECT ══════════ */}
              {view === 'mode-select' && (
                <motion.div
                  key="mode-select"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex-1 flex flex-col gap-6"
                >
                  {/* Home info */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="text-center space-y-2"
                  >
                    {data.ownerName && (
                      <p className="text-sm text-white/50">
                        Propriété de{' '}
                        <span className="text-white/80 font-medium">{data.ownerName}</span>
                      </p>
                    )}
                    <div className="flex items-center justify-center gap-4 text-xs text-white/30">
                      <span className="flex items-center gap-1"><Home className="h-3.5 w-3.5" />{data.guestRooms.length} pièces</span>
                      <span className="flex items-center gap-1"><QrCode className="h-3.5 w-3.5" />{totalGuestModules} modules</span>
                    </div>
                  </motion.div>

                  {/* Two big mode buttons */}
                  <div className="flex-1 flex flex-col gap-6">
                    {/* INVITÉ button */}
                    <motion.button
                      onClick={() => setView('guest')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                      className="relative overflow-hidden bg-gradient-to-r from-emerald-400 to-teal-500 rounded-3xl p-8 shadow-2xl"
                    >
                      <div className="relative z-10 flex items-center gap-4">
                        <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                          <User className="w-8 h-8 text-white" />
                        </div>
                        <div className="text-left">
                          <h2 className="text-2xl font-bold text-white">Mode Invité</h2>
                          <p className="text-white/80 text-sm">Wi-Fi, messages, infos pratiques</p>
                        </div>
                      </div>
                      <div className="mt-3 relative z-10 flex items-center gap-2 pl-20">
                        <span className="text-[11px] bg-white/15 rounded-full px-2.5 py-0.5 backdrop-blur-sm">{totalGuestModules} modules</span>
                        <span className="text-[11px] bg-white/15 rounded-full px-2.5 py-0.5 backdrop-blur-sm">Sans code</span>
                      </div>
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
                    </motion.button>

                    {/* FAMILLE button */}
                    {data.home.hasPin && (
                      <motion.button
                        onClick={() => setPinModalFor('family')}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, type: 'spring' }}
                        className="relative overflow-hidden bg-gradient-to-r from-purple-500 to-fuchsia-600 rounded-3xl p-8 shadow-2xl"
                      >
                        <div className="relative z-10 flex items-center gap-4">
                          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center shrink-0">
                            <Users className="w-8 h-8 text-white" />
                          </div>
                          <div className="text-left">
                            <h2 className="text-2xl font-bold text-white">Mode Famille</h2>
                            <p className="text-white/80 text-sm">Accès complet à votre maison</p>
                          </div>
                        </div>
                        <div className="mt-3 relative z-10 flex items-center gap-2 pl-20">
                          <span className="text-[11px] bg-white/15 rounded-full px-2.5 py-0.5 backdrop-blur-sm">{totalFamilyModules} modules</span>
                          <span className="text-[11px] bg-white/15 rounded-full px-2.5 py-0.5 backdrop-blur-sm flex items-center gap-1">
                            <Lock className="h-3 w-3" />PIN requis
                          </span>
                        </div>
                        <div className="absolute top-4 right-4 relative z-10">
                          <Lock className="w-5 h-5 text-white/60" />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
                      </motion.button>
                    )}
                  </div>

                  {/* Recent voice messages preview */}
                  {voiceMsgs.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="space-y-2"
                    >
                      <div className="flex items-center gap-2 text-sm text-white/50">
                        <MessageCircle className="h-4 w-4" />
                        <span>{voiceMsgs.length} message{voiceMsgs.length > 1 ? 's' : ''} vocal{voiceMsgs.length > 1 ? 'aux' : ''}</span>
                      </div>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {voiceMsgs.slice(0, 3).map((vm) => (
                          <div key={vm.id} className="flex items-center gap-3 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 px-4 py-3">
                            <div className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                              <Volume2 className="h-4 w-4 text-white/70" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">{vm.senderName}</p>
                              <p className="text-xs text-white/30">{vm.durationSec}s</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {/* ══════════ GUEST VIEW ══════════ */}
              {view === 'guest' && (
                <motion.div
                  key="guest"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6 pb-4"
                >
                  <div>
                    <h2 className="text-xl font-bold text-white">{data.home.name}</h2>
                    <p className="text-sm text-white/50 mt-1">Mode Invité{data.home.address && ` · ${data.home.address}`}</p>
                  </div>

                  {/* WiFi quick card */}
                  {rooms.some((r) => r.qrCodes.some((qr) => qr.type === 'wifi')) && <QuickWifiCard rooms={rooms} />}

                  {/* Voice section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white/70">
                      <MessageCircle className="h-4 w-4" /> Messages vocaux
                    </div>
                    <VoiceRecorder slug={slug} onSent={refreshVoice} />
                    {voiceMsgs.length > 0 && (
                      <div className="space-y-2 max-h-60 overflow-y-auto">{voiceMsgs.map((vm) => <VoicePlayer key={vm.id} msg={vm} />)}</div>
                    )}
                  </div>

                  {/* Room grid */}
                  {rooms.length > 0 ? (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
                      {rooms.map((room) => <RoomSection key={room.id} room={room} />)}
                    </motion.div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 border border-white/20">
                        <QrCode className="h-7 w-7 text-white/40" />
                      </div>
                      <p className="text-sm text-white/50">Aucun module public disponible</p>
                    </div>
                  )}
                </motion.div>
              )}

              {/* ══════════ FAMILY VIEW ══════════ */}
              {view === 'family' && (
                <motion.div
                  key="family"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6 pb-4"
                >
                  <div>
                    <h2 className="text-xl font-bold text-white">{data.home.name}</h2>
                    <p className="text-sm text-white/50 mt-1">Mode Famille{data.home.address && ` · ${data.home.address}`}</p>
                  </div>

                  {/* Room grid */}
                  {rooms.length > 0 ? (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-5">
                      {rooms.map((room) => <RoomSection key={room.id} room={room} />)}
                    </motion.div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 border border-white/20">
                        <QrCode className="h-7 w-7 text-white/40" />
                      </div>
                      <p className="text-sm text-white/50">Aucun module configuré</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Footer */}
          <div className="px-6 py-6 text-center">
            <p className="text-xs text-white/30">
              Propulsé par QR Domotik 🏠
            </p>
          </div>
        </div>
      </AnimatedGradient>

      {/* ══════════ PIN MODAL ══════════ */}
      <AnimatePresence>
        {pinModalFor && (
          <PinModal
            title={pinModalFor === 'family' ? 'Entrez votre code PIN' : 'Accès Paramètres'}
            onVerify={doVerifyPin}
            onCancel={() => setPinModalFor(null)}
            verifying={pinVerifying}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ── Quick WiFi Card ──
function QuickWifiCard({ rooms }: { rooms: RoomInfo[] }) {
  const wifiQr = rooms.flatMap((r) => r.qrCodes).find((qr) => qr.type === 'wifi');
  if (!wifiQr?.content) return null;
  const { network_name, password, security_type } = wifiQr.content as Record<string, string>;
  return (
    <motion.div variants={itemVariants} className="rounded-2xl bg-white/10 backdrop-blur-xl border border-emerald-400/30 p-4">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
          <Wifi className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-emerald-300 font-medium">Wi-Fi</p>
          <p className="text-sm font-bold text-white truncate">{network_name || 'Non configuré'}</p>
          {password && (
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs font-mono text-emerald-200 bg-white/10 px-2 py-0.5 rounded">{password}</code>
              {security_type && <span className="text-[10px] text-white/30">{security_type}</span>}
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
        <DynamicRoomIcon iconStr={room.icon} className="h-4 w-4 text-white/50" />
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wider">{room.name}</h3>
        <span className="text-xs text-white/20">({room.qrCodes.length})</span>
      </div>
      <div className="grid grid-cols-2 gap-3">{room.qrCodes.map((qr) => <ModuleCard key={qr.id} qr={qr} />)}</div>
    </motion.div>
  );
}

// ── Module Card ──
function ModuleCard({ qr }: { qr: QrCodeInfo }) {
  const gradient = getModuleGradient(qr.type);
  const label = getModuleLabel(qr.type);
  return (
    <motion.button
      variants={itemVariants}
      whileTap={{ scale: 0.97 }}
      onClick={() => { if (qr.publicSlug) window.location.href = `/view/${qr.publicSlug}`; }}
      disabled={!qr.publicSlug}
      className="text-left relative rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 p-4 hover:bg-white/20 transition-all disabled:opacity-60 group"
    >
      <div
        className="h-10 w-10 rounded-xl flex items-center justify-center mb-3 shadow-sm"
        style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
      >
        <DynamicIcon type={qr.type} iconMap={MODULE_ICONS} className="h-5 w-5 text-white" />
      </div>
      <p className="text-sm font-semibold text-white truncate">{qr.name}</p>
      <p className="text-[11px] text-white/30 mt-0.5 truncate">{label}</p>
      {qr.isPrivate && (
        <div className="mt-2 inline-flex items-center gap-1 text-[10px] text-fuchsia-300">
          <Lock className="h-3 w-3" /> Privé
        </div>
      )}
      {qr.publicSlug && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="h-4 w-4 text-white/40" />
        </div>
      )}
    </motion.button>
  );
}
