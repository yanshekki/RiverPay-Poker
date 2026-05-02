import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAccount } from 'wagmi';
import { Loader2 } from 'lucide-react';

import { CONFIG } from '../config';
import { useStore } from '../store/useStore';
import { socket } from '../services/socket';
import ContractData from '../ContractData.json';
import { useGameSocket } from '../hooks/useGameSocket';
import { useVoiceChat } from '../hooks/useVoiceChat';
import { useConfetti } from '../hooks/useConfetti';

import Header from '../components/layout/Header';
import SideMenu from '../components/layout/SideMenu';
import ErrorToast from '../components/ui/ErrorToast';
import WinBanner from '../components/game/WinBanner';
import DepositBar from '../components/game/DepositBar';
import PokerTable from '../components/game/PokerTable';
import PlayerBadge from '../components/game/PlayerBadge';
import MobilePlayerRow from '../components/game/MobilePlayerRow';
import ActionPanel from '../components/game/ActionPanel';
import TimerBar from '../components/ui/TimerBar';

const USDT_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function balanceOf(address account) external view returns (uint256)"
];

export default function GameRoom() {
  const { id: roomId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { token, gameState, setGameState, setRoomId } = useStore();
  const { address } = useAccount();
  const spawnConfetti = useConfetti();
  const { roomContract, errorMsg, setErrorMsg, emit } = useGameSocket(roomId, token);
  // Voice chat receiver (side-effect: socket listener)
  useVoiceChat();

  const [isDepositing, setIsDepositing] = useState(false);
  const [isCashingOut, setIsCashingOut] = useState(false);
  const [winBanner, setWinBanner] = useState(null);
  const [showSideMenu, setShowSideMenu] = useState(false);

  // Redirect if not authenticated
  useEffect(() => { if (!token) navigate('/'); }, [token, navigate]);

  // Room ID + game state listener
  useEffect(() => { setRoomId(roomId); }, [roomId, setRoomId]);
  useEffect(() => {
    socket.on('gameStateUpdate', (ns) => setGameState(ns));
    return () => socket.off('gameStateUpdate');
  }, [setGameState]);

  // Cash-out handler (retries if contract not loaded yet)
  useEffect(() => {
    const handler = async (claimData) => {
      if (!roomContract) {
        // Contract not loaded yet — wait and retry once
        await new Promise(r => setTimeout(r, 2000));
        const current = useStore.getState();
        // After timeout, if still no contract, alert user to retry
        if (!roomContract) {
          setErrorMsg('Contract not loaded. Please try cash out again.');
          setIsCashingOut(false);
          return;
        }
      }
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const poker = new ethers.Contract(roomContract, ContractData.roomAbi, signer);
        await (await poker.claim(claimData.amount, claimData.nonce, claimData.signature)).wait();
        alert(`✅ ${t('game.cashOutTitle')} ${ethers.formatUnits(claimData.amount, 6)} USDT`);
        navigate('/');
      } catch (error) {
        setErrorMsg(error.code === 'ACTION_REJECTED' ? t('errors.txRejected') : t('errors.withdrawFailed'));
        setIsCashingOut(false);
      }
    };
    socket.on('cashOutSignature', handler);
    return () => socket.off('cashOutSignature', handler);
  }, [roomContract, navigate, t, setErrorMsg]);

  // Win handler
  useEffect(() => {
    const handler = (data) => {
      spawnConfetti();
      setWinBanner(data);
      setTimeout(() => setWinBanner(null), 8000);
    };
    socket.on('gameOver', handler);
    return () => socket.off('gameOver', handler);
  }, [spawnConfetti]);

  // ─── Actions ───
  const handleDeposit = async (amount = 100) => {
    if (!roomContract || !window.ethereum) return;
    try {
      setIsDepositing(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const amt = ethers.parseUnits(amount.toString(), 6);
      const usdt = new ethers.Contract(CONFIG.USDT_ADDRESS, USDT_ABI, signer);
      await (await usdt.approve(roomContract, amt)).wait();
      const poker = new ethers.Contract(roomContract, ContractData.roomAbi, signer);
      const receipt = await (await poker.deposit(amt)).wait();
      emit('playerDeposited', { amount, txHash: receipt.hash });
    } catch (error) {
      setErrorMsg(error.code === 'ACTION_REJECTED' ? t('errors.txRejected') : t('errors.depositFailed'));
    } finally { setIsDepositing(false); }
  };

  const handleLeaveRoom = () => {
    if (isCashingOut) return;
    const player = gameState.players.find(p => p && p.address === address?.toLowerCase());
    if (!player) { navigate('/'); return; }
    if (gameState.state !== 'WAITING' && !player.isFolded) {
      if (!window.confirm('⚠️ Game in progress. Leaving means forfeiting current bets. Confirm?')) return;
    } else {
      if (!window.confirm(player.chips > 0 ? `Exit and withdraw ${player.chips} USDT?` : 'Confirm leave?')) return;
    }
    setIsCashingOut(true);
    emit('cashOut', {});
  };

  const handleAction = (action, amount = 0) => {
    emit('playerAction', { action, amount });
  };

  // ─── Derived state ───
  const walletAddress = address?.toLowerCase();
  const myPlayer = gameState.players.find(p => p && p.address === walletAddress);
  const isMyTurn = gameState.players[gameState.currentPlayerTurn]?.address === walletAddress;
  const callAmount = isMyTurn && myPlayer ? gameState.currentHighestBet - (myPlayer.bet || 0) : 0;
  const canCheck = isMyTurn && callAmount === 0;
  const activeIndices = gameState.players.map((p, i) => p ? i : -1).filter(i => i >= 0);

  // ─── Seat positions (desktop) ───
  const getPlayerPos = (index, total) => {
    if (total <= 1) return { x: 50, y: 50 };
    const step = (2 * Math.PI) / total;
    const angle = step * index - Math.PI / 2;
    const rx = 300, ry = 170;
    return { x: 50 + Math.cos(angle) * (rx / 6), y: 50 + Math.sin(angle) * (ry / 5) };
  };

  return (
    <div className="min-h-dvh bg-[#0a0a0a] text-white flex flex-col font-sans relative overflow-hidden">
      <ErrorToast message={errorMsg} />

      {/* Win banner */}
      <AnimatePresence>{winBanner && <WinBanner data={winBanner} walletAddress={walletAddress} />}</AnimatePresence>

      {/* Cash-out overlay */}
      <AnimatePresence>
        {isCashingOut && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}>
              <Loader2 size={64} className="text-rp-cyan" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white mt-4 mb-2">{t('game.cashOutTitle')}</h2>
            <p className="text-neutral-400">{t('game.cashOutDesc')}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <Header
        roomId={roomId} gameState={gameState} roomContract={roomContract}
        chips={myPlayer?.chips || 0} voiceRoomId={roomId}
        onLeave={handleLeaveRoom} onMenuToggle={() => setShowSideMenu(true)}
      />

      {/* Deposit bar */}
      {(!myPlayer || myPlayer.chips === 0) && (
        <DepositBar roomContract={roomContract} isDepositing={isDepositing} onDeposit={handleDeposit} />
      )}

      {/* Game table */}
      <main className="flex-1 relative flex flex-col items-center justify-center p-2 sm:p-4">
        <PokerTable gameState={gameState}>
          {/* Desktop player seats */}
          <div className="hidden md:block absolute inset-0 pointer-events-none">
            {activeIndices.map((pIdx, displayIdx) => {
              const player = gameState.players[pIdx];
              if (!player) return null;
              const pos = getPlayerPos(displayIdx, activeIndices.length);
              const isMe = player.address === walletAddress;
              const isTurn = pIdx === gameState.currentPlayerTurn;
              const isFolded = player.isFolded;
              const handCards = isMe && player.hand && gameState.state !== 'SHOWDOWN' ? player.hand
                : gameState.state === 'SHOWDOWN' && !isFolded ? player.hand
                : isFolded ? null : ['hidden', 'hidden'];

              return (
                <div key={pIdx} className="absolute pointer-events-auto"
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}>
                  <PlayerBadge player={player} isMe={isMe} isTurn={isTurn} handCards={handCards} isFolded={isFolded} />
                </div>
              );
            })}
          </div>
        </PokerTable>

        {/* Mobile player list */}
        <div className="md:hidden w-full max-w-md mt-4 space-y-2 px-2">
          {activeIndices.map(pIdx => {
            const player = gameState.players[pIdx];
            if (!player) return null;
            const isMe = player.address === walletAddress;
            const isTurn = pIdx === gameState.currentPlayerTurn;
            const isFolded = player.isFolded;
            const handCards = isMe && player.hand && gameState.state !== 'SHOWDOWN' ? player.hand
              : gameState.state === 'SHOWDOWN' && !isFolded ? player.hand
              : isFolded ? null : ['hidden', 'hidden'];

            return <MobilePlayerRow key={pIdx} player={player} isMe={isMe} isTurn={isTurn} isFolded={isFolded} handCards={handCards} />;
          })}
        </div>
      </main>

      {/* Timer */}
      <div className="flex justify-center pb-1">
        <TimerBar turnEndTime={gameState.turnEndTime} isActive={isMyTurn} />
      </div>

      {/* Action panel */}
      <footer className="glass-panel border-t border-white/5 px-3 sm:px-4 py-3 sm:py-4 z-10 flex flex-col items-center gap-2 safe-bottom">
        <ActionPanel
          gameState={gameState} isMyTurn={isMyTurn} myPlayer={myPlayer}
          callAmount={callAmount} canCheck={canCheck} onAction={handleAction}
        />
      </footer>

      {/* Side menu */}
      <SideMenu
        show={showSideMenu} onClose={() => setShowSideMenu(false)}
        roomId={roomId} gameState={gameState} roomContract={roomContract}
        players={gameState.players} walletAddress={walletAddress}
      />
    </div>
  );
}
