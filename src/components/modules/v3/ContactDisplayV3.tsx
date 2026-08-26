'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Mail, Copy, Check } from 'lucide-react';
import {
  FloatingParticles,
  GradientBackground,
  GlassCard,
  AnimatedIcon,
  AnimatedTitle,
  BrandedFooter,
} from '@/components/magic';

interface ContactDisplayV3Props {
  content: Record<string, any>;
  qrCodeId?: string;
  qrName?: string;
}

export default function ContactDisplayV3({ content, qrCodeId, qrName }: ContactDisplayV3Props) {
  const rawName: string = content?.name || '';
  const rawPhone: string = content?.phone || '';
  const rawEmail: string = content?.email || '';

  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = useCallback(async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // silent fallback
    }
  }, []);

  return (
    <GradientBackground moduleType="contact">
      <FloatingParticles color="rgba(255,255,255,0.2)" count={18} />

      <div className="relative z-10 min-h-screen flex flex-col items-center px-4 py-8 pb-24">
        {/* Icon */}
        <AnimatedIcon delay={0}>
          <div className="w-20 h-20 rounded-full bg-sky-400/20 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg shadow-sky-500/20">
            <User className="w-10 h-10 text-white" strokeWidth={1.8} />
          </div>
        </AnimatedIcon>

        {/* Title */}
        <AnimatedTitle delay={0.2}>
          <h1 className="text-3xl sm:text-4xl font-bold text-white text-center mt-5 drop-shadow-lg">
            {rawName || 'Contact'}
          </h1>
        </AnimatedTitle>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-lg mt-6"
        >
          <GlassCard>
            <div className="p-5 sm:p-6 space-y-4">
              {/* Phone row */}
              {rawPhone && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.55, duration: 0.4 }}
                >
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => copyToClipboard(rawPhone, 'phone')}
                    className="w-full bg-white/5 rounded-2xl p-4 flex items-center gap-4 active:bg-white/10 transition-colors"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="w-5 h-5 text-white" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-0.5">
                        Téléphone
                      </p>
                      <p className="text-white text-base sm:text-lg font-semibold truncate">
                        {rawPhone}
                      </p>
                    </div>
                    <AnimatePresence mode="wait">
                      {copiedField === 'phone' ? (
                        <motion.span
                          key="copied"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="text-white text-sm font-medium flex items-center gap-1 flex-shrink-0"
                        >
                          <Check className="w-4 h-4" strokeWidth={2.5} />
                          Copié !
                        </motion.span>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex-shrink-0"
                        >
                          <Copy className="w-5 h-5 text-white/40" strokeWidth={1.5} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.div>
              )}

              {/* Email row */}
              {rawEmail && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.65, duration: 0.4 }}
                >
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => copyToClipboard(rawEmail, 'email')}
                    className="w-full bg-white/5 rounded-2xl p-4 flex items-center gap-4 active:bg-white/10 transition-colors"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-white" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-0.5">
                        Email
                      </p>
                      <p className="text-white text-base sm:text-lg font-semibold truncate">
                        {rawEmail}
                      </p>
                    </div>
                    <AnimatePresence mode="wait">
                      {copiedField === 'email' ? (
                        <motion.span
                          key="copied"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          className="text-white text-sm font-medium flex items-center gap-1 flex-shrink-0"
                        >
                          <Check className="w-4 h-4" strokeWidth={2.5} />
                          Copié !
                        </motion.span>
                      ) : (
                        <motion.div
                          key="copy"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex-shrink-0"
                        >
                          <Copy className="w-5 h-5 text-white/40" strokeWidth={1.5} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </motion.div>
              )}

              {/* Empty state */}
              {!rawPhone && !rawEmail && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.55 }}
                  className="py-12 flex flex-col items-center justify-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4"
                  >
                    <User className="w-8 h-8 text-white/30" strokeWidth={1.5} />
                  </motion.div>
                  <p className="text-white/50 text-center text-base">
                    Aucune information de contact
                  </p>
                </motion.div>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>

      <BrandedFooter delay={1} />
    </GradientBackground>
  );
}
