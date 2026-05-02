import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { X, ExternalLink, Share2 } from 'lucide-react';

export default function SideMenu({ show, onClose, roomId, gameState, roomContract, players, walletAddress }) {
  const { t } = useTranslation();

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
    } else {
      const el = document.createElement('textarea');
      el.value = url; document.body.appendChild(el);
      el.select(); document.execCommand('copy'); document.body.removeChild(el);
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="fixed inset-y-0 right-0 w-72 max-w-[85vw] bg-[#0a0a0a] border-l border-white/10 z-50 p-6 overflow-y-auto safe-top safe-bottom"
          >
            <button onClick={onClose} className="absolute top-4 right-4 text-neutral-400 hover:text-white">
              <X size={24} />
            </button>

            <h3 className="text-lg font-bold text-rp-cyan mb-4">{t('game.gameInfo')}</h3>
            <div className="space-y-3 text-sm">
              <Row label="Room" value={roomId} />
              <Row label={t('game.state')} value={gameState.state} color="text-rp-cyan" />
              <Row label={t('game.pot')} value={`$${gameState.pot?.toLocaleString()}`} color="text-rp-cyan" />
              <Row label={t('game.players')} value={`${players?.filter(p => p).length || 0} / ${players?.length || 0}`} />
              {roomContract && (
                <div className="flex justify-between">
                  <span className="text-neutral-400">{t('game.contract')}</span>
                  <a href={`https://snowtrace.io/address/${roomContract}`} target="_blank" rel="noopener noreferrer"
                    className="text-rp-cyan font-mono text-xs flex items-center gap-1 hover:underline">
                    {roomContract.substring(0, 8)}...<ExternalLink size={10} />
                  </a>
                </div>
              )}
            </div>

            {/* Share room link */}
            <button
              onClick={handleShare}
              className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rp-cyan/10 border border-rp-cyan/20 text-rp-cyan text-sm font-bold hover:bg-rp-cyan/20 transition-colors touch-target"
            >
              <Share2 size={14} /> Copy Room Link
            </button>

            <div className="mt-6 pt-4 border-t border-white/10">
              <h4 className="text-xs text-neutral-500 mb-2">{t('game.playerList')}</h4>
              {players?.filter(p => p).map((p, i) => (
                <div key={i} className="flex justify-between items-center py-1.5 text-sm">
                  <span className={`font-mono ${p.address === walletAddress ? 'text-rp-cyan' : 'text-neutral-300'}`}>
                    {p.address?.substring(0, 6)}...
                  </span>
                  <span className="text-rp-light">${p.chips?.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value, color = 'text-white', mono }) {
  return (
    <div className="flex justify-between">
      <span className="text-neutral-400">{label}</span>
      <span className={`${color} ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}
