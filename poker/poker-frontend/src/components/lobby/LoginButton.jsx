import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Wallet, LogOut, Sparkles, Loader2 } from 'lucide-react';

export default function LoginButton({ isConnected, isLoggingIn, loadingText, onConnect, onLogin, onDisconnect }) {
  const { t } = useTranslation();

  if (!isConnected) {
    return (
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={onConnect}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-lg font-bold transition-all bg-gradient-to-r from-cyan-400 to-blue-600 text-black neon-cyan touch-target"
      >
        <Wallet size={24} /> {t('lobby.connectWallet')}
      </motion.button>
    );
  }

  return (
    <div className="space-y-4 w-full">
      <motion.button whileHover={!isLoggingIn ? { scale: 1.02 } : {}} whileTap={!isLoggingIn ? { scale: 0.98 } : {}}
        onClick={onLogin} disabled={isLoggingIn}
        className="w-full flex items-center justify-center gap-3 py-4 rounded-xl text-lg font-bold transition-all bg-gradient-to-r from-yellow-400 to-yellow-600 text-black neon-gold touch-target"
      >
        {isLoggingIn ? <><Loader2 className="animate-spin" size={24} /><span>{loadingText}</span></> : <><Sparkles size={20} /> {t('lobby.signLogin')}</>}
      </motion.button>
      <button onClick={onDisconnect} className="w-full text-center text-neutral-500 hover:text-neutral-300 text-sm transition-colors">
        {t('lobby.changeWallet')}
      </button>
    </div>
  );
}
