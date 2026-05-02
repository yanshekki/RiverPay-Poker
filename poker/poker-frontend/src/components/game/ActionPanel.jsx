import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Loader2, Zap } from 'lucide-react';

export default function ActionPanel({ gameState, isMyTurn, myPlayer, callAmount, canCheck, onAction }) {
  const { t } = useTranslation();
  const [showRaise, setShowRaise] = React.useState(false);
  const [raiseAmount, setRaiseAmount] = React.useState(50);
  const activeCount = gameState.players?.filter(p => p).length || 0;

  if (gameState.state === 'WAITING') {
    return (
      <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 2 }}
        className="text-neutral-500 text-xs sm:text-sm">
        {activeCount < 2 ? t('game.waitingPlayers') : t('game.waitingDeposit')}
      </motion.p>
    );
  }

  if (gameState.state === 'SHOWDOWN') {
    return (
      <motion.p animate={{ opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}
        className="text-yellow-400 text-xs sm:text-sm font-bold flex items-center gap-1">
        <Zap size={14} /> {t('game.settling')}
      </motion.p>
    );
  }

  if (!isMyTurn) {
    return myPlayer ? (
      <motion.p animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ repeat: Infinity, duration: 2 }}
        className="text-neutral-500 text-xs sm:text-sm flex items-center gap-2">
        <Loader2 className="animate-spin" size={14} /> {t('game.waitingOpponent')}
      </motion.p>
    ) : (
      <p className="text-neutral-500 text-xs sm:text-sm">{t('game.spectating')}</p>
    );
  }

  const btn = 'px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-colors touch-target';

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-center">
      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        onClick={() => onAction('fold')}
        className={`${btn} bg-white/5 hover:bg-rose-900/20 border border-white/10 hover:border-rose-500`}>
        {t('game.fold')}
      </motion.button>

      {canCheck ? (
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => onAction('check')}
          className={`${btn} bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-400`}>
          {t('game.check')}
        </motion.button>
      ) : (
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => onAction('call')}
          className={`${btn} bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 text-cyan-400`}>
          {t('game.call')} ${callAmount}
        </motion.button>
      )}

      {showRaise ? (
        <div className="flex items-center gap-1 bg-white/5 rounded-xl border border-yellow-400/50 px-2">
          <span className="text-neutral-400 text-[10px] sm:text-xs">Raise $</span>
          <input type="number" value={raiseAmount} onChange={e => setRaiseAmount(Number(e.target.value))}
            className="w-12 sm:w-16 bg-transparent text-white text-sm font-bold text-center outline-none py-2" min={1} />
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => onAction('raise', raiseAmount)}
            className="px-3 py-2 bg-yellow-400 hover:bg-yellow-300 rounded-lg text-xs sm:text-sm font-bold text-black touch-target">
            {t('game.raise')}
          </motion.button>
          <button onClick={() => setShowRaise(false)} className="px-1.5 py-2 text-neutral-400 hover:text-white text-sm">✕</button>
        </div>
      ) : (
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => {
            const d = (callAmount || gameState.currentHighestBet || 0) + (gameState.currentHighestBet || 20);
            setRaiseAmount(d); setShowRaise(true);
          }}
          className={`${btn} bg-yellow-400/20 hover:bg-yellow-400/30 border border-yellow-400/50 text-yellow-400 neon-gold`}>
          {t('game.raise')}
        </motion.button>
      )}
    </div>
  );
}
