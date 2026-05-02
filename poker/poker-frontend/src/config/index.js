export const CONFIG = {
  API_URL: import.meta.env.VITE_API_URL || 'http://84.32.34.14:3001',
  SOCKET_URL: import.meta.env.VITE_SOCKET_URL || 'http://84.32.34.14:3001',
  WALLET_CONNECT_PROJECT_ID: import.meta.env.VITE_WALLET_CONNECT_PROJECT_ID || '7d2b0b1c4e5f6a7b8c9d0e1f2a3b4c5d',
  CHAIN_ID: Number(import.meta.env.VITE_CHAIN_ID) || 43114,
  CHAIN_RPC: import.meta.env.VITE_CHAIN_RPC || 'https://api.avax.network/ext/bc/C/rpc',
  USDT_ADDRESS: import.meta.env.VITE_USDT_ADDRESS || '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
};
