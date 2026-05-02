import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Wallet, X, Scan, Loader2 } from 'lucide-react';
import { useConnect } from 'wagmi';

export default function WalletModal({ show, onClose }) {
  const { t } = useTranslation();
  const { connectors, connect, isPending } = useConnect();
  const [connectingId, setConnectingId] = useState(null);

  const handleConnect = async (connector) => {
    setConnectingId(connector.id);
    try {
      await connect({ connector });
      onClose();
    } catch (e) {
      console.error(e);
    }
    setConnectingId(null);
  };

  // Filter: show walletConnect + non-generic injected wallets only
  const visible = connectors.filter(c => {
    const name = (c.name || '').toLowerCase();
    const id = (c.id || '').toLowerCase();
    // Show walletConnect
    if (id.includes('walletconnect') || id.includes('wallet')) return true;
    // Show real browser wallets, skip generic "Injected" / anonymous
    if (c.type === 'injected' && name && !name.includes('injected') && id !== 'injected') return true;
    return false;
  });

  // Separate walletConnect from injected
  const wcList = visible.filter(c => c.id.toLowerCase().includes('wallet'));
  const browserList = visible.filter(c => !c.id.toLowerCase().includes('wallet'));

  const renderButton = (conn) => {
    const loading = connectingId === conn.id;
    const isWC = conn.id.toLowerCase().includes('wallet');
    return (
      <motion.button
        key={conn.id}
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={() => handleConnect(conn)}
        disabled={isPending}
        className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all touch-target disabled:opacity-50 ${
          isWC
            ? 'bg-rp-cyan/10 hover:bg-rp-cyan/20 border border-rp-cyan/30 hover:border-rp-cyan/50'
            : 'bg-white/5 hover:bg-white/10 border border-white/10 hover:border-rp-cyan/50'
        }`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm ${
          isWC ? 'bg-rp-cyan' : 'bg-gradient-to-br from-rp-cyan to-rp-blue'
        }`}>
          {loading ? <Loader2 className="animate-spin" size={18} /> :
           conn.icon ? <img src={conn.icon} alt="" className="w-5 h-5" /> :
           isWC ? <Scan size={18} /> : conn.name?.charAt(0) || 'W'}
        </div>
        <div className="text-left flex-1">
          <div className="font-semibold text-white">{conn.name}</div>
          <div className="text-xs text-neutral-500">
            {isWC ? 'QR Code · Mobile · All Wallets' : t('wallet.browserWallet')}
          </div>
        </div>
      </motion.button>
    );
  };

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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2"><Wallet className="text-rp-cyan" size={24} />{t('wallet.connectTitle')}</h2>
              <button onClick={onClose} className="text-neutral-500 hover:text-white"><X size={24} /></button>
            </div>

            {browserList.length > 0 && (
              <>
                <p className="text-xs text-neutral-500 mb-2 uppercase tracking-wider">Browser Wallet</p>
                <div className="space-y-2 mb-4">{browserList.map(renderButton)}</div>
              </>
            )}

            {wcList.length > 0 && (
              <>
                {browserList.length > 0 && <hr className="border-white/5 my-4" />}
                <p className="text-xs text-neutral-500 mb-2 uppercase tracking-wider">WalletConnect</p>
                <div className="space-y-2">{wcList.map(renderButton)}</div>
              </>
            )}

            {visible.length === 0 && (
              <p className="text-neutral-500 text-center py-8">No wallets detected. Try a different browser.</p>
            )}

            <p className="text-neutral-600 text-xs text-center mt-6">{t('wallet.supportedWallets')}</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
