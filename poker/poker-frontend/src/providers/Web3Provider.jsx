import { createConfig, http, WagmiProvider } from 'wagmi';
import { avalanche } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createWeb3Modal, useWeb3Modal } from '@web3modal/wagmi/react';
import { CONFIG } from '../config';

const queryClient = new QueryClient();

export const wagmiConfig = createConfig({
  chains: [avalanche],
  transports: { [avalanche.id]: http(CONFIG.CHAIN_RPC) },
  multiInjectedProviderDiscovery: true,
  ssr: false,
});

const metadata = {
  name: 'RiverPay Poker',
  description: 'Web3 Texas Hold\'em on Avalanche',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://riverpay.poker',
  icons: ['/logo.svg'],
};

createWeb3Modal({
  wagmiConfig,
  projectId: CONFIG.WALLET_CONNECT_PROJECT_ID,
  defaultChain: avalanche,
  metadata,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-accent': '#00B4D8',
    '--w3m-z-index': 9999,
  },
  enableAnalytics: false,
  allWallets: 'SHOW',
  includeWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa',
    '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369',
    '20459438007b75f4f4acb98bf29aa3b800550309646d375da5fd4aac6c2a2c66',
  ],
});

export { useWeb3Modal };

export default function Web3Provider({ children }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
