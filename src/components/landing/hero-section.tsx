'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  QrCode, Printer, Smartphone, Wifi, DoorOpen, ShoppingBag,
  BookOpen, ClipboardList, Shield, Zap, Layers, RefreshCw,
  Lock, Headphones, Star, ArrowRight, Check, Menu, X,
  Store, Mic, Package, Users,
} from 'lucide-react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { QrDemoMini } from './qr-demo';
import { QrDemo } from './qr-demo';

interface LandingPageProps { onGoToDashboard: () => void }

function FadeIn({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-50px' }} transition={{ duration: 0.6, delay }} className={className}>
      {children}
    </motion.div>
  );
}

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
    { label: 'Fonctionnalites', href: '#avantages' },
    { label: 'Nouveautes V3', href: '#v3' },
    { label: 'Tarifs', href: '#pricing' },
    { label: 'Contact', href: '#cta-final' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileOpen(false);
    const target = document.querySelector(href);
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  };

  const navBg = scrolled ? 'bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm' : 'bg-transparent';
  const txtColor = scrolled ? 'text-gray-900' : 'text-gray-600';

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-16">
        <a href="#hero" onClick={(e) => handleNavClick(e, '#hero')} className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center">
            <QrCode className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
          </div>
          <span className={`font-bold text-lg tracking-tight ${scrolled ? 'text-gray-900' : 'text-gray-800'}`}>QR Domotik</span>
        </a>
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={(e) => handleNavClick(e, link.href)} className={`text-sm ${txtColor} hover:text-gray-900 transition-colors`}>
              {link.label}
            </a>
          ))}
          <button onClick={onGoToDashboard} className="ml-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors shadow-sm shadow-violet-600/25">
            Se connecter
          </button>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors" aria-label="Menu">
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${mobileOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-4 pb-4 space-y-1 bg-white/95 backdrop-blur-md border-t border-gray-100">
          {links.map((link) => (
            <a key={link.href} href={link.href} onClick={(e) => handleNavClick(e, link.href)} className="block py-3 px-3 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              {link.label}
            </a>
          ))}
          <button onClick={() => { setMobileOpen(false); onGoToDashboard(); }} className="w-full mt-2 px-5 py-3 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors">
            Se connecter
          </button>
        </div>
      </div>
    </nav>
  );
}

function Section({ children, className = '', id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <motion.section id={id} ref={ref} initial={{ opacity: 0, y: 30 }} animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }} transition={{ duration: 0.6 }} className={`py-20 md:py-28 px-4 md:px-8 scroll-mt-16 ${className}`}>
      <div className="max-w-7xl mx-auto">{children}</div>
    </motion.section>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-16">
      <FadeIn><h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">{title}</h2></FadeIn>
      {subtitle && <FadeIn delay={0.1}><p className="text-gray-500 text-lg md:text-xl">{subtitle}</p></FadeIn>}
    </div>
  );
}

export function LandingPage({ onGoToDashboard }: LandingPageProps) {
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900">
      <Navbar onGoToDashboard={onGoToDashboard} />

      {/* HERO */}
      <section id="hero" ref={heroRef} className="relative min-h-screen flex items-center overflow-hidden bg-gradient-to-br from-white via-violet-50/50 to-sky-50/30 scroll-mt-16">
        <div className="absolute top-20 left-10 w-72 h-72 bg-violet-200/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 md:px-8 w-full pt-20 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, x: -40 }} animate={heroInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }} transition={{ duration: 0.8 }}>
              <motion.span initial={{ opacity: 0, y: 20 }} animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} transition={{ duration: 0.6, delay: 0.2 }} className="inline-flex items-center gap-2 bg-violet-100 text-violet-700 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
                <Zap className="w-4 h-4" /> La nouvelle facon de gerer votre maison
              </motion.span>
              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} transition={{ duration: 0.6, delay: 0.3 }} className="text-4xl sm:text-5xl md:text-6xl font-extrabold leading-tight mb-6 text-gray-900">
                Transformez votre maison en{' '}
                <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500 bg-clip-text text-transparent">maison intelligente</span>
              </motion.h1>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} transition={{ duration: 0.6, delay: 0.4 }} className="text-lg md:text-xl text-gray-600 mb-8 max-w-xl">
                Collez un QR code. Scannez-le. C&apos;est tout. QR Domotik transforme n&apos;importe quel objet en commande domotique.
              </motion.p>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={heroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} transition={{ duration: 0.6, delay: 0.5 }} className="flex flex-col sm:flex-row gap-4 mb-8">
                <button onClick={onGoToDashboard} className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold px-8 py-4 rounded-xl transition-all shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40">
                  Commencer gratuitement <ArrowRight className="w-5 h-5" />
                </button>
                <a href="https://qrdomotik.roomscan.pro" target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 font-semibold px-8 py-4 rounded-xl transition-all hover:bg-gray-50 hover:border-gray-300 shadow-sm">
                  Voir la demo
                </a>
              </motion.div>
              <motion.p initial={{ opacity: 0 }} animate={heroInView ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 0.6, delay: 0.7 }} className="text-gray-400 text-sm">
                Rejoint par 2 500+ foyers
              </motion.p>
            </motion.div>
            <motion.div initial={{ opacity: 0, x: 40 }} animate={heroInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }} transition={{ duration: 0.8, delay: 0.3 }} className="flex justify-center lg:justify-end">
              <div id="qr-hero-slot" className="w-[280px] h-[560px] md:w-[300px] md:h-[600px] rounded-[2.5rem] bg-gradient-to-b from-gray-100 to-gray-200 p-3 shadow-2xl shadow-violet-500/10">
                <div className="w-full h-full rounded-[2rem] bg-white overflow-hidden shadow-inner">
                  <QrDemoMini />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* COMMENT CA MARCHE */}
      <Section className="bg-gray-50/50">
        <SectionTitle title="Comment ca marche ?" subtitle="3 etapes simples" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: QrCode, number: '01', title: 'Creez', description: 'Generez vos QR codes personnalises en quelques clics depuis le dashboard.' },
            { icon: Printer, number: '02', title: 'Imprimez', description: 'Imprimez et collez vos QR codes sur vos appareils, portes, meubles...' },
            { icon: Smartphone, number: '03', title: 'Scannez', description: "Scannez le QR code et accedez instantanement a l'information ou l'action." },
          ].map((step, index) => (
            <FadeIn key={step.number} delay={index * 0.15}>
              <div className="bg-white rounded-2xl p-8 text-center h-full shadow-sm border border-gray-100 hover:shadow-md hover:border-violet-200 transition-all">
                <p className="text-5xl font-bold text-violet-100 mb-4">{step.number}</p>
                <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-7 h-7 text-violet-600" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{step.title}</h3>
                <p className="text-gray-500">{step.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* MODULES V1+V2 */}
      <Section>
        <SectionTitle title="Des modules pour chaque besoin" subtitle="Plus de 50 modules disponibles" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            { icon: Wifi, title: 'Wi-Fi Invites', description: 'Partagez votre Wi-Fi en un scan', color: 'text-blue-600', bg: 'bg-blue-50' },
            { icon: DoorOpen, title: 'Portier Virtuel', description: 'Gerez les visiteurs a distance', color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { icon: ShoppingBag, title: 'Liste de courses', description: 'Partagez et synchronisez vos achats', color: 'text-amber-600', bg: 'bg-amber-50' },
            { icon: BookOpen, title: 'Manuel Maison', description: 'Guide interactif pour vos invites', color: 'text-violet-600', bg: 'bg-violet-50' },
            { icon: ClipboardList, title: 'Checklist', description: 'Listes de taches partagees', color: 'text-pink-600', bg: 'bg-pink-50' },
            { icon: Shield, title: 'Urgence', description: "Acces rapide aux contacts d'urgence", color: 'text-red-600', bg: 'bg-red-50' },
          ].map((mod, index) => (
            <FadeIn key={mod.title} delay={index * 0.08}>
              <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all group cursor-pointer h-full">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${mod.bg}`}>
                  <mod.icon className={`w-6 h-6 ${mod.color}`} />
                </div>
                <h3 className="font-semibold mb-1 text-gray-900 group-hover:text-violet-600 transition-colors">{mod.title}</h3>
                <p className="text-sm text-gray-500">{mod.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* NOUVEAUTES V3 */}
      <Section id="v3" className="bg-gradient-to-b from-violet-50/80 to-white">
        <SectionTitle title="Nouveautes V3" subtitle="Une experience encore plus riche" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Users, title: 'Hub Central', description: "Un point d'acces unique pour tous vos QR codes. Mode Invite ou Famille avec code PIN.", color: 'text-violet-600', bg: 'bg-violet-50', border: 'hover:border-violet-300' },
            { icon: Store, title: 'Annuaire Artisans', description: 'Trouvez des professionnels verifies dans votre quartier et reservez en un scan.', color: 'text-teal-600', bg: 'bg-teal-50', border: 'hover:border-teal-300' },
            { icon: ShoppingBag, title: 'Marketplace Local', description: 'Promotions, ventes flash et coupons des commercants de votre quartier.', color: 'text-rose-600', bg: 'bg-rose-50', border: 'hover:border-rose-300' },
            { icon: Mic, title: 'Messages Vocaux', description: 'Laissez des messages audio pour votre famille ou vos invites directement depuis le Hub.', color: 'text-amber-600', bg: 'bg-amber-50', border: 'hover:border-amber-300' },
            { icon: ClipboardList, title: 'Inventaire & DLC', description: 'Suivez vos stocks, alertes dates de consommation et liste de courses automatique.', color: 'text-red-600', bg: 'bg-red-50', border: 'hover:border-red-300' },
            { icon: Package, title: 'Packs Configures', description: "Packs pre-configures pour Airbnb, Famille ou Bureau. Installation en 1 clic.", color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'hover:border-emerald-300' },
          ].map((mod, index) => (
            <FadeIn key={mod.title} delay={index * 0.1}>
              <div className={`bg-white rounded-2xl p-6 border border-gray-100 ${mod.border} transition-all group cursor-pointer h-full hover:shadow-lg`}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${mod.bg}`}>
                  <mod.icon className={`w-6 h-6 ${mod.color}`} />
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-semibold text-gray-900 group-hover:text-violet-600 transition-colors">{mod.title}</h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-700">V3</span>
                </div>
                <p className="text-sm text-gray-500 leading-relaxed">{mod.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* DEMO */}
      <Section className="bg-gray-50/50">
        <SectionTitle title="Demo en direct" subtitle="Scannez ce QR code pour voir un module en action" />
        <FadeIn>
          <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
            <div className="relative">
              <div className="absolute inset-0 bg-violet-200/40 rounded-3xl blur-2xl scale-110" />
              <div className="relative bg-white rounded-3xl p-8 md:p-10 shadow-lg border border-gray-100">
                <QrDemo size={220} showLabel showScanner />
              </div>
            </div>
            <div className="max-w-md text-center lg:text-left">
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Essayez-le maintenant</h3>
              <p className="text-gray-500 mb-6 leading-relaxed">Ce QR code est reel et fonctionnel. Scannez-le avec votre telephone pour voir comment fonctionne un module QR Domotik.</p>
              <div className="flex flex-col sm:flex-row gap-3">
                {[{ dot: 'bg-emerald-500', label: 'QR dynamique' }, { dot: 'bg-violet-500', label: '5 modules de demo' }, { dot: 'bg-amber-500', label: 'Temps reel' }].map((d) => (
                  <div key={d.label} className="flex items-center gap-2 text-sm text-gray-600"><div className={`w-2 h-2 rounded-full ${d.dot}`} />{d.label}</div>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </Section>

      {/* AVANTAGES */}
      <Section id="avantages">
        <SectionTitle title="Pourquoi QR Domotik ?" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FadeIn delay={0} className="md:col-span-2">
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 hover:shadow-md hover:border-violet-200 transition-all h-full">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0"><Zap className="w-6 h-6 text-amber-600" /></div>
                <div><h3 className="text-lg font-bold mb-2 text-gray-900">Installation instantanee</h3><p className="text-gray-500">Collez un QR code, c&apos;est operationnel. Aucune installation technique, aucun cablage.</p></div>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="bg-violet-600 rounded-2xl p-6 md:p-8 text-white h-full">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center shrink-0"><Layers className="w-6 h-6" /></div>
                <div><p className="text-3xl font-bold mb-1">50+</p><h3 className="font-bold mb-2">modules</h3><p className="text-sm text-violet-200">De Wi-Fi a la domotique, trouvez le module parfait.</p></div>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.15}>
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 hover:shadow-md hover:border-violet-200 transition-all h-full">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0"><Smartphone className="w-6 h-6 text-emerald-600" /></div>
                <div><h3 className="font-bold mb-2 text-gray-900">Zero app requise</h3><p className="text-sm text-gray-500">Vos invites scannent le QR, pas besoin de telecharger quoi que ce soit.</p></div>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 hover:shadow-md hover:border-violet-200 transition-all h-full">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center shrink-0"><RefreshCw className="w-6 h-6 text-violet-600" /></div>
                <div><h3 className="font-bold mb-2 text-gray-900">Mises a jour</h3><p className="text-sm text-gray-500">Modifiez le contenu de vos QR codes a tout moment depuis le dashboard.</p></div>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.25} className="md:col-span-2">
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 hover:shadow-md hover:border-violet-200 transition-all h-full">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0"><Lock className="w-6 h-6 text-emerald-600" /></div>
                <div><h3 className="text-lg font-bold mb-2 text-gray-900">Securise et prive</h3><p className="text-gray-500">Vos donnees sont chiffrees. Vous controlez qui voit quoi. Conformite RGPD.</p></div>
              </div>
            </div>
          </FadeIn>
          <FadeIn delay={0.3}>
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-gray-100 hover:shadow-md hover:border-violet-200 transition-all h-full">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-pink-50 flex items-center justify-center shrink-0"><Headphones className="w-6 h-6 text-pink-600" /></div>
                <div><h3 className="font-bold mb-2 text-gray-900">Support 24/7</h3><p className="text-sm text-gray-500">Notre equipe est la pour vous aider a tout moment.</p></div>
              </div>
            </div>
          </FadeIn>
        </div>
      </Section>

      {/* TEMOIGNAGES */}
      <Section className="bg-gray-50/50">
        <SectionTitle title="Ils nous font confiance" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { quote: "Le Hub central a revolutionne notre Airbnb. Nos invites ont tout en un seul scan : Wi-Fi, manuel, et meme les bons plans du quartier !", name: 'Marie D.', role: 'Hotesse Airbnb Superhost', city: 'Paris', initials: 'MD', color: 'bg-violet-600' },
            { quote: "L'inventaire et les alertes DLC m'ont evite de jeter de la nourriture. Ma liste de courses se remplit toute seule.", name: 'Thomas R.', role: 'Papa de 3 enfants', city: 'Lyon', initials: 'TR', color: 'bg-emerald-600' },
            { quote: "J'ai trouve un plombier en 5 minutes via l'annuaire artisans. Le chat integre est super pratique.", name: 'Sophie M.', role: 'Proprietaire', city: 'Bordeaux', initials: 'SM', color: 'bg-amber-600' },
          ].map((t, index) => (
            <FadeIn key={t.name} delay={index * 0.15}>
              <div className="bg-white rounded-2xl p-6 md:p-8 h-full flex flex-col shadow-sm border border-gray-100">
                <div className="flex gap-1 mb-4">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />)}</div>
                <p className="text-gray-600 mb-6 flex-1 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${t.color}`}>{t.initials}</div>
                  <div><p className="font-semibold text-sm text-gray-900">{t.name}</p><p className="text-xs text-gray-400">{t.role}, {t.city}</p></div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </Section>

      {/* PRICING */}
      <Section id="pricing">
        <SectionTitle title="Simple et transparent" subtitle="Choisissez le plan qui vous convient" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <FadeIn delay={0}>
            <div className="bg-white rounded-2xl p-8 h-full flex flex-col border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold mb-2 text-gray-900">Famille</h3>
              <div className="mb-6"><span className="text-4xl font-extrabold text-gray-900">49€</span><span className="text-gray-400">/an</span></div>
              <ul className="space-y-3 mb-8 flex-1">
                {['15 QR codes', 'Tous les modules V1+V2', 'Hub familial', 'Inventaire & DLC', 'Messages vocaux'].map((f) => (
                  <li key={f} className="flex items-center gap-3"><Check className="w-5 h-5 text-emerald-500 shrink-0" /><span className="text-gray-600 text-sm">{f}</span></li>
                ))}
              </ul>
              <button onClick={onGoToDashboard} className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all">Essai 14 jours gratuit</button>
            </div>
          </FadeIn>
          <FadeIn delay={0.1}>
            <div className="bg-gradient-to-b from-violet-600 to-purple-700 rounded-2xl p-8 h-full flex flex-col relative text-white shadow-xl shadow-violet-500/20">
              <span className="absolute top-4 right-4 bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">Populaire</span>
              <h3 className="text-xl font-bold mb-2">Airbnb Solo</h3>
              <div className="mb-6"><span className="text-4xl font-extrabold">9,90€</span><span className="text-violet-200">/mois</span></div>
              <ul className="space-y-3 mb-8 flex-1">
                {['QR codes illimites', 'Tous les modules V3', 'Hub + mode invite', 'Bouclier Avis', 'Annuaire artisans'].map((f) => (
                  <li key={f} className="flex items-center gap-3"><Check className="w-5 h-5 text-emerald-300 shrink-0" /><span className="text-violet-100 text-sm">{f}</span></li>
                ))}
              </ul>
              <button onClick={onGoToDashboard} className="w-full py-3 rounded-xl bg-white text-violet-600 font-semibold hover:bg-violet-50 transition-all shadow-lg">Essai 14 jours gratuit</button>
            </div>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="bg-white rounded-2xl p-8 h-full flex flex-col border border-gray-200 shadow-sm">
              <h3 className="text-xl font-bold mb-2 text-gray-900">Airbnb Pro</h3>
              <div className="mb-6"><span className="text-4xl font-extrabold text-gray-900">199€</span><span className="text-gray-400">/an</span></div>
              <ul className="space-y-3 mb-8 flex-1">
                {['QR codes illimites', 'Tous les modules V3', 'Marketplace locale', 'Packs B2B', 'Upselling automatique', 'API & webhooks'].map((f) => (
                  <li key={f} className="flex items-center gap-3"><Check className="w-5 h-5 text-emerald-500 shrink-0" /><span className="text-gray-600 text-sm">{f}</span></li>
                ))}
              </ul>
              <button onClick={onGoToDashboard} className="w-full py-3 rounded-xl border-2 border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all">Essai 14 jours gratuit</button>
            </div>
          </FadeIn>
        </div>
      </Section>

      {/* FAQ */}
      <Section className="bg-gray-50/50">
        <SectionTitle title="Questions frequentes" />
        <div className="max-w-3xl mx-auto">
          <FadeIn>
            <Accordion type="single" collapsible className="space-y-4">
              {[
                { q: 'Comment fonctionne QR Domotik ?', a: 'QR Domotik utilise des QR codes dynamiques lies a des modules configurables. Collez un QR code sur un objet, scannez-le avec votre telephone, et accedez instantanement a l\'information ou l\'action associee.' },
                { q: 'Mes invites doivent-ils installer une application ?', a: "Non, absolument pas ! Vos invites n'ont besoin que de l'appareil photo de leur telephone. Le QR code ouvre une page web mobile optimisee." },
                { q: "Puis-je modifier le contenu d'un QR code ?", a: 'Oui ! Contrairement aux QR codes classiques, les QR Domotik sont dynamiques. Vous pouvez modifier le contenu a tout moment depuis votre dashboard sans changer le QR code physique.' },
                { q: 'Le portier virtuel fonctionne-t-il quand je suis absent ?', a: "Oui, le portier virtuel affiche un statut 'Absent' et presente vos consignes personnalisees au visiteur. Vous recevez une notification a chaque sonnerie ou message." },
                { q: "Qu'est-ce que le Hub central ?", a: "Le Hub est un point d'acces unique qui regroupe tous vos QR codes en une seule page. Vos invites choisissent le mode Invite (modules publics) ou Famille (code PIN pour tous les modules)." },
                { q: "Qu'est-ce que le Marketplace V3 ?", a: 'Le Marketplace V3 connecte votre maison aux commercants et artisans de votre quartier. Promotions, ventes flash, coupons, et services a domicile, accessibles directement depuis vos QR codes.' },
                { q: 'Mes donnees sont-elles securisees ?', a: 'Absolument. Toutes les donnees sont chiffrees (SSL/TLS), hebergees en France (RGPD), et vous controlez la visibilite de chaque QR code.' },
              ].map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="bg-white border border-gray-200 rounded-2xl overflow-hidden px-6">
                  <AccordionTrigger className="text-left text-gray-900 hover:no-underline py-5">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-gray-500">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </FadeIn>
        </div>
      </Section>

      {/* CTA FINAL */}
      <section id="cta-final" className="bg-gradient-to-r from-violet-600 to-purple-600 py-20 px-4 md:px-8 scroll-mt-16">
        <FadeIn>
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-white">Pret a transformer votre maison ?</h2>
            <p className="text-white/80 text-lg mb-8">Rejoignez les 2 500+ foyers qui ont deja fait le choix de la simplicite.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={onGoToDashboard} className="px-8 py-4 rounded-xl bg-white text-violet-600 font-semibold hover:bg-violet-50 transition-all shadow-lg">Commencer gratuitement</button>
              <a href="https://qrdomotik.roomscan.pro" target="_blank" rel="noopener noreferrer" className="px-8 py-4 rounded-xl border-2 border-white text-white font-semibold hover:bg-white/10 transition-all">Voir la demo</a>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto bg-gray-900 border-t border-gray-800 py-12 md:py-16 px-4 md:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center"><QrCode className="w-5 h-5 text-white" /></div>
                <span className="font-bold text-lg text-white">QR Domotik</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">Transformez n&apos;importe quel objet en commande domotique grace a la puissance des QR codes.</p>
            </div>
            <div><h4 className="font-semibold mb-4 text-white">Produit</h4><ul className="space-y-2.5">{['Fonctionnalites', 'Hub Central', 'Modules', 'Packs', 'Prix', 'Marketplace'].map((l) => <li key={l}><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">{l}</a></li>)}</ul></div>
            <div><h4 className="font-semibold mb-4 text-white">Support</h4><ul className="space-y-2.5">{['Documentation', 'Contact', 'FAQ', 'Statut'].map((l) => <li key={l}><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">{l}</a></li>)}</ul></div>
            <div><h4 className="font-semibold mb-4 text-white">Legal</h4><ul className="space-y-2.5">{['CGU', 'Confidentialite', 'Mentions legales', 'Cookies'].map((l) => <li key={l}><a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">{l}</a></li>)}</ul></div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center"><p className="text-sm text-gray-500">© 2025 QR Domotik. Tous droits reserves.</p></div>
        </div>
      </footer>
    </div>
  );
}
