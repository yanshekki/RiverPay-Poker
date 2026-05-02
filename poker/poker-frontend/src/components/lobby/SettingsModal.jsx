import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Settings, Coins, Users, Clock, X, Pickaxe, Loader2 } from 'lucide-react';

export default function SettingsModal({ show, onClose, settings, onChange, onCreate, isCreating }) {
  const { t } = useTranslation();
  const blindPresets = [[10, 20], [50, 100], [100, 200]];
  const seatOptions = [2, 6, 8];
  const timeOptions = [15, 30];
  const isCustomBlind = !blindPresets.some(([sb, bb]) => settings.smallBlind === sb && settings.bigBlind === bb);
  const [customBlinds, setCustomBlinds] = useState({ sb: settings.smallBlind, bb: settings.bigBlind });

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
            className="glass-panel rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => !isCreating && onClose()} className="absolute top-6 right-6 text-neutral-500 hover:text-white transition-colors">
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Settings className="text-yellow-400" /> {t('settings.title')}
            </h2>

            <div className="space-y-6">
              {/* Blinds */}
              <div>
                <label className="text-sm text-neutral-400 mb-2 flex items-center gap-2"><Coins size={16} /> {t('settings.blinds')}</label>
                <div className="flex gap-2 mb-2">
                  {blindPresets.map(([sb, bb]) => (
                    <motion.button key={sb} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => onChange({ smallBlind: sb, bigBlind: bb })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all touch-target ${
                        !isCustomBlind && settings.smallBlind === sb
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 neon-emerald'
                          : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'
                      }`}>{sb} / {bb}</motion.button>
                  ))}
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      setCustomBlinds({ sb: settings.smallBlind, bb: settings.bigBlind });
                      onChange({ smallBlind: customBlinds.sb, bigBlind: customBlinds.bb });
                    }}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all touch-target ${
                      isCustomBlind ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 neon-emerald' : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'
                    }`}>自訂</motion.button>
                </div>
                {isCustomBlind && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="flex gap-2 items-center">
                    <div className="flex-1">
                      <label className="text-[10px] text-neutral-500">小盲 SB</label>
                      <input type="number" value={settings.smallBlind}
                        onChange={e => onChange({ smallBlind: Math.max(1, Number(e.target.value)), bigBlind: Math.max(Number(e.target.value) * 2, settings.bigBlind) })}
                        className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-bold outline-none focus:border-emerald-500"
                        min={1} />
                    </div>
                    <span className="text-neutral-500 mt-4">/</span>
                    <div className="flex-1">
                      <label className="text-[10px] text-neutral-500">大盲 BB</label>
                      <input type="number" value={settings.bigBlind}
                        onChange={e => onChange({ bigBlind: Math.max(settings.smallBlind * 2, Number(e.target.value)) })}
                        className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-white text-sm font-bold outline-none focus:border-emerald-500"
                        min={settings.smallBlind * 2} />
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Seats */}
              <div>
                <label className="text-sm text-neutral-400 mb-2 flex items-center gap-2"><Users size={16} /> {t('settings.seats')}</label>
                <div className="flex gap-2">
                  {seatOptions.map(num => (
                    <motion.button key={num} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => onChange({ maxPlayers: num })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all touch-target ${
                        settings.maxPlayers === num
                          ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400 neon-cyan'
                          : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'
                      }`}>{num} {t('settings.people')}</motion.button>
                  ))}
                </div>
              </div>

              {/* Time */}
              <div>
                <label className="text-sm text-neutral-400 mb-2 flex items-center gap-2"><Clock size={16} /> {t('settings.timeLimit')}</label>
                <div className="flex gap-2">
                  {timeOptions.map(time => (
                    <motion.button key={time} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={() => onChange({ turnTimer: time })}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all touch-target ${
                        settings.turnTimer === time
                          ? 'bg-fuchsia-500/20 border-fuchsia-500 text-fuchsia-400 neon-magenta'
                          : 'bg-white/5 border-white/10 text-neutral-400 hover:bg-white/10'
                      }`}>{time} {t('settings.seconds')}</motion.button>
                  ))}
                </div>
              </div>
            </div>

            <motion.button whileHover={!isCreating ? { scale: 1.02 } : {}} whileTap={!isCreating ? { scale: 0.98 } : {}}
              onClick={onCreate} disabled={isCreating}
              className={`w-full mt-8 py-4 rounded-xl text-lg font-bold flex justify-center items-center gap-2 touch-target ${
                isCreating ? 'bg-white/5 text-neutral-500 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white neon-emerald'
              }`}>
              {isCreating ? <><Loader2 className="animate-spin" size={20} /><span>...</span></> : <><Pickaxe size={20} /> {t('settings.confirm')}</>}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
