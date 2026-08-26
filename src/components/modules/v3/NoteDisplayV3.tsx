'use client';

import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import {
  FloatingParticles,
  GradientBackground,
  GlassCard,
  AnimatedIcon,
  AnimatedTitle,
  BrandedFooter,
  PageTransition,
} from '@/components/magic';

interface NoteDisplayV3Props {
  content: Record<string, any>;
  qrCodeId?: string;
  qrName?: string;
}

export default function NoteDisplayV3({ content }: NoteDisplayV3Props) {
  const title: string = content?.title || 'Note';
  const body: string = content?.body || '';
  const isEmpty = !body.trim();

  return (
    <PageTransition>
      <GradientBackground moduleType="note">
        <FloatingParticles color="rgba(255,255,255,0.2)" count={12} />

        <div className="relative z-10 min-h-screen flex flex-col items-center px-4 py-8 pb-24">
          {/* Icon */}
          <AnimatedIcon delay={0}>
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg shadow-yellow-500/20">
              <FileText className="w-10 h-10 text-white" strokeWidth={1.8} />
            </div>
          </AnimatedIcon>

          {/* Title */}
          <AnimatedTitle delay={0.15}>
            <h1 className="text-3xl sm:text-4xl font-bold text-white text-center mt-5 drop-shadow-lg">
              {title}
            </h1>
          </AnimatedTitle>

          {/* Note Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease: 'easeOut' }}
            className="w-full max-w-lg mt-8"
          >
            <GlassCard>
              <div className="bg-white/5 rounded-2xl p-6">
                {isEmpty ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                      className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4"
                    >
                      <FileText className="w-8 h-8 text-white/30" strokeWidth={1.5} />
                    </motion.div>
                    <p className="text-white/50 text-center text-base sm:text-lg">
                      Aucune note
                    </p>
                  </div>
                ) : (
                  <div className={`max-h-[60vh] overflow-y-auto custom-scrollbar pr-1`}>
                    <p className="text-white text-base sm:text-lg leading-relaxed whitespace-pre-wrap">
                      {body}
                    </p>
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>

          {/* Subtle decorative corner accents */}
          {!isEmpty && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="mt-6 flex items-center gap-2"
            >
              <div className="w-8 h-px bg-white/20" />
              <FileText className="w-3.5 h-3.5 text-white/20" strokeWidth={1.5} />
              <div className="w-8 h-px bg-white/20" />
            </motion.div>
          )}
        </div>

        {/* Footer */}
        <BrandedFooter delay={0.8} />
      </GradientBackground>
    </PageTransition>
  );
}
