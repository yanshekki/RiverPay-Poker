import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';

export default function RoomList({ active, completed, onNavigate }) {
  const { t } = useTranslation();

  return (
    <div className="w-full text-left border-t border-white/5 pt-6">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-rp-light mb-3 px-1 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rp-light animate-pulse" />
          {t('lobby.activeGames')}
        </h3>
        {active.length === 0 ? (
          <p className="text-xs text-neutral-600 px-1 font-mono">{t('lobby.noActiveGames')}</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {active.map(room => (
              <motion.div key={room.id} whileHover={{ scale: 1.01 }}
                onClick={() => onNavigate(room.roomCode)}
                className="bg-white/5 hover:bg-white/10 p-3 rounded-xl border border-white/10 cursor-pointer flex justify-between items-center group"
              >
                <div>
                  <p className="text-white font-mono font-bold text-sm">{t('game.room')}: {room.roomCode}</p>
                  <p className="text-xs text-neutral-500 font-mono">
                    {room.contractAddress ? `${room.contractAddress.substring(0, 6)}...${room.contractAddress.substring(36)}` : t('lobby.notBound')}
                  </p>
                </div>
                <span className="text-xs bg-rp-cyan/20 text-rp-light px-2 py-1 rounded font-bold group-hover:scale-105 transition-transform">
                  {t('lobby.rejoin')}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-sm font-bold text-neutral-500 mb-3 px-1 flex items-center gap-1">
          <TrendingUp size={14} /> {t('lobby.history')}
        </h3>
        {completed.length === 0 ? (
          <p className="text-xs text-neutral-600 px-1 font-mono">{t('lobby.noHistory')}</p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto pr-1 opacity-70">
            {completed.map(room => (
              <div key={room.id} className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                <div>
                  <p className="text-neutral-400 font-mono text-sm">{t('game.room')}: {room.roomCode}</p>
                  <p className="text-[10px] text-neutral-600">{new Date(room.createdAt).toLocaleString()}</p>
                </div>
                <span className="text-[10px] text-neutral-500 bg-white/5 px-2 py-1 rounded border border-white/5">{t('lobby.settled')}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
