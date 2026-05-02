import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import PlayingCard from './PlayingCard';

export default function MobilePlayerRow({ player, isMe, isTurn, isFolded, handCards }) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-2xl border transition-all ${
        isTurn ? 'border-yellow-400 neon-gold bg-yellow-400/5' :
        isFolded ? 'border-white/5 bg-white/5 opacity-50' :
        'border-white/10 bg-white/5'
      }`}
    >
      <div className="flex -space-x-3 shrink-0">
        {handCards?.slice(0, 2).map((c, i) => (
          <PlayingCard key={i} card={c} small hidden={c === 'hidden'} />
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs sm:text-sm font-mono truncate ${isMe ? 'text-yellow-400' : 'text-neutral-300'}`}>
          {isMe ? `👤 ${t('game.you')}` : `${player.address?.substring(0, 6)}...`}
        </p>
        <p className="text-xs text-emerald-400 font-bold">${player.chips?.toLocaleString()}</p>
      </div>
      <div className="text-right shrink-0">
        {player.bet > 0 && <span className="text-xs text-yellow-400 font-bold">Bet ${player.bet}</span>}
        {player.lastAction && (
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase ml-1 ${
            player.isFolded ? 'bg-white/10 text-neutral-500' : 'bg-yellow-400/20 text-yellow-400'
          }`}>{player.lastAction}</span>
        )}
      </div>
    </motion.div>
  );
}
