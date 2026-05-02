import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Wallet, ChevronRight, X } from 'lucide-react';
import { useConnect } from 'wagmi';

export default function WalletModal({ show, onClose, onSelect }) {
  const { t } = useTranslation();
  const { connectors, isPending: isConnecting } = useConnect();

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
                <Wallet className="text-yellow-400" size={24} />
                {t('wallet.connectTitle')}
              </h2>
              <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <p className="text-neutral-400 text-sm mb-6">{t('wallet.connectDescription')}</p>

            <div className="space-y-3">
              {connectors.map(connector => (
                <motion.button key={connector.uid}
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect(connector)} disabled={isConnecting}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-yellow-400/50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center text-black font-bold">
                    {connector.icon ? <img src={connector.icon} alt="" className="w-6 h-6" /> : <Wallet size={20} />}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-white">{connector.name}</div>
                    <div className="text-xs text-neutral-500">
                      {connector.id.includes('injected') ? t('wallet.browserWallet') :
                       connector.id.includes('walletConnect') ? t('wallet.mobileWallet') :
                       connector.id.includes('coinbase') ? t('wallet.coinbaseAccount') : t('wallet.walletConnect')}
                    </div>
                  </div>
                  <ChevronRight className="text-neutral-600 group-hover:text-yellow-400 transition-colors" size={20} />
                </motion.button>
              ))}
            </div>

            <p className="text-neutral-600 text-xs text-center mt-6">{t('wallet.supportedWallets')}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
