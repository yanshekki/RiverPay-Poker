import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

export default function DepositBar({ roomContract, isDepositing, onDeposit }) {
  const { t } = useTranslation();
  const amounts = [100, 500, 1000];

  return (
    <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      className="px-4 py-2 bg-emerald-900/20 border-b border-emerald-500/20 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
      <span className="text-xs sm:text-sm text-neutral-400">{t('game.depositPrompt')}</span>
      {amounts.map(amt => (
        <motion.button key={amt} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => onDeposit(amt)} disabled={isDepositing || !roomContract}
          className="px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30 transition-colors touch-target disabled:opacity-50">
          ${amt}
        </motion.button>
      ))}
      {isDepositing && <Loader2 className="animate-spin text-emerald-400" size={16} />}
    </motion.div>
  );
}
