import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import CommunityCards from './CommunityCards';

export default function PokerTable({ gameState, children }) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="felt-table w-full max-w-[360px] sm:max-w-[500px] md:max-w-[700px] lg:max-w-[850px] aspect-[2/1.2] rounded-[40px] sm:rounded-[60px] md:rounded-[100px] border-4 sm:border-6 md:border-8 border-amber-900/50 shadow-[0_0_60px_rgba(16,185,129,0.1),inset_0_0_80px_rgba(0,0,0,0.5)] relative flex items-center justify-center"
    >
      <div className="absolute inset-4 sm:inset-6 md:inset-8 rounded-[30px] sm:rounded-[50px] md:rounded-[90px] border border-white/5" />
      <CommunityCards cards={gameState.communityCards} />
      <motion.div
        animate={{ scale: [1, 1.03, 1] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="absolute top-[55%] sm:top-[58%] bg-black/60 backdrop-blur-md px-4 sm:px-6 py-1.5 sm:py-2 rounded-full border border-yellow-400/30"
      >
        <span className="text-yellow-400 font-bold text-xs sm:text-sm md:text-lg">
          {t('game.pot')}: ${gameState.pot?.toLocaleString() || '0'}
        </span>
      </motion.div>
      {children}
    </motion.div>
  );
}
