'use client';

import * as React from 'react';
import {
  RainbowKitProvider,
  getDefaultWallets,
  getDefaultConfig,
} from '@rainbow-me/rainbowkit';
import {
  trustWallet,
  ledgerWallet,
} from '@rainbow-me/rainbowkit/wallets';
import {
  moonbaseAlpha,
  moonbeam
} from 'wagmi/chains';
import { defineChain } from 'viem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider, http } from 'wagmi';
import { Provider as JotaiProvider } from 'jotai';
// import according to docs

export const westendAssetHub = defineChain({
  id: 420420421,
  name: "Westend AssetHub",
  nativeCurrency: {
    decimals: 18,
    name: 'Westend',
    symbol: 'WND',
  },
  rpcUrls: {
    default: {
      http: ['https://westend-asset-hub-eth-rpc.polkadot.io'],
      webSocket: ['wss://westend-asset-hub-eth-rpc.polkadot.io'],
    },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://assethub-westend.subscan.io' },
  },
})

const { wallets } = getDefaultWallets();
// initialize and destructure wallets object

const config = getDefaultConfig({
  appName: "DOTUI", // Name your app
  projectId: "ddf8cf3ee0013535c3760d4c79c9c8b9", // Enter your WalletConnect Project ID here
  wallets: [
    ...wallets,
    {
      groupName: 'Other',
      wallets: [trustWallet, ledgerWallet],
    },
  ],
  chains: [
    westendAssetHub,
    moonbeam,
    moonbaseAlpha
  ],
  transports: {
    [westendAssetHub.id]: http(),
    [moonbeam.id]: http(),
    [moonbaseAlpha.id]: http(),
  },
  ssr: true, // Because it is Nextjs's App router, you need to declare ssr as true
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <JotaiProvider>
      <WagmiProvider config={config}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            {children}
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </JotaiProvider>
  );
}
