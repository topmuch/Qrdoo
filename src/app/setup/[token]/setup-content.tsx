'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode, CheckCircle2, XCircle, AlertCircle, Loader2,
  ArrowRight, ArrowLeft, Home, Lock, Mail, User,
  Shield, Wifi, Users, Building2, Phone, Eye, EyeOff,
  Fingerprint, Settings, Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  AnimatedGradient,
  GlassCard,
  NumericKeypad,
  FloatingParticles,
  SuccessAnimation,
} from '@/components/magic';

// ── Types ──
type TokenStatus = 'loading' | 'available' | 'claimed' | 'not_found' | 'error';
type SetupStep = 'welcome' | 'account' | 'pin' | 'config' | 'success';

interface PlaqueInfo {
  id: string;
  activationCode: string;
  batchId: string;
  quantity: number;
}

// ── Plans ──
const PLANS = [
  {
    id: 'famille' as const,
    name: 'Famille',
    price: '49€',
    period: '/an',
    icon: Home,
    gradient: 'from-emerald-400 to-teal-500',
  },
  {
    id: 'airbnb_solo' as const,
    name: 'Airbnb Solo',
    price: '9,90€',
    period: '/mois',
    icon: Building2,
    gradient: 'from-violet-400 to-purple-500',
    popular: true,
  },
  {
    id: 'airbnb_pro' as const,
    name: 'Airbnb Pro',
    price: '199€',
    period: '/an',
    badge: 'Économisez 19€',
    icon: Building2,
    gradient: 'from-amber-400 to-orange-500',
  },
];

// ── Slide variants ──
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

// ── Glass input class ──
const glassInput =
  'w-full bg-white/10 border border-white/20 rounded-2xl p-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all';

const glassButton =
  'w-full relative overflow-hidden bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-4 text-white font-semibold hover:bg-white/20 transition-all';

// ── Component ──
export function SetupPageContent({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const { data: session } = useSession();
  const router = useRouter();

  // Token state
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>('loading');
  const [plaqueInfo, setPlaqueInfo] = useState<PlaqueInfo | null>(null);
  const [claimedInfo, setClaimedInfo] = useState<{ hubSlug?: string; homeName?: string }>({});

  // Step navigation
  const [step, setStep] = useState<SetupStep>('welcome');
  const [direction, setDirection] = useState(1);

  // Account
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // PIN
  const [pinKey, setPinKey] = useState(0);
  const [pinValue, setPinValue] = useState('');

  // Config
  const [selectedPlan, setSelectedPlan] = useState<string>('famille');
  const [homeName, setHomeName] = useState('');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPassword, setWifiPassword] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Submission
  const [submitting, setSubmitting] = useState(false);
  const [hubSlug, setHubSlug] = useState('');

  // ── Check token on mount ──
  const checkToken = useCallback(async () => {
    try {
      const res = await fetch(`/api/setup/${encodeURIComponent(token)}`);
      const data = await res.json();
      if (data.status === 'available') {
        setTokenStatus('available');
        setPlaqueInfo(data.plaque);
      } else if (data.status === 'claimed') {
        setTokenStatus('claimed');
        setClaimedInfo({ hubSlug: data.hubSlug, homeName: data.homeName });
      } else {
        setTokenStatus('not_found');
      }
    } catch {
      setTokenStatus('error');
    }
  }, [token]);

  useEffect(() => { checkToken(); }, [checkToken]);

  // Pre-fill if logged in
  useEffect(() => {
    if (session?.user) {
      const u = session.user as Record<string, unknown>;
      setEmail((u?.email as string) || '');
      setFullName((u?.name as string) || '');
    }
  }, [session]);

  // ── Step navigation ──
  const stepOrder: SetupStep[] = ['welcome', 'account', 'pin', 'config', 'success'];

  const goNext = () => {
    setDirection(1);
    const idx = stepOrder.indexOf(step);
    if (idx < stepOrder.length - 1) setStep(stepOrder[idx + 1]);
  };

  const goBack = () => {
    setDirection(-1);
    const idx = stepOrder.indexOf(step);
    if (idx > 0) setStep(stepOrder[idx - 1]);
  };

  // ── Validate & navigate ──
  const handleWelcomeNext = () => goNext();

  const handleAccountNext = () => {
    if (!fullName.trim()) { toast.error('Entrez votre nom'); return; }
    if (!email.trim() || !email.includes('@')) { toast.error('Email invalide'); return; }
    if (!session?.user && (!password || password.length < 6)) {
      toast.error('Mot de passe requis (6+ caractères)'); return;
    }
    goNext();
  };

  const handlePinComplete = (enteredPin: string) => {
    setPinValue(enteredPin);
    // Auto-advance after a brief delay to show the filled dots
    setTimeout(() => goNext(), 400);
  };

  const handleConfigSubmit = async () => {
    if (!homeName.trim()) { toast.error('Nommez votre logement'); return; }
    if (!PLANS.find((p) => p.id === selectedPlan)) { toast.error('Choisissez un plan'); return; }

    setSubmitting(true);
    try {
      const body: Record<string, string> = {
        email: email.trim(),
        fullName: fullName.trim(),
        pin: pinValue,
        homeName: homeName.trim(),
        plan: selectedPlan,
      };

      if (!session?.user) {
        body.password = password;
      } else {
        body.existingUserId = (session.user as Record<string, unknown>)?.id as string;
      }

      const res = await fetch(`/api/setup/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Erreur lors de la configuration');

      setHubSlug(data.hubSlug || '');
      setDirection(1);
      setStep('success');

      // Auto-redirect after delay
      if (data.isNewUser) {
        setTimeout(async () => {
          try {
            const loginRes = await fetch('/api/auth/callback/credentials', {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                email: email.trim(),
                password,
                callbackUrl: '/',
              }).toString(),
            });
            if (loginRes.ok) window.location.href = '/';
          } catch { /* stay on success page */ }
        }, 3000);
      } else {
        setTimeout(() => {
          window.location.href = data.hubSlug ? `/hub/${data.hubSlug}` : '/';
        }, 3000);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erreur';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Progress ──
  const currentIdx = stepOrder.indexOf(step);

  // ── Loading state ──
  if (tokenStatus === 'loading') {
    return (
      <AnimatedGradient preset="setup">
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="relative">
              <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center">
                <QrCode className="h-8 w-8 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-400 border-2 border-violet-800 flex items-center justify-center">
                <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
              </div>
            </div>
            <p className="text-white/70 font-medium">Vérification de votre plaque...</p>
            <p className="text-xs text-white/30 font-mono">{token}</p>
          </motion.div>
        </div>
      </AnimatedGradient>
    );
  }

  // ── Error states ──
  if (tokenStatus === 'not_found' || tokenStatus === 'error') {
    const Icon = tokenStatus === 'error' ? AlertCircle : XCircle;
    const msg = tokenStatus === 'not_found'
      ? { title: 'Plaque non trouvée', desc: "Ce code d'activation n'existe pas. Vérifiez votre plaque et réessayez." }
      : { title: 'Erreur', desc: 'Impossible de vérifier la plaque. Réessayez.' };
    return (
      <AnimatedGradient preset="setup">
        <div className="min-h-screen flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-sm p-8 text-center" hover={false}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <Icon className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">{msg.title}</h1>
            <p className="text-xs text-white/40 font-mono mb-1">{token}</p>
            <p className="text-sm text-white/60 mb-6">{msg.desc}</p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => { setTokenStatus('loading'); checkToken(); }}
              className="w-full h-11 rounded-2xl bg-white/10 border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-all"
            >
              Réessayer
            </motion.button>
          </GlassCard>
        </div>
      </AnimatedGradient>
    );
  }

  // ── Already claimed ──
  if (tokenStatus === 'claimed') {
    return (
      <AnimatedGradient preset="setup">
        <div className="min-h-screen flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-sm p-8 text-center" hover={false}>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Plaque déjà configurée</h1>
            {claimedInfo.homeName && (
              <p className="text-sm text-white/60 mb-1">
                Logement : <span className="text-white/90 font-semibold">{claimedInfo.homeName}</span>
              </p>
            )}
            <p className="text-sm text-white/50 mb-6">Cette plaque est déjà liée à un compte.</p>
            {claimedInfo.hubSlug && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push(`/hub/${claimedInfo.hubSlug}`)}
                className="w-full h-12 rounded-2xl bg-white text-violet-700 font-bold text-sm shadow-xl"
              >
                Accéder au Hub
              </motion.button>
            )}
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => router.push('/')}
              className="w-full h-11 mt-3 rounded-2xl bg-white/10 border border-white/20 text-white/70 text-sm font-medium hover:bg-white/20 transition-all"
            >
              Aller à l'accueil
            </motion.button>
          </GlassCard>
        </div>
      </AnimatedGradient>
    );
  }

  // ── Main multi-step wizard ──
  return (
    <AnimatedGradient preset="setup">
      <FloatingParticles count={20} color="rgba(255,255,255,0.15)" size={3} duration={22} />

      <div className="min-h-screen flex flex-col">
        {/* Header with progress */}
        <div className="w-full px-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-2">
          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur-xl border border-white/30 flex items-center justify-center">
                  <QrCode className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-bold text-white tracking-tight">QR Domotik</span>
              </div>
              <span className="text-xs text-white/50">
                {step === 'success' ? '' : `Étape ${currentIdx + 1} / 4`}
              </span>
            </div>
            {/* Progress bar */}
            {step !== 'success' && (
              <div className="h-1 rounded-full bg-white/10 overflow-hidden">
                <motion.div
                  className="h-full rounded-full bg-white/60"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentIdx / 4) * 100}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Step content */}
        <div className="flex-1 flex items-center justify-center px-6 py-6">
          <div className="w-full max-w-md relative overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>

              {/* ═══════════════════ STEP 1: WELCOME ═══════════════════ */}
              {step === 'welcome' && (
                <motion.div
                  key="welcome"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className="space-y-8 text-center"
                >
                  {/* Animated icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', duration: 0.8 }}
                    className="mx-auto w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-xl border border-white/30"
                  >
                    <Home className="w-12 h-12 text-white" />
                  </motion.div>

                  <div className="space-y-3">
                    <motion.h1
                      initial={fadeUp.initial} animate={fadeUp.animate}
                      transition={{ delay: 0.2 }}
                      className="text-3xl font-bold text-white"
                    >
                      Bienvenue ! 🎉
                    </motion.h1>
                    <motion.p
                      initial={fadeUp.initial} animate={fadeUp.animate}
                      transition={{ delay: 0.3 }}
                      className="text-white/70 text-sm leading-relaxed"
                    >
                      Votre QR Domotik Hub est prêt à être configuré.<br />
                      Cela ne prend que 2 minutes.
                    </motion.p>
                  </div>

                  {/* Feature pills */}
                  <motion.div
                    initial={fadeUp.initial} animate={fadeUp.animate}
                    transition={{ delay: 0.4 }}
                    className="flex justify-center gap-3 flex-wrap"
                  >
                    {[
                      { icon: Wifi, label: 'Wi-Fi', color: 'bg-emerald-400/20 text-emerald-300 border-emerald-400/30' },
                      { icon: Shield, label: 'Sécurité', color: 'bg-amber-400/20 text-amber-300 border-amber-400/30' },
                      { icon: Users, label: 'Famille', color: 'bg-violet-400/20 text-violet-300 border-violet-400/30' },
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className={`flex items-center gap-2 rounded-full px-4 py-2 border backdrop-blur-sm ${item.color}`}
                      >
                        <item.icon className="h-4 w-4" />
                        <span className="text-xs font-medium">{item.label}</span>
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Plaque badge */}
                  {plaqueInfo && (
                    <motion.div
                      initial={fadeUp.initial} animate={fadeUp.animate}
                      transition={{ delay: 0.6 }}
                      className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-2 mx-auto"
                    >
                      <QrCode className="h-3.5 w-3.5 text-white/50" />
                      <span className="text-xs font-mono text-white/60">{plaqueInfo.activationCode}</span>
                    </motion.div>
                  )}

                  {/* CTA */}
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleWelcomeNext}
                    className="w-full h-14 rounded-2xl bg-white text-violet-700 font-bold text-sm shadow-xl shadow-black/10 flex items-center justify-center gap-2 relative overflow-hidden group"
                  >
                    <span className="relative z-10">Commencer la configuration</span>
                    <ArrowRight className="w-4 h-4 relative z-10" />
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                  </motion.button>
                </motion.div>
              )}

              {/* ═══════════════════ STEP 2: ACCOUNT ═══════════════════ */}
              {step === 'account' && (
                <motion.div
                  key="account"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: 'spring' }}
                      className="mx-auto mb-4 w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/30"
                    >
                      <User className="w-7 h-7 text-white" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-white">Créez votre compte</h2>
                    <p className="text-white/60 text-sm mt-1">
                      {session?.user ? 'Connecté en tant que' : 'Informations de connexion'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Google button (if not logged in) */}
                    {!session?.user && (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className={glassButton}
                      >
                        <div className="flex items-center justify-center gap-3">
                          <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                          <span className="text-white/90 text-sm font-medium">Continuer avec Google</span>
                        </div>
                      </motion.button>
                    )}

                    {/* Divider */}
                    {!session?.user && (
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-xs text-white/30">ou</span>
                        <div className="flex-1 h-px bg-white/10" />
                      </div>
                    )}

                    {/* Full name */}
                    <motion.div initial={fadeUp.initial} animate={fadeUp.animate} transition={{ delay: 0.2 }}>
                      <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
                        Nom complet
                      </label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <input
                          type="text"
                          placeholder="Jean Dupont"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className={`${glassInput} pl-11`}
                        />
                      </div>
                    </motion.div>

                    {/* Email */}
                    <motion.div initial={fadeUp.initial} animate={fadeUp.animate} transition={{ delay: 0.25 }}>
                      <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                        <input
                          type="email"
                          placeholder="jean@exemple.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={!!session?.user}
                          className={`${glassInput} pl-11 disabled:opacity-50`}
                        />
                      </div>
                    </motion.div>

                    {/* Password */}
                    {!session?.user && (
                      <motion.div initial={fadeUp.initial} animate={fadeUp.animate} transition={{ delay: 0.3 }}>
                        <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
                          Mot de passe
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="6 caractères minimum"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className={`${glassInput} pl-11 pr-11`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* Navigation */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="flex gap-3"
                  >
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={goBack}
                      className="h-12 px-5 rounded-2xl bg-white/10 border border-white/20 text-white/70 text-sm font-medium hover:bg-white/20 transition-all flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleAccountNext}
                      className="flex-1 h-12 rounded-2xl bg-white text-violet-700 font-bold text-sm shadow-xl shadow-black/10 flex items-center justify-center gap-2 relative overflow-hidden group"
                    >
                      <span className="relative z-10">Continuer</span>
                      <ArrowRight className="w-4 h-4 relative z-10" />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}

              {/* ═══════════════════ STEP 3: PIN ═══════════════════ */}
              {step === 'pin' && (
                <motion.div
                  key={`pin-${pinKey}`}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className="space-y-6"
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: 'spring' }}
                      className="mx-auto mb-4 w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/30"
                    >
                      <Fingerprint className="w-7 h-7 text-white" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-white">Créez votre code secret</h2>
                    <p className="text-white/60 text-sm mt-1">
                      Ce code à 4 chiffres protégera l&rsquo;accès à votre espace Famille
                    </p>
                  </div>

                  {/* Numeric keypad */}
                  <NumericKeypad
                    key={pinKey}
                    length={4}
                    onComplete={handlePinComplete}
                    onChange={(p) => setPinValue(p)}
                  />

                  {/* Back button */}
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={goBack}
                    className="mx-auto h-10 px-6 rounded-2xl bg-white/10 border border-white/20 text-white/60 text-sm font-medium hover:bg-white/20 transition-all flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Retour
                  </motion.button>
                </motion.div>
              )}

              {/* ═══════════════════ STEP 4: CONFIG ═══════════════════ */}
              {step === 'config' && (
                <motion.div
                  key="config"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className="space-y-5"
                >
                  <div className="text-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: 'spring' }}
                      className="mx-auto mb-4 w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-xl border border-white/30"
                    >
                      <Settings className="w-7 h-7 text-white" />
                    </motion.div>
                    <h2 className="text-2xl font-bold text-white">Configuration rapide</h2>
                    <p className="text-white/60 text-sm mt-1">
                      {selectedPlan === 'famille'
                        ? 'Configurez le Wi-Fi pour votre famille'
                        : 'Paramétrez votre logement Airbnb'}
                    </p>
                  </div>

                  {/* Plan selector */}
                  <motion.div initial={fadeUp.initial} animate={fadeUp.animate} transition={{ delay: 0.15 }}>
                    <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-2 block">
                      Votre offre
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {PLANS.map((plan) => {
                        const isSelected = selectedPlan === plan.id;
                        return (
                          <motion.button
                            key={plan.id}
                            type="button"
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedPlan(plan.id)}
                            className={`relative rounded-2xl border-2 p-2.5 text-center transition-all ${
                              isSelected
                                ? 'bg-white/20 border-white/50'
                                : 'bg-white/5 border-white/10 hover:bg-white/10'
                            }`}
                          >
                            <div className={`mx-auto w-7 h-7 rounded-lg bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-1`}>
                              <plan.icon className="w-3.5 h-3.5 text-white" />
                            </div>
                            <p className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-white/60'}`}>
                              {plan.name}
                            </p>
                            <p className="text-[10px] text-white/40 mt-0.5">
                              {plan.price}{plan.period}
                            </p>
                            {'popular' in plan && plan.popular && (
                              <span className="absolute -top-1.5 -right-1.5 text-[8px] font-bold bg-white text-violet-700 px-1.5 py-0.5 rounded-full">
                                TOP
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Home name (always) */}
                  <motion.div initial={fadeUp.initial} animate={fadeUp.animate} transition={{ delay: 0.2 }}>
                    <label className="text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5 block">
                      Nom du logement
                    </label>
                    <div className="relative">
                      <Home className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                      <input
                        type="text"
                        placeholder="ex: Maison Dupont, Appart Paris 15..."
                        value={homeName}
                        onChange={(e) => setHomeName(e.target.value)}
                        className={`${glassInput} pl-11`}
                      />
                    </div>
                  </motion.div>

                  {/* Adaptive fields */}
                  {selectedPlan === 'famille' ? (
                    <GlassCard className="p-4 space-y-4" hover={false}>
                      <div className="flex items-center gap-2 mb-1">
                        <Wifi className="w-4 h-4 text-emerald-400" />
                        <span className="text-sm font-semibold text-white">Wi-Fi</span>
                      </div>
                      <div>
                        <label className="text-xs text-white/50 mb-1 block">SSID (nom du réseau)</label>
                        <input
                          type="text"
                          placeholder="MonWiFi"
                          value={wifiSsid}
                          onChange={(e) => setWifiSsid(e.target.value)}
                          className={glassInput}
                        />
                      </div>
                      <div>
                        <label className="text-xs text-white/50 mb-1 block">Mot de passe Wi-Fi</label>
                        <div className="relative">
                          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                          <input
                            type="text"
                            placeholder="Mot de passe Wi-Fi"
                            value={wifiPassword}
                            onChange={(e) => setWifiPassword(e.target.value)}
                            className={`${glassInput} pl-11`}
                          />
                        </div>
                      </div>
                    </GlassCard>
                  ) : (
                    <GlassCard className="p-4 space-y-4" hover={false}>
                      <div className="flex items-center gap-2 mb-1">
                        <Phone className="w-4 h-4 text-amber-400" />
                        <span className="text-sm font-semibold text-white">Contact d'urgence</span>
                      </div>
                      <div>
                        <label className="text-xs text-white/50 mb-1 block">Numéro d'urgence</label>
                        <div className="relative">
                          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                          <input
                            type="tel"
                            placeholder="+33 6 12 34 56 78"
                            value={emergencyPhone}
                            onChange={(e) => setEmergencyPhone(e.target.value)}
                            className={`${glassInput} pl-11`}
                          />
                        </div>
                      </div>
                    </GlassCard>
                  )}

                  {/* Summary */}
                  <GlassCard className="p-4 space-y-2" hover={false}>
                    <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Récapitulatif</p>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Compte</span>
                      <span className="text-white/90 font-medium truncate ml-3 max-w-[180px]">{fullName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Plan</span>
                      <span className="text-white/90 font-medium capitalize">{selectedPlan.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">PIN</span>
                      <span className="text-white/90 font-mono font-medium">
                        {pinValue ? '●●●●' : 'Non défini'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-white/50">Logement</span>
                      <span className={homeName.trim() ? 'text-white/90 font-medium' : 'text-white/30 italic'}>
                        {homeName.trim() || 'Non défini'}
                      </span>
                    </div>
                  </GlassCard>

                  {/* Navigation */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex gap-3"
                  >
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={goBack}
                      className="h-12 px-5 rounded-2xl bg-white/10 border border-white/20 text-white/70 text-sm font-medium hover:bg-white/20 transition-all flex items-center gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleConfigSubmit}
                      disabled={!homeName.trim() || submitting}
                      className="flex-1 h-12 rounded-2xl bg-white text-violet-700 font-bold text-sm shadow-xl shadow-black/10 flex items-center justify-center gap-2 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="relative z-10">Configuration...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 relative z-10" />
                          <span className="relative z-10">Configurer maintenant</span>
                        </>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}

              {/* ═══════════════════ STEP 5: SUCCESS ═══════════════════ */}
              {step === 'success' && (
                <motion.div
                  key="success"
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                  className="text-center space-y-6"
                >
                  <SuccessAnimation
                    show
                    size={100}
                    label={undefined}
                    confettiColors={['#fbbf24', '#34d399', '#a78bfa', '#f472b6', '#60a5fa']}
                  />

                  <motion.div initial={fadeUp.initial} animate={fadeUp.animate} transition={{ delay: 0.5 }}>
                    <h2 className="text-3xl font-bold text-white">
                      Configuration terminée !
                    </h2>
                    <p className="text-white/70 text-sm mt-2 leading-relaxed">
                      Votre Hub est maintenant actif.<br />
                      Scannez-le à nouveau pour commencer !
                    </p>
                  </motion.div>

                  {/* Success info card */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    <GlassCard className="p-4 space-y-2" hover={false}>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">Logement</span>
                        <span className="text-white/90 font-medium">{homeName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">Plan</span>
                        <span className="text-white/90 font-medium capitalize">{selectedPlan.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-white/50">Essai gratuit</span>
                        <span className="text-emerald-300 font-medium">14 jours</span>
                      </div>
                    </GlassCard>
                  </motion.div>

                  {/* CTA buttons */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="flex flex-col gap-3"
                  >
                    {hubSlug && (
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => router.push(`/hub/${hubSlug}`)}
                        className="w-full h-14 rounded-2xl bg-white text-violet-700 font-bold text-sm shadow-xl shadow-black/10 flex items-center justify-center gap-2 relative overflow-hidden group"
                      >
                        <span className="relative z-10">Tester mon Hub</span>
                        <ArrowRight className="w-4 h-4 relative z-10" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                      </motion.button>
                    )}
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={() => router.push('/')}
                      className="w-full h-11 rounded-2xl bg-white/10 border border-white/20 text-white/70 text-sm font-medium hover:bg-white/20 transition-all"
                    >
                      Aller au dashboard
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Footer — safe area for iOS */}
        <div className="mt-auto px-6 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-center">
          <p className="text-xs text-white/30">
            QR Domotik &middot; qrdomotik.roomscan.pro
          </p>
        </div>
      </div>
    </AnimatedGradient>
  );
}
