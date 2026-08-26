'use client';

import { motion } from 'framer-motion';
import { Pill, Heart } from 'lucide-react';
import {
  FloatingParticles,
  GradientBackground,
  GlassCard,
  AnimatedIcon,
  AnimatedTitle,
  BrandedFooter,
} from '@/components/magic';

interface MedicationDisplayV3Props {
  content: Record<string, any>;
  qrCodeId?: string;
  qrName?: string;
}

export default function MedicationDisplayV3({ content, qrCodeId, qrName }: MedicationDisplayV3Props) {
  const rawTitle: string = content?.title || 'Médicament';
  const rawBody: string = content?.body || '';

  return (
    <GradientBackground moduleType="medication">
      <FloatingParticles color="rgba(255,255,255,0.2)" count={18} />

      <div className="relative z-10 min-h-screen flex flex-col items-center px-4 py-8 pb-24">
        {/* Icon */}
        <AnimatedIcon delay={0}>
          <div className="w-20 h-20 rounded-full bg-pink-400/20 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Pill className="w-10 h-10 text-white" strokeWidth={1.8} />
          </div>
        </AnimatedIcon>

        {/* Title */}
        <AnimatedTitle delay={0.2}>
          <h1 className="text-3xl sm:text-4xl font-bold text-white text-center mt-5 drop-shadow-lg">
            {rawTitle}
          </h1>
        </AnimatedTitle>

        {/* Heart decoration */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 200 }}
          className="mt-3"
        >
          <Heart className="w-5 h-5 text-pink-200/60 fill-pink-200/40" strokeWidth={0} />
        </motion.div>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6, ease: 'easeOut' }}
          className="w-full max-w-lg mt-6"
        >
          <GlassCard>
            <div className="p-5 sm:p-6">
              {/* Medication name big */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.55, duration: 0.4 }}
                className="mb-4"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Pill className="w-5 h-5 text-white" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-white">
                    {rawTitle}
                  </h2>
                </div>
              </motion.div>

              {/* Divider */}
              <div className="h-px bg-white/10 mb-4" />

              {/* Dosage / Instructions */}
              {rawBody ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65, duration: 0.5 }}
                  className="max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar"
                >
                  <p className="text-white/90 text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
                    {rawBody}
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.65 }}
                  className="py-6 text-center"
                >
                  <p className="text-white/50 text-base">
                    Aucune instruction disponible
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
