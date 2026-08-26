'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode, CheckCircle2, XCircle, AlertCircle, Loader2,
  ArrowRight, ArrowLeft, Home, Lock, Mail, User,
  Shield, Wifi, Users, Building2, Sparkles, PartyPopper,
  Eye, EyeOff, Fingerprint, KeyRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

// ── Types ──
type TokenStatus = 'loading' | 'available' | 'claimed' | 'not_found' | 'error';

type SetupStep = 'welcome' | 'account' | 'plan' | 'pin' | 'home' | 'success';

interface PlaqueInfo {
  id: string;
  activationCode: string;
  batchId: string;
  quantity: number;
  designConfig: string;
}

// ── Plans ──
const PLANS = [
  {
    id: 'famille' as const,
    name: 'Famille',
    price: '49€',
    period: '/an',
    desc: 'Idéal pour votre maison',
    icon: Home,
    gradient: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50',
    borderColor: 'border-emerald-500',
    textColor: 'text-emerald-700',
    features: ['1 logement', 'PIN Famille', 'QR Hub personnalisé', 'Tous les modules V3'],
  },
  {
    id: 'airbnb_solo' as const,
    name: 'Airbnb Solo',
    price: '9,90€',
    period: '/mois',
    desc: 'Pour un seul logement',
    icon: Building2,
    gradient: 'from-violet-500 to-purple-600',
    bgLight: 'bg-violet-50',
    borderColor: 'border-violet-500',
    textColor: 'text-violet-700',
    features: ['1 logement', 'Mode Invité', 'QR Hub personnalisé', 'Tous les modules V3'],
    popular: true,
  },
  {
    id: 'airbnb_pro' as const,
    name: 'Airbnb Pro',
    price: '199€',
    period: '/an',
    badge: 'Économisez 19€',
    desc: 'Jusqu\'à 3 logements',
    icon: Building2,
    gradient: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50',
    borderColor: 'border-amber-500',
    textColor: 'text-amber-700',
    features: ['3 logements', 'Mode Invité + Famille', 'QR Hub x3', 'Tous les modules V3', 'Support prioritaire'],
  },
] as const;

// ── Animation variants ──
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

  // Account form
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Plan
  const [selectedPlan, setSelectedPlan] = useState<string>('famille');

  // PIN
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');

  // Home
  const [homeName, setHomeName] = useState('');

  // Submission
  const [submitting, setSubmitting] = useState(false);

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
      const u = session.user as Record<string, any>;
      setEmail(u?.email || '');
      setFullName(u?.name || '');
    }
  }, [session]);

  // ── Step navigation helpers ──
  const goNext = () => {
    setDirection(1);
    const order: SetupStep[] = ['welcome', 'account', 'plan', 'pin', 'home', 'success'];
    const idx = order.indexOf(step);
    if (idx < order.length - 1) setStep(order[idx + 1]);
  };

  const goBack = () => {
    setDirection(-1);
    const order: SetupStep[] = ['welcome', 'account', 'plan', 'pin', 'home', 'success'];
    const idx = order.indexOf(step);
    if (idx > 0) setStep(order[idx - 1]);
  };

  // ── Validate & navigate ──
  const handleWelcomeNext = () => goNext();

  const handleAccountNext = () => {
    if (!fullName.trim()) { toast.error('Entrez votre nom'); return; }
    if (!email.trim() || !email.includes('@')) { toast.error('Email invalide'); return; }
    if (!session?.user && (!password || password.length < 6)) { toast.error('Mot de passe requis (6+ caractères)'); return; }
    goNext();
  };

  const handlePlanNext = () => {
    if (!selectedPlan) { toast.error('Choisissez un plan'); return; }
    goNext();
  };

  const handlePinNext = () => {
    if (!/^\d{4}$/.test(pin)) { toast.error('Le PIN doit être 4 chiffres'); return; }
    if (pin !== pinConfirm) { toast.error('Les PINs ne correspondent pas'); return; }
    goNext();
  };

  const handleHomeNext = () => {
    if (!homeName.trim()) { toast.error('Nommez votre logement'); return; }
    goNext();
  };

  // ── Submit ──
  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const body: Record<string, string> = {
        email: email.trim(),
        fullName: fullName.trim(),
        pin,
        homeName: homeName.trim(),
        plan: selectedPlan,
      };

      // If user is not logged in, include password
      if (!session?.user) {
        body.password = password;
      } else {
        body.existingUserId = (session.user as Record<string, any>)?.id;
      }

      const res = await fetch(`/api/setup/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erreur lors de la configuration');
      }

      // Show success step
      setDirection(1);
      setStep('success');

      // If new user, auto-login after a delay
      if (data.isNewUser) {
        setTimeout(async () => {
          const loginRes = await fetch('/api/auth/callback/credentials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              email: email.trim(),
              password: password,
              callbackUrl: '/',
            }).toString(),
          });
          // If login succeeds, redirect to dashboard; otherwise just show success
          if (loginRes.ok) {
            window.location.href = '/';
          }
        }, 3000);
      } else {
        // Already logged in → redirect to hub after delay
        setTimeout(() => {
          window.location.href = data.hubSlug ? `/hub/${data.hubSlug}` : '/';
        }, 3000);
      }
    } catch (e: any) {
      toast.error(e.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Step indicator ──
  const stepOrder: SetupStep[] = ['welcome', 'account', 'plan', 'pin', 'home', 'success'];
  const currentIdx = stepOrder.indexOf(step);

  // ── Loading state ──
  if (tokenStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
              <QrCode className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
              <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-violet-200 font-medium">Vérification de votre plaque...</p>
            <p className="text-xs text-slate-400 mt-1 font-mono">{token}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Error states ──
  if (tokenStatus === 'not_found' || tokenStatus === 'error') {
    const Icon = tokenStatus === 'error' ? AlertCircle : XCircle;
    const msg = tokenStatus === 'not_found'
      ? { title: 'Plaque non trouvée', desc: "Ce code d'activation n'existe pas. Vérifiez votre plaque et réessayez." }
      : { title: 'Erreur', desc: 'Impossible de vérifier la plaque. Réessayez.' };
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950 p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="rounded-2xl bg-slate-800/80 backdrop-blur-xl border border-slate-700 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
              <Icon className="h-8 w-8 text-red-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">{msg.title}</h1>
            <p className="text-sm text-slate-400 mb-1 font-mono">{token}</p>
            <p className="text-sm text-slate-400 mb-6">{msg.desc}</p>
            <button onClick={() => { setTokenStatus('loading'); checkToken(); }} className="w-full h-11 rounded-xl bg-slate-700 text-slate-200 text-sm font-medium hover:bg-slate-600 transition-colors">
              Réessayer
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Already claimed ──
  if (tokenStatus === 'claimed') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950 p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <div className="rounded-2xl bg-slate-800/80 backdrop-blur-xl border border-slate-700 p-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h1 className="text-xl font-bold text-white mb-2">Plaque déjà configurée</h1>
            {claimedInfo.homeName && (
              <p className="text-sm text-slate-400 mb-1">Logement : <span className="text-violet-300 font-semibold">{claimedInfo.homeName}</span></p>
            )}
            <p className="text-sm text-slate-400 mb-6">Cette plaque est déjà liée à un compte.</p>
            {claimedInfo.hubSlug && (
              <button
                onClick={() => router.push(`/hub/${claimedInfo.hubSlug}`)}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-600/25"
              >
                Accéder au Hub
              </button>
            )}
            <button onClick={() => router.push('/')} className="w-full h-11 mt-3 rounded-xl bg-slate-700 text-slate-200 text-sm font-medium hover:bg-slate-600 transition-colors">
              Aller à l'accueil
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main multi-step flow ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header bar with step indicator */}
      <div className="w-full px-4 pt-6 pb-2">
        <div className="max-w-md mx-auto">
          {/* Logo + progress */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <QrCode className="h-4 w-4 text-white" />
              </div>
              <span className="text-sm font-bold text-white tracking-tight">QR Domotik</span>
            </div>
            <span className="text-xs text-slate-400">
              Étape {Math.min(currentIdx + 1, 5)} / 5
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-slate-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${(Math.min(currentIdx, 4) / 5) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-md relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {/* ─── STEP 1: Welcome ─── */}
            {step === 'welcome' && (
              <motion.div
                key="welcome"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="space-y-6"
              >
                <div className="text-center space-y-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
                    className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-2xl shadow-violet-500/30"
                  >
                    <QrCode className="h-12 w-12 text-white" />
                  </motion.div>
                  <motion.h1 initial={fadeUp.initial} animate={fadeUp.animate} transition={{ delay: 0.2 }} className="text-2xl font-bold text-white">
                    Bienvenue !
                  </motion.h1>
                  <motion.p initial={fadeUp.initial} animate={fadeUp.animate} transition={{ delay: 0.3 }} className="text-slate-400 text-sm leading-relaxed">
                    Votre plaque QR est prête à être configurée.<br />
                    En quelques étapes, créez votre espace domotique intelligent.
                  </motion.p>
                  {plaqueInfo && (
                    <motion.div initial={fadeUp.initial} animate={fadeUp.animate} transition={{ delay: 0.35 }} className="inline-flex items-center gap-2 rounded-full bg-slate-800/80 border border-slate-700 px-4 py-2">
                      <span className="text-xs text-slate-400">Plaque :</span>
                      <span className="text-xs font-mono text-violet-300 font-semibold">{plaqueInfo.activationCode}</span>
                    </motion.div>
                  )}
                </div>

                <motion.div initial={fadeUp.initial} animate={fadeUp.animate} transition={{ delay: 0.4 }} className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { icon: Wifi, label: 'Wi-Fi', color: 'text-emerald-400' },
                      { icon: Shield, label: 'Sécurité', color: 'text-amber-400' },
                      { icon: Users, label: 'Famille', color: 'text-violet-400' },
                    ].map((item, i) => (
                      <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 + i * 0.1 }}
                        className="flex flex-col items-center gap-2 rounded-xl bg-slate-800/60 border border-slate-700/50 p-3"
                      >
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                        <span className="text-[11px] text-slate-400 font-medium">{item.label}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  onClick={handleWelcomeNext}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2"
                >
                  Commencer la configuration
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </motion.div>
            )}

            {/* ─── STEP 2: Account ─── */}
            {step === 'account' && (
              <motion.div
                key="account"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="space-y-5"
              >
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/20">
                    <User className="h-7 w-7 text-violet-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Créez votre compte</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    {session?.user ? 'Connecté en tant que' : 'Informations de connexion'}
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Nom complet</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Jean Dupont"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full h-11 rounded-xl bg-slate-800/80 border border-slate-700 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="email"
                        placeholder="jean@exemple.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={!!session?.user}
                        className="w-full h-11 rounded-xl bg-slate-800/80 border border-slate-700 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {/* Password (only if not logged in) */}
                  {!session?.user && (
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-slate-300">Mot de passe</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="6 caractères minimum"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full h-11 rounded-xl bg-slate-800/80 border border-slate-700 pl-10 pr-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <button onClick={goBack} className="h-12 px-6 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Retour
                  </button>
                  <button onClick={handleAccountNext} className="flex-1 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2">
                    Continuer
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── STEP 3: Plan Selection ─── */}
            {step === 'plan' && (
              <motion.div
                key="plan"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="space-y-5"
              >
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/20">
                    <Sparkles className="h-7 w-7 text-violet-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Choisissez votre plan</h2>
                  <p className="text-sm text-slate-400 mt-1">14 jours d'essai gratuit inclus</p>
                </div>

                <div className="space-y-3">
                  {PLANS.map((plan) => {
                    const isSelected = selectedPlan === plan.id;
                    return (
                      <motion.button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlan(plan.id)}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
                          isSelected
                            ? `${plan.borderColor} bg-slate-800/90 shadow-lg`
                            : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center shadow-md`}>
                              <plan.icon className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">{plan.name}</span>
                                {'popular' in plan && plan.popular && (
                                  <span className="text-[10px] font-bold bg-violet-500 text-white px-2 py-0.5 rounded-full">POPULAIRE</span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400">{plan.desc}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-white">{plan.price}</span>
                            <span className="text-xs text-slate-400">{plan.period}</span>
                          </div>
                        </div>

                        {isSelected && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-3 pt-3 border-t border-slate-700"
                          >
                            <ul className="space-y-1.5">
                              {plan.features.map((f) => (
                                <li key={f} className="flex items-center gap-2 text-xs text-slate-300">
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <button onClick={goBack} className="h-12 px-6 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Retour
                  </button>
                  <button onClick={handlePlanNext} className="flex-1 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2">
                    Continuer
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── STEP 4: PIN Setup ─── */}
            {step === 'pin' && (
              <motion.div
                key="pin"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="space-y-5"
              >
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/20">
                    <Fingerprint className="h-7 w-7 text-violet-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Code PIN d'accès</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Ce code permettra aux invités et membres de la famille d'accéder au Hub
                  </p>
                </div>

                <div className="space-y-4">
                  {/* PIN display (4 boxes) */}
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Choisissez un PIN à 4 chiffres</label>
                    <div className="flex gap-3 justify-center">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={i}
                          className={`h-14 w-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold font-mono transition-all ${
                            i < pin.length
                              ? 'border-violet-500 bg-violet-500/10 text-violet-300'
                              : 'border-slate-700 bg-slate-800/50 text-slate-600'
                          }`}
                        >
                          {i < pin.length ? '●' : ''}
                        </div>
                      ))}
                    </div>
                    <input
                      type="tel"
                      inputMode="numeric"
                      maxLength={4}
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      className="sr-only"
                      autoFocus
                    />
                  </div>

                  {/* PIN numpad for mobile */}
                  <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
                    {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((key) => {
                      if (key === '') return <div key="empty" />;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            if (key === '⌫') {
                              setPin((p) => p.slice(0, -1));
                              setPinConfirm((p) => p.slice(0, -1));
                            } else if (pin.length < 4) {
                              setPin((p) => p + key);
                            }
                          }}
                          className="h-12 rounded-xl bg-slate-800 border border-slate-700 text-white text-lg font-semibold hover:bg-slate-700 active:scale-95 transition-all"
                        >
                          {key}
                        </button>
                      );
                    })}
                  </div>

                  {/* Confirm PIN */}
                  {pin.length === 4 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-1.5"
                    >
                      <label className="text-sm font-medium text-slate-300">Confirmez le PIN</label>
                      <div className="flex gap-3 justify-center">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`h-14 w-14 rounded-xl border-2 flex items-center justify-center text-2xl font-bold font-mono transition-all ${
                              i < pinConfirm.length
                                ? pinConfirm[i] === pin[i]
                                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                                  : 'border-red-500 bg-red-500/10 text-red-300'
                                : 'border-slate-700 bg-slate-800/50 text-slate-600'
                            }`}
                          >
                            {i < pinConfirm.length ? '●' : ''}
                          </div>
                        ))}
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        maxLength={4}
                        value={pinConfirm}
                        onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        className="sr-only"
                        autoFocus
                      />
                    </motion.div>
                  )}

                  {pin.length === 4 && pinConfirm.length === 4 && pin !== pinConfirm && (
                    <p className="text-center text-sm text-red-400 flex items-center justify-center gap-1.5">
                      <AlertCircle className="h-4 w-4" />
                      Les PINs ne correspondent pas
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <button onClick={goBack} className="h-12 px-6 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Retour
                  </button>
                  <button
                    onClick={handlePinNext}
                    disabled={pin.length !== 4 || pin !== pinConfirm}
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <KeyRound className="h-4 w-4" />
                    Valider le PIN
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── STEP 5: Home Name ─── */}
            {step === 'home' && (
              <motion.div
                key="home"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                className="space-y-5"
              >
                <div className="text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/20">
                    <Home className="h-7 w-7 text-violet-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">Nommez votre logement</h2>
                  <p className="text-sm text-slate-400 mt-1">
                    Ce nom sera visible par les invités et la famille
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-300">Nom du logement</label>
                    <div className="relative">
                      <Home className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        type="text"
                        placeholder="ex: Maison Dupont, Appartement Paris 15..."
                        value={homeName}
                        onChange={(e) => setHomeName(e.target.value)}
                        autoFocus
                        className="w-full h-12 rounded-xl bg-slate-800/80 border border-slate-700 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all"
                      />
                    </div>
                  </div>

                  {/* Summary card */}
                  <div className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4 space-y-3">
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Récapitulatif</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Compte</span>
                        <span className="text-white font-medium">{fullName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Email</span>
                        <span className="text-white font-medium truncate ml-4 max-w-[200px]">{email}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Plan</span>
                        <span className="text-white font-medium capitalize">{selectedPlan.replace('_', ' ')}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">PIN</span>
                        <span className="text-white font-mono font-medium">●●●●</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">Logement</span>
                        <span className={homeName.trim() ? 'text-white font-medium' : 'text-slate-500 italic'}>
                          {homeName.trim() || 'Non défini'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={goBack} className="h-12 px-6 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Retour
                  </button>
                  <button
                    onClick={handleHomeNext}
                    disabled={!homeName.trim() || submitting}
                    className="flex-1 h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-600/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                    {submitting ? 'Configuration...' : 'Configurer maintenant'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ─── STEP 6: Success ─── */}
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
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                  className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-2xl shadow-emerald-500/30"
                >
                  <PartyPopper className="h-12 w-12 text-white" />
                </motion.div>

                <motion.div initial={fadeUp.initial} animate={fadeUp.animate} transition={{ delay: 0.3 }}>
                  <h2 className="text-2xl font-bold text-white mb-2">Tout est prêt !</h2>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    Votre espace QR Domotik est configuré.<br />
                    {session?.user
                      ? 'Vous allez être redirigé vers votre Hub...'
                      : 'Vous allez être connecté automatiquement...'
                    }
                  </p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="rounded-xl bg-slate-800/60 border border-slate-700/50 p-4 space-y-2"
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Logement</span>
                    <span className="text-white font-medium">{homeName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Plan</span>
                    <span className="text-violet-300 font-medium capitalize">{selectedPlan.replace('_', ' ')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Essai gratuit</span>
                    <span className="text-emerald-300 font-medium">14 jours</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  className="flex flex-col gap-2"
                >
                  <button
                    onClick={() => router.push('/')}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold text-sm hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-600/25"
                  >
                    Aller au dashboard
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-6 text-center">
        <p className="text-xs text-slate-500">
          QR Domotik &middot; qrdomotik.roomscan.pro
        </p>
      </div>
    </div>
  );
}
