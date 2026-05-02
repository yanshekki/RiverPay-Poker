import { WagmiProvider } from 'wagmi';
import { avalanche } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import { CONFIG } from '../config';

const queryClient = new QueryClient();

const metadata = {
  name: 'RiverPay Poker',
  description: 'Web3 Texas Hold\'em on Avalanche',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://riverpay.poker',
  icons: ['/logo.svg'],
};

const wagmiAdapter = new WagmiAdapter({
  projectId: CONFIG.WALLET_CONNECT_PROJECT_ID,
  networks: [avalanche],
  transports: {
    [avalanche.id]: http(CONFIG.CHAIN_RPC),
  },
  multiInjectedProviderDiscovery: true,
  ssr: false,
});

createAppKit({
  adapters: [wagmiAdapter],
  projectId: CONFIG.WALLET_CONNECT_PROJECT_ID,
  networks: [avalanche],
  defaultNetwork: avalanche,
  metadata,
  themeMode: 'dark',
  themeVariables: { '--w3m-accent': '#00B4D8' },
  features: { analytics: false, email: false, socials: false },
  allWallets: 'SHOW',
});

export default function Web3Provider({ children }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
