import { createConfig, http, WagmiProvider } from 'wagmi';
import { avalanche } from 'wagmi/chains';
import { walletConnect } from '@wagmi/connectors';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { CONFIG } from '../config';

const queryClient = new QueryClient();

export const wagmiConfig = createConfig({
  chains: [avalanche],
  multiInjectedProviderDiscovery: true,
  connectors: [
    walletConnect({
      projectId: CONFIG.WALLET_CONNECT_PROJECT_ID,
      metadata: {
        name: 'RiverPay Poker',
        description: 'Web3 Texas Hold\'em on Avalanche',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://riverpay.poker',
        icons: ['/logo.svg'],
      },
      showQrModal: true,
    }),
  ],
  transports: {
    [avalanche.id]: http(CONFIG.CHAIN_RPC),
  },
  ssr: false,
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
