import React, { useState } from 'react';
import { ShieldCheck, Menu, Coins, ArrowLeft, Share2, ExternalLink, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import VoiceChat from '../voice/VoiceChat';
import LanguageSwitcher from '../language/LanguageSwitcher';

const EXPLORER_URL = 'https://snowtrace.io/address';

function copyToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  } else {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  }
}

export default function Header({ roomId, gameState, roomContract, chips, onLeave, onMenuToggle, voiceRoomId }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const url = window.location.href;
    copyToClipboard(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

        {/* Share button */}
        <button
          onClick={handleShare}
          className="p-2 rounded-xl text-neutral-400 hover:text-rp-cyan hover:bg-white/10 transition-colors touch-target relative"
          title="Copy room link"
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Check size={18} className="text-rp-cyan" />
              </motion.div>
            ) : (
              <motion.div key="share" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Share2 size={18} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>

        <VoiceChat roomId={voiceRoomId} />

        {/* Contract address — clickable link to SnowTrace */}
        {roomContract && (
          <div className="hidden md:flex items-center gap-1 text-xs bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <ShieldCheck size={12} className="text-rp-light" />
            <a
              href={`${EXPLORER_URL}/${roomContract}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-neutral-400 hover:text-rp-cyan transition-colors flex items-center gap-1"
              title="View on SnowTrace"
            >
              {roomContract.substring(0, 6)}...{roomContract.substring(38)}
              <ExternalLink size={10} />
            </a>
          </div>
        )}

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
