import { create } from 'zustand';

export const useStore = create((set, get) => ({
  // Auth state (JWT from backend signature verification)
  token: localStorage.getItem('riverpay_token') || null,
  userId: localStorage.getItem('riverpay_userId') || null,
  
  usdtBalance: '0',
  roomId: null,
  pendingRoom: null,
  
  gameState: {
    players: [],
    pot: 0,
    communityCards: [],
    currentPlayerTurn: null,
    currentHighestBet: 0,
    state: 'WAITING',
    turnEndTime: 0,
  },
  
  setAuth: (address, userId, token) => {
    localStorage.setItem('riverpay_token', token);
    localStorage.setItem('riverpay_userId', userId);
    set({ userId, token });
  },
  
  logout: () => {
    localStorage.removeItem('riverpay_token');
    localStorage.removeItem('riverpay_userId');
    set({ token: null, userId: null, roomId: null });
  },

  setPendingRoom: (data) => set({ pendingRoom: data }),
  clearPendingRoom: () => set({ pendingRoom: null }),

  setGameState: (newState) => set((state) => ({
    gameState: { ...state.gameState, ...newState }
  })),
  setRoomId: (id) => set({ roomId: id }),
  setUsdtBalance: (balance) => set({ usdtBalance: balance }),
}));
