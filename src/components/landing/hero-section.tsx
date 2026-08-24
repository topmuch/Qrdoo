'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  QrCode,
  Printer,
  Smartphone,
  Wifi,
  DoorOpen,
  ShoppingBag,
  BookOpen,
  ClipboardList,
  Shield,
  Zap,
  Layers,
  RefreshCw,
  Lock,
  Headphones,
  Star,
  ArrowRight,
  Check,
  Menu,
  X,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { QrDemoMini } from './qr-demo';
import { QrDemo } from './qr-demo';

interface LandingPageProps {
  onGoToDashboard: () => void;
}

/* ─── Reusable fade-in-up wrapper ─── */
function FadeIn({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Sticky Navbar ─── */
function Navbar({ onGoToDashboard }: { onGoToDashboard: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { label: 'Accueil', href: '#hero' },
    { label: 'A propos', href: '#avantages' },
    { label: 'Tarifs', href: '#pricing' },
    { label: 'Contactez nous', href: '#cta-final' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#0a0f1e]/95 backdrop-blur-md border-b border-white/10 shadow-lg shadow-black/20'
          : 'bg-[#0a0f1e]/80 backdrop-blur-md border-b border-white/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <a
          href="#hero"
          onClick={(e) => handleNavClick(e, '#hero')}
          className="flex items-center gap-2 group"
        >
          <QrCode className="w-6 h-6 text-[#2563EB] group-hover:scale-110 transition-transform" />
          <span className="font-bold text-lg tracking-tight">QR Domotik</span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="text-sm text-gray-300 hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
          <button
            onClick={onGoToDashboard}
            className="ml-2 px-5 py-2 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-[#1d4ed8] transition-colors"
          >
            Se connecter
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-gray-300 hover:text-white transition-colors"
          aria-label="Menu"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-4 pb-4 space-y-1 bg-[#0a0f1e]/95 backdrop-blur-md border-t border-white/5">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className="block py-3 px-3 text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            >
              {link.label}
            </a>
          ))}
          <button
            onClick={() => {
              setMobileOpen(false);
              onGoToDashboard();
            }}
            className="w-full mt-2 px-5 py-3 rounded-lg bg-[#2563EB] text-white text-sm font-medium hover:bg-[#1d4ed8] transition-colors"
          >
            Se connecter
          </button>
        </div>
      </div>
    </nav>
  );
}

/* ─── Section wrapper ─── */
function Section({
  children,
  className = '',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.section
      id={id}
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6 }}
      className={`py-20 md:py-28 px-4 md:px-8 scroll-mt-16 ${className}`}
    >
      <div className="max-w-7xl mx-auto">{children}</div>
    </motion.section>
  );
}

/* ─── Section Title ─── */
function SectionTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="text-center mb-16">
      <FadeIn>
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
          {title}
        </h2>
      </FadeIn>
      {subtitle && (
        <FadeIn delay={0.1}>
          <p className="text-gray-400 text-lg md:text-xl">{subtitle}</p>
        </FadeIn>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   LANDING PAGE
   ═══════════════════════════════════════════════════════ */
export function LandingPage({ onGoToDashboard }: LandingPageProps) {
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  return (
    <div className="min-h-screen flex flex-col bg-[#0a0f1e] text-white">
      {/* ═══ NAVBAR ═══ */}
      <Navbar onGoToDashboard={onGoToDashboard} />

      {/* ═══ 1. HERO SECTION ═══ */}
      <section
        id="hero"
        ref={heroRef}
        className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-[#0a0f1e] via-[#111827] to-[#0d1526] scroll-mt-16"
      >
        {/* Animated background orbs */}
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-[#2563EB]/20 rounded-full blur-3xl pointer-events-none"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 6, repeat: Infinity }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-[#10B981]/15 rounded-full blur-3xl pointer-events-none"
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
          transition={{ duration: 8, repeat: Infinity, delay: 2 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#F59E0B]/10 rounded-full blur-3xl pointer-events-none"
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.3, 0.15] }}
          transition={{ duration: 7, repeat: Infinity, delay: 4 }}
        />

        <div className="max-w-7xl mx-auto px-4 md:px-8 w-full pt-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left content */}
            <motion.div
              initial={{ opacity: 0, x: -40 }}
              animate={heroInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
              transition={{ duration: 0.8 }}
            >
              {/* Badge */}
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="inline-block bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm mb-8"
              >
                🚀 La nouvelle façon de gérer votre maison
              </motion.span>

              {/* H1 */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6"
              >
                Transformez votre maison en{' '}
                <span className="bg-gradient-to-r from-[#2563EB] via-[#10B981] to-[#2563EB] bg-clip-text text-transparent">
                  maison intelligente
                </span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-lg md:text-xl text-gray-300 mb-8 max-w-xl"
              >
                Collez un QR code. Scannez-le. C'est tout. QR Domotik
                transforme n'importe quel objet en commande domotique.
              </motion.p>

              {/* CTA Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-4 mb-8"
              >
                <button
                  onClick={onGoToDashboard}
                  className="flex items-center justify-center gap-2 bg-[#2563EB] hover:bg-[#2563EB]/90 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-[#2563EB]/25 hover:shadow-[#2563EB]/40"
                >
                  Commencer gratuitement
                  <ArrowRight className="w-5 h-5" />
                </button>
                <a
                  href="https://qrdomotik.roomscan.pro"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 backdrop-blur-xl bg-white/10 border border-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-all hover:bg-white/20"
                >
                  Voir la démo
                </a>
              </motion.div>

              {/* Social proof */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={heroInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="text-gray-400 text-sm"
              >
                ✨ Rejoint par 2 500+ foyers français
              </motion.p>
            </motion.div>

            {/* Right side - Phone mockup */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={heroInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex justify-center lg:justify-end"
            >
              <div
                id="qr-hero-slot"
                className="w-[280px] h-[560px] md:w-[300px] md:h-[600px] rounded-[2.5rem] bg-gradient-to-b from-gray-800 to-gray-900 p-3 shadow-2xl shadow-[#2563EB]/20"
              >
                <div className="w-full h-full rounded-[2rem] bg-gray-950 overflow-hidden">
                  <QrDemoMini />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══ 2. COMMENT CA MARCHE ═══ */}
      <Section>
        <SectionTitle
          title="Comment ça marche ?"
          subtitle="3 étapes simples"
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: QrCode,
              number: '01',
              title: 'Créez',
              description:
                'Générez vos QR codes personnalisés en quelques clics depuis le dashboard.',
            },
            {
              icon: Printer,
              number: '02',
              title: 'Imprimez',
              description:
                'Imprimez et collez vos QR codes sur vos appareils, portes, meubles...',
            },
            {
              icon: Smartphone,
              number: '03',
              title: 'Scannez',
              description:
                'Scannez le QR code et accédez instantanément à l\'information ou l\'action.',
            },
          ].map((step, index) => (
            <FadeIn key={step.number} delay={index * 0.15}>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center h-full">
                <p className="text-5xl font-bold text-[#2563EB]/20 mb-4">
                  {step.number}
                </p>
                <div className="w-14 h-14 rounded-2xl bg-[#2563EB]/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-7 h-7 text-[#2563EB]" />
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ═══ 3. MODULES POPULAIRES ═══ */}
      <Section>
        <SectionTitle
          title="Des modules pour chaque besoin"
          subtitle="Plus de 50 modules disponibles"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            {
              icon: Wifi,
              title: 'Wi-Fi Invités',
              description: 'Partagez votre Wi-Fi en un scan',
              color: '#2563EB',
            },
            {
              icon: DoorOpen,
              title: 'Portier Virtuel',
              description: 'Gérez les visiteurs à distance',
              color: '#10B981',
            },
            {
              icon: ShoppingBag,
              title: 'Liste de courses',
              description: 'Partagez et synchronisez vos achats',
              color: '#F59E0B',
            },
            {
              icon: BookOpen,
              title: 'Manuel Maison',
              description: 'Guide interactif pour vos invités',
              color: '#8B5CF6',
            },
            {
              icon: ClipboardList,
              title: 'Checklist',
              description: 'Listes de tâches partagées',
              color: '#EC4899',
            },
            {
              icon: Shield,
              title: 'Urgence',
              description: 'Accès rapide aux contacts d\'urgence',
              color: '#EF4444',
            },
          ].map((mod, index) => (
            <FadeIn key={mod.title} delay={index * 0.08}>
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all hover:border-[#2563EB]/30 group cursor-pointer h-full">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${mod.color}15` }}
                >
                  <mod.icon
                    className="w-6 h-6"
                    style={{ color: mod.color }}
                  />
                </div>
                <h3 className="font-semibold mb-1 group-hover:text-white transition-colors">
                  {mod.title}
                </h3>
                <p className="text-sm text-gray-400">{mod.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ═══ 4. DEMO EN DIRECT ═══ */}
      <Section>
        <SectionTitle
          title="Demo en direct"
          subtitle="Scannez ce QR code pour voir un module en action"
        />
        <FadeIn>
          <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
            {/* QR Code */}
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-[#2563EB]/20 rounded-3xl blur-2xl scale-110" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 md:p-10">
                <QrDemo size={220} showLabel showScanner />
              </div>
            </div>

            {/* Description */}
            <div className="max-w-md text-center lg:text-left">
              <h3 className="text-2xl font-bold mb-4">
                Essayez-le maintenant
              </h3>
              <p className="text-gray-400 mb-6 leading-relaxed">
                Ce QR code est reel et fonctionnel. Scannez-le avec votre
                telephone pour voir comment fonctionne un module QR Domotik.
                Le contenu change automatiquement toutes les 5 secondes.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-[#10B981]" />
                  QR dynamique
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-[#2563EB]" />
                  5 modules de demo
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <div className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                  Temps reel
                </div>
              </div>
            </div>
          </div>
        </FadeIn>
      </Section>

      {/* ═══ 5. AVANTAGES (Bento Grid) ═══ */}
      <Section id="avantages">
        <SectionTitle title="Pourquoi QR Domotik ?" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Large: Installation instantanée */}
          <FadeIn delay={0} className="md:col-span-2">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 hover:border-[#2563EB]/30 transition-all h-full">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#F59E0B]/10 flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6 text-[#F59E0B]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">
                    Installation instantanée
                  </h3>
                  <p className="text-gray-400">
                    Collez un QR code, c'est opérationnel. Aucune installation
                    technique, aucun câblage.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Small: 50+ modules */}
          <FadeIn delay={0.1}>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 hover:border-[#2563EB]/30 transition-all h-full">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#2563EB]/10 flex items-center justify-center shrink-0">
                  <Layers className="w-6 h-6 text-[#2563EB]" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-[#2563EB] mb-1">50+</p>
                  <h3 className="font-bold mb-2">modules</h3>
                  <p className="text-sm text-gray-400">
                    De Wi-Fi à la domotique, trouvez le module parfait.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Small: Zero app requise */}
          <FadeIn delay={0.15}>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 hover:border-[#2563EB]/30 transition-all h-full">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#10B981]/10 flex items-center justify-center shrink-0">
                  <Smartphone className="w-6 h-6 text-[#10B981]" />
                </div>
                <div>
                  <h3 className="font-bold mb-2">Zero app requise</h3>
                  <p className="text-sm text-gray-400">
                    Vos invités scannent le QR, pas besoin de télécharger quoi
                    que ce soit.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Small: Mises à jour */}
          <FadeIn delay={0.2}>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 hover:border-[#2563EB]/30 transition-all h-full">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#8B5CF6]/10 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-6 h-6 text-[#8B5CF6]" />
                </div>
                <div>
                  <h3 className="font-bold mb-2">Mises à jour</h3>
                  <p className="text-sm text-gray-400">
                    Modifiez le contenu de vos QR codes à tout moment depuis le
                    dashboard.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Large: Sécurisé et privé */}
          <FadeIn delay={0.25} className="md:col-span-2">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 hover:border-[#2563EB]/30 transition-all h-full">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#10B981]/10 flex items-center justify-center shrink-0">
                  <Lock className="w-6 h-6 text-[#10B981]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-2">
                    Sécurisé et privé
                  </h3>
                  <p className="text-gray-400">
                    Vos données sont chiffrées. Vous contrôlez qui voit quoi.
                    Conformité RGPD.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>

          {/* Small: Support 24/7 */}
          <FadeIn delay={0.3}>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 hover:border-[#2563EB]/30 transition-all h-full">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#EC4899]/10 flex items-center justify-center shrink-0">
                  <Headphones className="w-6 h-6 text-[#EC4899]" />
                </div>
                <div>
                  <h3 className="font-bold mb-2">Support 24/7</h3>
                  <p className="text-sm text-gray-400">
                    Notre équipe est là pour vous aider à tout moment.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>
      </Section>

      {/* ═══ 5. TÉMOIGNAGES ═══ */}
      <Section>
        <SectionTitle title="Ils nous font confiance" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              quote:
                'QR Domotik a transformé notre maison Airbnb. Nos invités adorent !',
              name: 'Marie D.',
              role: 'Hôtesse Airbnb',
              city: 'Paris',
              initials: 'MD',
              color: '#2563EB',
            },
            {
              quote:
                'Plus besoin de noter le mot de passe Wi-Fi sur un bout de papier.',
              name: 'Thomas R.',
              role: 'Papa de 3 enfants',
              city: 'Lyon',
              initials: 'TR',
              color: '#10B981',
            },
            {
              quote:
                'Le portier virtuel est génial. On sait toujours qui est passé.',
              name: 'Sophie M.',
              role: 'Propriétaire',
              city: 'Bordeaux',
              initials: 'SM',
              color: '#F59E0B',
            },
          ].map((t, index) => (
            <FadeIn key={t.name} delay={index * 0.15}>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 md:p-8 h-full flex flex-col">
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-5 h-5 text-[#F59E0B] fill-[#F59E0B]"
                    />
                  ))}
                </div>
                <p className="text-gray-300 mb-6 flex-1 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ backgroundColor: t.color }}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">
                      {t.role}, {t.city}
                    </p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* ═══ 6. PRICING ═══ */}
      <Section id="pricing">
        <SectionTitle
          title="Simple et transparent"
          subtitle="Choisissez le plan qui vous convient"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Gratuit */}
          <FadeIn delay={0}>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 h-full flex flex-col">
              <h3 className="text-xl font-bold mb-2">Gratuit</h3>
              <div className="mb-6">
                <span className="text-5xl font-extrabold">0€</span>
                <span className="text-gray-400">/mois</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  '5 QR codes',
                  '3 modules de base',
                  '1 maison',
                  'Support email',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-[#10B981] shrink-0" />
                    <span className="text-gray-300">{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={onGoToDashboard}
                className="w-full py-3 rounded-xl border border-white/20 text-white font-semibold hover:bg-white/10 transition-all"
              >
                Commencer gratuitement
              </button>
            </div>
          </FadeIn>

          {/* Pro */}
          <FadeIn delay={0.15}>
            <div className="bg-gradient-to-b from-[#2563EB]/20 to-[#10B981]/10 border border-[#2563EB]/30 rounded-2xl p-8 h-full flex flex-col relative">
              <span className="absolute top-4 right-4 bg-[#2563EB] text-white text-xs font-bold px-3 py-1 rounded-full">
                Populaire
              </span>
              <h3 className="text-xl font-bold mb-2">Pro</h3>
              <div className="mb-6">
                <span className="text-5xl font-extrabold">9,90€</span>
                <span className="text-gray-400">/mois</span>
              </div>
              <ul className="space-y-3 mb-8 flex-1">
                {[
                  'QR codes illimités',
                  'Tous les modules',
                  'Maisons illimitées',
                  'Marketplace V3',
                  'Support prioritaire',
                  'API & intégrations',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-[#10B981] shrink-0" />
                    <span className="text-gray-300">{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={onGoToDashboard}
                className="w-full py-3 rounded-xl bg-[#2563EB] hover:bg-[#2563EB]/90 text-white font-semibold transition-all shadow-lg shadow-[#2563EB]/25"
              >
                Démarrer l'essai gratuit
              </button>
            </div>
          </FadeIn>
        </div>
      </Section>

      {/* ═══ 7. FAQ ═══ */}
      <Section>
        <SectionTitle title="Questions fréquentes" />
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem
                value="faq-1"
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden px-6"
              >
                <AccordionTrigger className="text-left text-white hover:no-underline py-5">
                  Comment fonctionne QR Domotik ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  QR Domotik utilise des QR codes dynamiques liés à des modules
                  configurables. Collez un QR code sur un objet, scannez-le avec
                  votre téléphone, et accédez instantanément à l'information ou
                  l'action associée.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="faq-2"
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden px-6"
              >
                <AccordionTrigger className="text-left text-white hover:no-underline py-5">
                  Mes invités doivent-ils installer une application ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  Non, absolument pas ! Vos invités n'ont besoin que de
                  l'appareil photo de leur téléphone. Le QR code ouvre une page
                  web mobile optimisée.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="faq-3"
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden px-6"
              >
                <AccordionTrigger className="text-left text-white hover:no-underline py-5">
                  Puis-je modifier le contenu d'un QR code ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  Oui ! Contrairement aux QR codes classiques, les QR Domotik
                  sont dynamiques. Vous pouvez modifier le contenu à tout moment
                  depuis votre dashboard sans changer le QR code physique.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="faq-4"
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden px-6"
              >
                <AccordionTrigger className="text-left text-white hover:no-underline py-5">
                  Le portier virtuel fonctionne-t-il quand je suis absent ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  Oui, le portier virtuel affiche un statut 'Absent' et présente
                  vos consignes personnalisées au visiteur. Vous recevez une
                  notification à chaque sonnerie ou message.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="faq-5"
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden px-6"
              >
                <AccordionTrigger className="text-left text-white hover:no-underline py-5">
                  Qu'est-ce que le Marketplace V3 ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  Le Marketplace V3 connecte votre maison aux commerçants et
                  artisans de votre quartier. Promotions, services à domicile, et
                  tout cela accessible directement depuis vos QR codes.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem
                value="faq-6"
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden px-6"
              >
                <AccordionTrigger className="text-left text-white hover:no-underline py-5">
                  Mes données sont-elles sécurisées ?
                </AccordionTrigger>
                <AccordionContent className="text-gray-400">
                  Absolument. Toutes les données sont chiffrées (SSL/TLS),
                  hébergées en France (RGPD), et vous contrôlez la visibilité de
                  chaque QR code.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </FadeIn>
        </div>
      </Section>

      {/* ═══ 8. CTA FINAL ═══ */}
      <section id="cta-final" className="bg-gradient-to-r from-[#2563EB] to-[#10B981] py-20 px-4 md:px-8 scroll-mt-16">
        <FadeIn>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Prêt à transformer votre maison ?
            </h2>
            <p className="text-white/80 text-lg mb-8">
              Rejoignez les 2 500+ foyers qui ont déjà fait le choix de la
              simplicité.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={onGoToDashboard}
                className="px-8 py-4 rounded-xl bg-white text-[#2563EB] font-semibold hover:bg-white/90 transition-all shadow-lg"
              >
                Commencer gratuitement
              </button>
              <a
                href="https://qrdomotik.roomscan.pro"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 rounded-xl border-2 border-white text-white font-semibold hover:bg-white/10 transition-all"
              >
                Voir la démo
              </a>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* ═══ 9. FOOTER ═══ */}
      <footer className="mt-auto bg-[#0a0f1e] border-t border-white/10 py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            {/* Col 1: Logo & description */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <QrCode className="w-6 h-6 text-[#2563EB]" />
                <span className="font-bold text-lg">QR Domotik</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Transformez n'importe quel objet en commande domotique grâce à
                la puissance des QR codes.
              </p>
            </div>

            {/* Col 2: Produit */}
            <div>
              <h4 className="font-semibold mb-4">Produit</h4>
              <ul className="space-y-2.5">
                {['Fonctionnalités', 'Modules', 'Prix', 'Marketplace'].map(
                  (link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>

            {/* Col 3: Support */}
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2.5">
                {['Documentation', 'Contact', 'FAQ', 'Statut'].map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-gray-400 hover:text-white transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Col 4: Légal */}
            <div>
              <h4 className="font-semibold mb-4">Légal</h4>
              <ul className="space-y-2.5">
                {['CGU', 'Confidentialité', 'Mentions légales', 'Cookies'].map(
                  (link) => (
                    <li key={link}>
                      <a
                        href="#"
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {link}
                      </a>
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>

          {/* Bottom copyright */}
          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-sm text-gray-500">
              © 2025 QR Domotik. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
