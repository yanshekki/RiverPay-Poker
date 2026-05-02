import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Settings, Coins, Users, Clock, X, Pickaxe, Loader2 } from 'lucide-react';

export default function SettingsModal({ show, onClose, settings, onChange, onCreate, isCreating }) {
  const { t } = useTranslation();
  const blindOptions = [[10, 20], [50, 100], [100, 200]];
  const seatOptions = [2, 6, 8];
  const timeOptions = [15, 30];

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => !isCreating && onClose()}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }}
            className="glass-panel rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => !isCreating && onClose()} className="absolute top-6 right-6 text-neutral-500 hover:text-white transition-colors">
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Settings className="text-yellow-400" /> {t('settings.title')}
            </h2>

            <div className="space-y-6">
              <Section label={<><Coins size={16} /> {t('settings.blinds')}</>} options={blindOptions} current={[settings.smallBlind, settings.bigBlind]}
                isSelected={o => settings.smallBlind === o[0]} onSelect={o => onChange({ smallBlind: o[0], bigBlind: o[1] })}
                format={o => `${o[0]} / ${o[1]}`} color="emerald" />
              <Section label={<><Users size={16} /> {t('settings.seats')}</>} options={seatOptions} current={settings.maxPlayers}
                isSelected={o => settings.maxPlayers === o} onSelect={o => onChange({ maxPlayers: o })} format={o => `${o} ${t('settings.people')}`} color="cyan" />
              <Section label={<><Clock size={16} /> {t('settings.timeLimit')}</>} options={timeOptions} current={settings.turnTimer}
                isSelected={o => settings.turnTimer === o} onSelect={o => onChange({ turnTimer: o })} format={o => `${o} ${t('settings.seconds')}`} color="magenta" />
            </div>

            <motion.button whileHover={!isCreating ? { scale: 1.02 } : {}} whileTap={!isCreating ? { scale: 0.98 } : {}}
              onClick={onCreate} disabled={isCreating}
              className={`w-full mt-8 py-4 rounded-xl text-lg font-bold flex justify-center items-center gap-2 touch-target ${
                isCreating ? 'bg-white/5 text-neutral-500 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white neon-emerald'
              }`}>
              {isCreating ? <><Loader2 className="animate-spin" size={20} /><span>{t('game.depositing')}...</span></> : <><Pickaxe size={20} /> {t('settings.confirm')}</>}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Section({ label, options, isSelected, onSelect, format, color }) {
  const colors = {
    emerald: { sel: 'bg-emerald-500/20 border-emerald-500 text-emerald-400 neon-emerald', unsel: 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10' },
    cyan: { sel: 'bg-cyan-500/20 border-cyan-500 text-cyan-400 neon-cyan', unsel: 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10' },
    magenta: { sel: 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-400 neon-magenta', unsel: 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10' },
  };
  const c = colors[color];

  return (
    <div>
      <label className="text-sm text-neutral-400 mb-2 flex items-center gap-2">{label}</label>
      <div className="flex gap-2">
        {options.map(o => (
          <motion.button key={String(o)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => onSelect(o)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all touch-target ${isSelected(o) ? c.sel : c.unsel}`}>
            {format(o)}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
