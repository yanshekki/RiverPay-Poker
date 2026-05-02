import React from 'react';
import { motion } from 'framer-motion';
import PlayingCard from './PlayingCard';

export default function CommunityCards({ cards = [] }) {
  return (
    <div className="flex gap-1 sm:gap-2 md:gap-3 z-10">
      {cards.map((card, i) => (
        <motion.div key={i}
          initial={{ y: -40, opacity: 0, rotate: -15 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          transition={{ delay: i * 0.12, type: 'spring', stiffness: 150 }}
        >
          <PlayingCard card={card} dealt />
        </motion.div>
      ))}
      {Array.from({ length: Math.max(0, 5 - (cards?.length || 0)) }).map((_, i) => (
        <div key={`empty-${i}`}
          className="w-12 h-18 sm:w-14 sm:h-20 md:w-16 md:h-24 rounded-lg border border-dashed border-white/10 bg-white/5"
        />
      ))}
    </div>
  );
}
