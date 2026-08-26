'use client';

import { motion } from 'framer-motion';
import { BookOpen, Star } from 'lucide-react';
import {
  FloatingParticles,
  GradientBackground,
  GlassCard,
  AnimatedIcon,
  AnimatedTitle,
  BrandedFooter,
  StaggerList,
  StaggerItem,
} from '@/components/magic';

interface GuestbookEntry {
  name: string;
  message: string;
  date: string;
}

interface GuestbookDisplayV3Props {
  content: Record<string, any>;
  qrCodeId?: string;
  qrName?: string;
}

export default function GuestbookDisplayV3({ content, qrCodeId, qrName }: GuestbookDisplayV3Props) {
  const rawTitle: string = content?.title || 'Livre d\'or';
  const rawEntries: GuestbookEntry[] = Array.isArray(content?.entries)
    ? content.entries
    : [];

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <GradientBackground moduleType="guestbook">
      <FloatingParticles color="rgba(255,255,255,0.2)" count={20} />

      <div className="relative z-10 min-h-screen flex flex-col items-center px-4 py-8 pb-24">
        {/* Icon */}
        <AnimatedIcon delay={0}>
          <div className="w-20 h-20 rounded-full bg-violet-400/20 backdrop-blur-sm border border-white/20 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <BookOpen className="w-10 h-10 text-white" strokeWidth={1.8} />
          </div>
        </AnimatedIcon>

        {/* Title */}
        <AnimatedTitle delay={0.2}>
          <h1 className="text-3xl sm:text-4xl font-bold text-white text-center mt-5 drop-shadow-lg">
            {rawTitle}
          </h1>
        </AnimatedTitle>

        {/* Star decoration */}
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, type: 'spring', stiffness: 200 }}
          className="flex items-center gap-2 mt-3"
        >
          {[0, 1, 2].map((i) => (
            <Star
              key={i}
              className="w-4 h-4 text-amber-300/80 fill-amber-300/60"
              strokeWidth={0}
            />
          ))}
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
              {rawEntries.length === 0 ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                    className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4"
                  >
                    <BookOpen
                      className="w-8 h-8 text-white/30"
                      strokeWidth={1.5}
                    />
                  </motion.div>
                  <p className="text-white/50 text-center text-base">
                    Soyez le premier à laisser un message
                  </p>
                </div>
              ) : (
                <StaggerList>
                  <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
                    {rawEntries.map((entry, index) => (
                      <StaggerItem key={index}>
                        <motion.div
                          whileHover={{ scale: 1.01 }}
                          className="bg-white/5 rounded-2xl p-4 border border-white/10"
                        >
                          {/* Name + Date row */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                                <span className="text-white text-sm font-bold">
                                  {entry.name?.charAt(0)?.toUpperCase() || '?'}
                                </span>
                              </div>
                              <span className="text-white font-bold text-base">
                                {entry.name || 'Anonyme'}
                              </span>
                            </div>
                            {entry.date && (
                              <span className="text-white/40 text-xs">
                                {formatDate(entry.date)}
                              </span>
                            )}
                          </div>
                          {/* Message */}
                          <p className="text-white/80 text-sm leading-relaxed pl-10">
                            {entry.message}
                          </p>
                        </motion.div>
                      </StaggerItem>
                    ))}
                  </div>
                </StaggerList>
              )}
            </div>
          </GlassCard>
        </motion.div>
      </div>

      <BrandedFooter delay={1} />
    </GradientBackground>
  );
}
