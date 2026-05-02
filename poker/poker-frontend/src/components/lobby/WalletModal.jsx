import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Wallet, X } from 'lucide-react';
import { useWeb3Modal } from '@web3modal/wagmi/react';

export default function WalletModal({ show, onClose }) {
  const { t } = useTranslation();
  const { open } = useWeb3Modal();

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="glass-panel rounded-3xl p-6 max-w-sm w-full shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Wallet className="text-rp-cyan" size={24} />
                {t('wallet.connectTitle')}
              </h2>
              <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <p className="text-neutral-400 text-sm mb-6">{t('wallet.connectDescription')}</p>

            {/* Desktop wallets quick-connect */}
            <div className="space-y-3">
              {['MetaMask', 'Trust Wallet', 'Coinbase', 'Rabby'].map(name => (
                <motion.button key={name}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => { onClose(); open(); }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-rp-cyan/50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rp-cyan to-rp-blue flex items-center justify-center text-white font-bold text-sm">
                    {name[0]}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-white">{name}</div>
                    <div className="text-xs text-neutral-500">
                      {name === 'MetaMask' ? t('wallet.browserWallet') :
                       name === 'Trust Wallet' ? t('wallet.mobileWallet') :
                       name === 'Coinbase' ? t('wallet.coinbaseAccount') : t('wallet.walletConnect')}
                    </div>
                  </div>
                </motion.button>
              ))}

              {/* WalletConnect / More */}
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => { onClose(); open({ view: 'Connect' }); }}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-rp-cyan/10 hover:bg-rp-cyan/20 border border-rp-cyan/30 hover:border-rp-cyan/50 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-rp-cyan flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a4 4 0 018 0v2"/><circle cx="12" cy="14" r="2"/></svg>
                </div>
                <div className="text-left flex-1">
                  <div className="font-semibold text-white">WalletConnect</div>
                  <div className="text-xs text-neutral-500">{t('wallet.mobileWallet')} · QR Code · 全部錢包</div>
                </div>
              </motion.button>
            </div>

            <p className="text-neutral-600 text-xs text-center mt-6">{t('wallet.supportedWallets')}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
