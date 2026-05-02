import { createConfig, http, WagmiProvider } from 'wagmi';
import { avalanche } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { CONFIG } from '../config';

const queryClient = new QueryClient();

export const wagmiConfig = createConfig({
  chains: [avalanche],
  transports: {
    [avalanche.id]: http(CONFIG.CHAIN_RPC),
  },
  multiInjectedProviderDiscovery: true,
  ssr: false,
});

createWeb3Modal({
  wagmiConfig,
  projectId: CONFIG.WALLET_CONNECT_PROJECT_ID,
  defaultChain: avalanche,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#00B4D8',
    '--w3m-color-mix': '#0a0a0a',
    '--w3m-color-mix-strength': 20,
  },
  enableAnalytics: false,
  allWallets: 'SHOW',
  includeWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa',
  ],
});

export default function Web3Provider({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
