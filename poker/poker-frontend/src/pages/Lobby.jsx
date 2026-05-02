import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  useAccount, useConnect, useDisconnect, useSignMessage, useSwitchChain
} from 'wagmi';
import { avalanche } from 'wagmi/chains';
import { ShieldCheck, LogOut, Pickaxe, Zap } from 'lucide-react';

import { CONFIG } from '../config';
import { useStore } from '../store/useStore';
import ContractData from '../ContractData.json';
import SuitParticles from '../components/ui/SuitParticles';
import WalletModal from '../components/lobby/WalletModal';
import SettingsModal from '../components/lobby/SettingsModal';
import RoomList from '../components/lobby/RoomList';
import LoginButton from '../components/lobby/LoginButton';
import LanguageSwitcher from '../components/language/LanguageSwitcher';


export default function Lobby() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { token, setAuth, logout } = useStore();
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const { switchChain } = useSwitchChain();

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [myRooms, setMyRooms] = useState({ active: [], completed: [] });
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [roomSettings, setRoomSettings] = useState({
    maxPlayers: 8, smallBlind: 10, bigBlind: 20, turnTimer: 15
  });

  // Fetch room history
  useEffect(() => {
    if (!token) return;
    fetch(`${CONFIG.API_URL}/api/my-rooms`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.ok ? r.json() : []).then(data => {
      setMyRooms({
        active: data.filter(r => r.status === 'WAITING' || r.status === 'PLAYING'),
        completed: data.filter(r => r.status === 'FINISHED'),
      });
    }).catch(() => {});
  }, [token]);

  // Auto-logout on wallet disconnect
  useEffect(() => {
    if (!isConnected && token) logout();
  }, [isConnected, token, logout]);

  const doLogin = async () => {
    if (!isConnected) { setShowWalletModal(true); return; }
    try {
      setIsLoggingIn(true);
      setLoadingText('正在切換至 Avalanche 網路...');
      try { await switchChain({ chainId: avalanche.id }); } catch (e) { console.error('Network switch failed:', e); setIsLoggingIn(false); return; }

      setLoadingText('向伺服器請求安全授權碼...');
      const walletAddr = address.toLowerCase();
      const nonceRes = await fetch(`${CONFIG.API_URL}/auth/request-nonce`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: walletAddr }),
      });
      const { nonce } = await nonceRes.json();

      setLoadingText('請在錢包確認簽名...');
      const signature = await signMessageAsync({ message: nonce });

      setLoadingText('驗證簽名中...');
      const verifyRes = await fetch(`${CONFIG.API_URL}/auth/verify-signature`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ walletAddress: walletAddr, signature }),
      });
      if (!verifyRes.ok) throw new Error('簽名驗證失敗');
      const { token: jwtToken, user } = await verifyRes.json();
      setAuth(user.walletAddress, user.id, jwtToken);
    } catch (error) {
      console.error('登入失敗:', error);
      alert(error.message?.includes('rejected') ? t('errors.signRejected') : t('errors.loginFailed'));
    } finally { setIsLoggingIn(false); setShowWalletModal(false); }
  };

  const connectWallet = useCallback(async (connector) => {
    setShowWalletModal(false);
    try { await connect({ connector }); setTimeout(() => doLogin(), 500); } catch (e) { console.error('Wallet connect failed:', e); }
  }, [connect, doLogin]);

  const createRoom = async () => {
    if (!isConnected) return alert(t('lobby.connectWallet'));
    try {
      setIsCreatingRoom(true);
      try { await switchChain({ chainId: avalanche.id }); } catch { alert(t('errors.networkRequired')); setIsCreatingRoom(false); return; }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const factoryContract = new ethers.Contract(ContractData.factoryAddress, ContractData.factoryAbi, signer);
      const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const tx = await factoryContract.createRoom(newRoomId);
      const receipt = await tx.wait();

      const logs = receipt.logs.map(log => {
        try { return factoryContract.interface.parseLog(log); } catch { return null; }
      }).filter(Boolean);
      const event = logs.find(l => l?.name === 'RoomCreated');
      const contractAddress = event?.args[0];
      if (!contractAddress) throw new Error('無法取得合約地址');

      useStore.getState().setPendingRoom({ roomId: newRoomId, contractAddress, settings: roomSettings });
      setShowSettingsModal(false);
      navigate(`/room/${newRoomId}`);
    } catch (error) {
      console.error('開局失敗:', error);
      alert(error.code === 'ACTION_REJECTED' ? t('errors.txRejected') : t('errors.createRoomFailed'));
    } finally { setIsCreatingRoom(false); }
  };

  const handleLogout = () => { logout(); disconnect(); };

  return (
    <div className="min-h-dvh bg-[#0a0a0a] flex flex-col items-center justify-center text-white relative overflow-hidden">
      <SuitParticles count={15} />

      {/* Background glow orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-fuchsia-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-cyan-400/10 rounded-full blur-[120px]" />
      <div className="absolute top-[40%] left-[50%] w-64 h-64 bg-yellow-400/5 rounded-full blur-[80px]" />

      {/* Main card */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
        className="z-10 flex flex-col items-center max-w-md w-full mx-4 p-6 sm:p-8 glass-panel rounded-3xl shadow-2xl border-gradient"
      >
        <div className="flex flex-col items-center w-full">
          <div className="flex items-center gap-2 mb-2">
            <motion.div animate={{ rotate: [0, 5, 0, -5, 0] }} transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}>
              <ShieldCheck size={64} className="text-yellow-400" />
            </motion.div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-center">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400">{t('lobby.title')}</span>{' '}
            <span className="text-white">{t('lobby.subtitle')}</span>
          </h1>
          <LanguageSwitcher position="relative" size={18} />
        </div>
        <p className="text-neutral-500 mb-8 text-center text-sm flex items-center gap-1">
          <Zap size={14} className="text-yellow-400" /> {t('lobby.description')}
        </p>

        {!token ? (
          <>
            {isConnected ? (
              <div className="w-full">
                <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                  className="bg-white/5 w-full p-4 rounded-xl border border-emerald-500/30 mb-4 flex flex-col items-center">
                  <span className="text-xs text-emerald-400 mb-1 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> {t('lobby.walletConnected')}
                  </span>
                  <span className="font-mono text-cyan-400 text-sm">
                    {address?.substring(0, 8)}...{address?.substring(address.length - 6)}
                  </span>
                </motion.div>
                <LoginButton isConnected={isConnected} isLoggingIn={isLoggingIn} loadingText={loadingText}
                  onConnect={() => setShowWalletModal(true)} onLogin={doLogin} onDisconnect={disconnect} />
              </div>
            ) : (
              <LoginButton isConnected={false} onConnect={() => setShowWalletModal(true)} />
            )}
          </>
        ) : (
          <div className="w-full flex flex-col items-center">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="bg-white/5 w-full p-4 rounded-xl border border-emerald-500/30 mb-6 flex flex-col items-center">
              <span className="text-xs text-emerald-400 mb-1 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> {t('lobby.loggedIn')}
              </span>
              <span className="font-mono text-yellow-400 text-sm">
                {address?.substring(0, 8)}...{address?.substring(address.length - 6)}
              </span>
            </motion.div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => setShowSettingsModal(true)}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-lg font-bold transition-all mb-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white neon-emerald touch-target">
              <Pickaxe size={20} /> {t('lobby.createRoom')}
            </motion.button>

            <motion.button whileHover={{ scale: 1.02 }}
              onClick={handleLogout}
              className="flex items-center gap-2 text-neutral-500 hover:text-rose-400 transition-colors text-sm mb-6 touch-target">
              <LogOut size={16} /> {t('lobby.logout')}
            </motion.button>

            <RoomList active={myRooms.active} completed={myRooms.completed}
              onNavigate={(code) => navigate(`/room/${code}`)} />
          </div>
        )}
      </motion.div>

      <p className="z-10 text-neutral-700 text-xs mt-6">{t('app.footer')}</p>

      <WalletModal show={showWalletModal} onClose={() => setShowWalletModal(false)} onSelect={connectWallet} />
      <SettingsModal show={showSettingsModal} onClose={() => setShowSettingsModal(false)}
        settings={roomSettings} onChange={(patch) => setRoomSettings(s => ({ ...s, ...patch }))}
        onCreate={createRoom} isCreating={isCreatingRoom} />
    </div>
  );
}
