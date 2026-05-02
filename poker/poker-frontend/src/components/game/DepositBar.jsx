import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

export default function DepositBar({ roomContract, isDepositing, onDeposit }) {
  const { t } = useTranslation();
  const [customAmount, setCustomAmount] = useState('');
  const presets = [100, 500, 1000];

  const handleCustom = () => {
    const amt = Number(customAmount);
    if (amt > 0) { onDeposit(amt); setCustomAmount(''); }
  };

  return (
    <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
      className="px-4 py-2 bg-emerald-900/20 border-b border-emerald-500/20 flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
      <span className="text-xs sm:text-sm text-neutral-400">{t('game.depositPrompt')}</span>
      {presets.map(amt => (
        <motion.button key={amt} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => onDeposit(amt)} disabled={isDepositing || !roomContract}
          className="px-3 sm:px-4 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30 transition-colors touch-target disabled:opacity-50">
          ${amt}
        </motion.button>
      ))}
      <div className="flex items-center gap-1">
        <input type="number" value={customAmount}
          onChange={e => setCustomAmount(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCustom()}
          placeholder="自訂"
          className="w-16 sm:w-20 bg-white/10 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs sm:text-sm font-bold outline-none focus:border-emerald-500 placeholder-neutral-600"
          min={1} disabled={isDepositing || !roomContract} />
        <motion.button whileTap={{ scale: 0.95 }}
          onClick={handleCustom}
          disabled={isDepositing || !roomContract || !customAmount}
          className="px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold bg-emerald-500/30 border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/40 transition-colors touch-target disabled:opacity-50">
          Go
        </motion.button>
      </div>
      {isDepositing && <Loader2 className="animate-spin text-emerald-400" size={16} />}
    </motion.div>
  );
}
