import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Trophy } from 'lucide-react';

export default function WinBanner({ data, walletAddress }) {
  const { t } = useTranslation();
  const isMe = data?.address === walletAddress;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="absolute top-24 sm:top-32 left-0 right-0 z-50 flex justify-center pointer-events-none px-4"
    >
      <div className="border-gradient rounded-2xl">
        <div className="bg-[#0a0a0a]/95 px-6 sm:px-10 py-4 sm:py-5 rounded-2xl flex flex-col items-center backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-1">
            <Trophy className="text-rp-cyan" size={28} />
            <span className="text-xl sm:text-2xl font-black shimmer-text">
              {isMe ? t('game.youWon') : t('game.winnerAnnounce')}
            </span>
            <Trophy className="text-rp-cyan" size={28} />
          </div>
          <p className="text-white font-mono text-xs sm:text-sm mb-1">
            {data.address?.substring(0, 8)}... {t('game.winsPot')}
          </p>
          <p className="text-xs sm:text-sm text-neutral-400">
            Pot: ${data.potAmount?.toLocaleString()} · {t('game.netPayout')}: <span className="text-rp-light font-bold">${data.netAmount?.toLocaleString()}</span>
          </p>
          <p className="text-lg sm:text-xl font-bold text-rp-cyan mt-1">{t('game.handName')}：{data.handName}</p>
        </div>
      </div>
    </motion.div>
  );
}
