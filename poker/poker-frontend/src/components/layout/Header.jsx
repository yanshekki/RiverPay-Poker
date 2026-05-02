import React from 'react';
import { ShieldCheck, Menu, Coins, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import VoiceChat from '../voice/VoiceChat';
import LanguageSwitcher from '../language/LanguageSwitcher';

export default function Header({ roomId, gameState, roomContract, chips, onLeave, onMenuToggle, voiceRoomId }) {
  const { t } = useTranslation();

  return (
    <header className="flex justify-between items-center px-3 sm:px-4 py-2 sm:py-3 glass-panel border-b border-white/5 z-10">
      <div className="flex items-center gap-2 sm:gap-3">
        <button onClick={onLeave} className="text-neutral-400 hover:text-rp-light transition-colors touch-target" title="Leave">
          <ArrowLeft size={20} />
        </button>
        <div className="hidden sm:block">
          <h1 className="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-rp-cyan to-rp-light">
            RiverPay
          </h1>
          <p className="text-[10px] text-neutral-500 font-mono">
            {t('game.room')}: {roomId} · {gameState.state}
          </p>
        </div>
        <div className="sm:hidden">
          <p className="text-xs font-bold text-rp-cyan">RiverPay</p>
          <p className="text-[10px] text-neutral-500 font-mono">{roomId}</p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <LanguageSwitcher size={16} />
        <VoiceChat roomId={voiceRoomId} />

        <div className="hidden md:flex items-center gap-1 text-xs text-neutral-500 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
          <ShieldCheck size={12} className="text-rp-light" />
          <span className="font-mono">{roomContract?.substring(0, 8)}...</span>
        </div>

        <motion.div
          animate={chips > 0 ? { boxShadow: ['0 0 5px rgba(0,180,216,0.2)', '0 0 15px rgba(0,180,216,0.4)', '0 0 5px rgba(0,180,216,0.2)'] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
          className="bg-white/5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-2xl border border-rp-cyan/30 flex items-center gap-2"
        >
          <div className="flex flex-col items-end">
            <span className="text-[9px] sm:text-[10px] text-neutral-500">{t('game.chips')}</span>
            <span className="text-base sm:text-xl font-extrabold text-rp-light tabular-nums">
              ${chips?.toLocaleString() || '0'}
            </span>
          </div>
          <Coins size={20} className="text-rp-cyan" />
        </motion.div>

        <button onClick={onMenuToggle} className="md:hidden p-2 text-neutral-400 hover:text-white touch-target">
          <Menu size={20} />
        </button>
      </div>
    </header>
  );
}
