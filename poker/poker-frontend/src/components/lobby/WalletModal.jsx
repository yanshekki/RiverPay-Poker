import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Wallet, X, Scan } from 'lucide-react';
import { useConnect } from 'wagmi';

export default function WalletModal({ show, onClose }) {
  const { t } = useTranslation();
  const { connect, connectors } = useConnect();
  const [connecting, setConnecting] = useState(false);

  const handleConnect = async (connector) => {
    try {
      setConnecting(true);
      await connect({ connector });
      onClose();
    } catch (e) {
      console.error('Connect failed:', e.message);
    } finally {
      setConnecting(false);
    }
  };

  const injectedConnectors = connectors.filter(c => c.type === 'injected');
  const wcConnector = connectors.find(c => c.id === 'walletConnect');

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
            className="glass-panel rounded-3xl p-6 max-w-sm w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Wallet className="text-rp-cyan" size={24} />
                {t('wallet.connectTitle')}
              </h2>
              <button onClick={onClose} className="text-neutral-500 hover:text-white transition-colors" disabled={connecting}>
                <X size={24} />
              </button>
            </div>

            <p className="text-neutral-400 text-sm mb-6">{t('wallet.connectDescription')}</p>

            <div className="space-y-3">
              {/* All detected browser wallets (MetaMask, Brave, Rabby, etc.) */}
              {injectedConnectors.map((conn) => (
                <motion.button
                  key={conn.id}
                  whileHover={!connecting ? { scale: 1.02 } : {}}
                  whileTap={!connecting ? { scale: 0.98 } : {}}
                  onClick={() => handleConnect(conn)}
                  disabled={connecting}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-rp-cyan/50 transition-all group disabled:opacity-50"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rp-cyan to-rp-blue flex items-center justify-center text-white font-bold text-sm">
                    {conn.icon ? <img src={conn.icon} alt="" className="w-5 h-5" /> : conn.name?.charAt(0) || '🦊'}
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-white">{conn.name}</div>
                    <div className="text-xs text-neutral-500">{t('wallet.browserWallet')}</div>
                  </div>
                </motion.button>
              ))}

              {/* If no injected wallet detected, show generic browser wallet */}
              {injectedConnectors.length === 0 && (
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <p className="text-neutral-500 text-sm">{t('wallet.browserWallet')} not detected</p>
                </div>
              )}

              {/* WalletConnect — always available */}
              <motion.button
                whileHover={!connecting ? { scale: 1.02 } : {}}
                whileTap={!connecting ? { scale: 0.98 } : {}}
                onClick={() => wcConnector ? handleConnect(wcConnector) : null}
                disabled={connecting || !wcConnector}
                className="w-full flex items-center gap-4 p-4 rounded-2xl bg-rp-cyan/10 hover:bg-rp-cyan/20 border border-rp-cyan/30 hover:border-rp-cyan/50 transition-all group disabled:opacity-50"
              >
                <div className="w-10 h-10 rounded-xl bg-rp-cyan flex items-center justify-center">
                  <Scan size={20} className="text-white" />
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
