import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import PlayingCard from './PlayingCard';

export default function PlayerBadge({ player, isMe, isTurn, handCards, isFolded }) {
  const { t } = useTranslation();

  return (
    <div className={`relative flex flex-col items-center transition-all duration-300 ${isFolded ? 'opacity-40' : ''}`}>
      <div className="flex -space-x-4 sm:-space-x-6 mb-[-16px] sm:mb-[-20px] relative z-10">
        {handCards?.slice(0, 2).map((card, i) => (
          <motion.div key={i}
            initial={{ y: 30, opacity: 0, rotate: i === 0 ? -10 : 10 }}
            animate={{ y: 0, opacity: 1, rotate: i === 0 ? -15 : 15 }}
            transition={{ delay: i * 0.15, type: 'spring', stiffness: 100 }}
            whileHover={{ y: -10, rotate: i === 0 ? -5 : 5, zIndex: 50 }}
          >
            <PlayingCard card={card} hidden={card === 'hidden'} />
          </motion.div>
        ))}
      </div>

      <motion.div
        animate={isTurn && !isFolded ? {
          boxShadow: ['0 0 8px rgba(255,215,0,0.3)', '0 0 20px rgba(255,215,0,0.6)', '0 0 8px rgba(255,215,0,0.3)'],
        } : {}}
        transition={{ repeat: Infinity, duration: 2 }}
        className={`w-24 sm:w-28 md:w-32 p-2 sm:p-3 rounded-xl sm:rounded-2xl flex flex-col items-center justify-center text-[10px] sm:text-xs border-2 relative z-20 ${
          isFolded ? 'border-white/10 bg-black/40' :
          isTurn ? 'border-rp-cyan bg-black/60' : 'border-white/10 bg-black/50'
        }`}
      >
        {player.bet > 0 && (
          <div className="absolute -top-5 bg-rp-cyan text-black px-2 sm:px-3 py-0.5 rounded-full font-bold text-[10px] sm:text-xs">
            ${player.bet}
          </div>
        )}
        <span className={`truncate w-full text-center font-mono ${isMe ? 'text-rp-cyan' : 'text-neutral-300'}`}>
          {isMe ? t('game.you') : `${player.address?.substring(0, 6)}...`}
        </span>
        <div className="w-full h-px bg-white/5 my-1" />
        <span className="text-rp-light font-bold text-sm sm:text-base tabular-nums">
          ${player.chips?.toLocaleString() || '0'}
        </span>
      </motion.div>

      {player.lastAction && !isTurn && (
        <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
          className={`absolute -bottom-3 px-2 sm:px-3 py-0.5 rounded-full text-[8px] sm:text-[10px] font-bold uppercase tracking-wider ${
            isFolded ? 'bg-white/10 text-neutral-500' : 'bg-rp-cyan/20 text-rp-cyan'
          }`}
        >
          {player.lastAction}
        </motion.div>
      )}
    </div>
  );
}
