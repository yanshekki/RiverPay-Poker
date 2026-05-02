import React from 'react';
import { motion } from 'framer-motion';

const SUIT_SYMBOL = { H: '♥', D: '♦', C: '♣', S: '♠' };

function parseCard(cardStr) {
  if (!cardStr || cardStr === 'hidden') return null;
  return { rank: cardStr.slice(0, -1), suit: cardStr.slice(-1) };
}

export default function PlayingCard({ card, small, dealt, hidden }) {
  const sizeClass = small
    ? 'w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-16'
    : 'w-12 h-18 sm:w-14 sm:h-20 md:w-16 md:h-24';

  if (!card || hidden) {
    return (
      <motion.div
        initial={dealt ? { y: -60, rotate: -15, opacity: 0, scale: 0.6 } : false}
        animate={{ y: 0, rotate: 0, opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className={`${sizeClass} rounded-lg border-2 border-cyan-500/30 shadow-lg flex items-center justify-center bg-gradient-to-br from-blue-950 to-indigo-950`}
      >
        <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full border border-cyan-500/20" />
      </motion.div>
    );
  }
  const parsed = typeof card === 'string' ? parseCard(card) : card;
  if (!parsed) return null;

  const isRed = parsed.suit === 'H' || parsed.suit === 'D';
  const textSize = small ? 'text-[10px] sm:text-xs' : 'text-sm sm:text-lg font-bold';
  const suitSize = small ? 'text-xs sm:text-sm' : 'text-base sm:text-xl';

  return (
    <motion.div
      initial={dealt ? { y: -60, rotate: -15, opacity: 0, scale: 0.6 } : false}
      animate={{ y: 0, rotate: 0, opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      whileHover={{ y: -8, scale: 1.05, zIndex: 50 }}
      className={`${sizeClass} ${textSize} bg-white rounded-lg shadow-xl flex flex-col items-center justify-center font-bold border border-neutral-200 cursor-default`}
    >
      <span className={isRed ? 'text-red-600' : 'text-gray-900'}>{parsed.rank}</span>
      <span className={`${suitSize} ${isRed ? 'text-red-600' : 'text-gray-900'}`}>{SUIT_SYMBOL[parsed.suit]}</span>
    </motion.div>
  );
}
