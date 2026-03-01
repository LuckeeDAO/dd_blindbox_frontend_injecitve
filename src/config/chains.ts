import { WalletType } from '@/types/wallet';

export type ChainFamily = 'cosmos' | 'evm' | 'solana';

export interface ChainPaymentToken {
  id: string;
  name: string;
  symbol: string;
  denom: string;
  decimals: number;
  price: number;
  icon?: string;
  isNative?: boolean;
}

export interface ChainConfig {
  key: string;
  name: string;
  family: ChainFamily;
  chainId: string | number;
  rpcUrl: string;
  contractAddress: string;
  wallets: WalletType[];
  nativeToken: ChainPaymentToken;
  paymentTokens: ChainPaymentToken[];
  status: 'active' | 'planned';
  evm?: {
    chainHexId: string;
    chainName: string;
    nativeCurrency: {
      name: string;
      symbol: string;
      decimals: number;
    };
    blockExplorerUrls: string[];
    rpcUrls: string[];
  };
  cosmos?: {
    bech32Prefix?: string;
  };
}

function parseEvmWalletPriority(): WalletType[] {
  if (process.env.NEXT_PUBLIC_REQUIRE_ANDAO_PROVIDER === 'true') {
    return [WalletType.ANDAO];
  }

  const raw = (process.env.NEXT_PUBLIC_EVM_WALLET_PRIORITY || 'andao,metamask')
    .split(',')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  const result: WalletType[] = [];
  for (const item of raw) {
    if (item === WalletType.ANDAO) {
      result.push(WalletType.ANDAO);
    } else if (item === WalletType.METAMASK) {
      result.push(WalletType.METAMASK);
    }
  }

  if (result.length === 0) {
    return [WalletType.ANDAO, WalletType.METAMASK];
  }

  if (!result.includes(WalletType.ANDAO)) {
    result.push(WalletType.ANDAO);
  }
  if (!result.includes(WalletType.METAMASK)) {
    result.push(WalletType.METAMASK);
  }

  return result;
}

const injectiveTestnet: ChainConfig = {
  key: 'injective_testnet',
  name: 'Injective Testnet',
  family: 'cosmos',
  chainId: process.env.NEXT_PUBLIC_INJECTIVE_CHAIN_ID || process.env.NEXT_PUBLIC_CHAIN_ID || 'injective-888',
  rpcUrl:
    process.env.NEXT_PUBLIC_INJECTIVE_RPC_URL ||
    process.env.NEXT_PUBLIC_RPC_URL ||
    'https://testnet.sentry.tm.injective.network:443',
  contractAddress:
    process.env.NEXT_PUBLIC_INJECTIVE_CONTRACT_ADDRESS ||
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
    '',
  wallets: [WalletType.KEPLR, WalletType.COSMOSTATION],
  nativeToken: {
    id: 'inj',
    name: 'Injective',
    symbol: 'INJ',
    denom: 'inj',
    decimals: 18,
    price: 0,
    isNative: true,
  },
  paymentTokens: [
    {
      id: 'usdt',
      name: 'USDT',
      symbol: 'USDT',
      denom: 'usdt',
      decimals: 6,
      price: 2,
      icon: '/tokens/usdt.svg',
    },
    {
      id: 'luckee',
      name: 'LUCKEE',
      symbol: 'LUCKEE',
      denom: 'luckee',
      decimals: 6,
      price: 4,
      icon: '/tokens/luckee.svg',
    },
  ],
  status: 'active',
  cosmos: {
    bech32Prefix: 'inj',
  },
};

const avalancheFuji: ChainConfig = {
  key: 'avalanche_fuji',
  name: 'Avalanche Fuji',
  family: 'evm',
  chainId: Number(process.env.NEXT_PUBLIC_AVALANCHE_CHAIN_ID || 43113),
  rpcUrl:
    process.env.NEXT_PUBLIC_AVALANCHE_RPC_URL ||
    'https://api.avax-test.network/ext/bc/C/rpc',
  contractAddress: process.env.NEXT_PUBLIC_AVALANCHE_CONTRACT_ADDRESS || '',
  wallets: parseEvmWalletPriority(),
  nativeToken: {
    id: 'avax',
    name: 'Avalanche',
    symbol: 'AVAX',
    denom: 'AVAX',
    decimals: 18,
    price: 0,
    isNative: true,
  },
  paymentTokens: [
    {
      id: 'avax',
      name: 'AVAX',
      symbol: 'AVAX',
      denom: 'AVAX',
      decimals: 18,
      price: 0.02,
      isNative: true,
    },
    {
      id: 'usdt.e',
      name: 'USDT.e',
      symbol: 'USDT',
      denom: 'USDT.e',
      decimals: 6,
      price: 2,
    },
  ],
  status: 'active',
  evm: {
    chainHexId: '0xa869',
    chainName: 'Avalanche Fuji C-Chain',
    nativeCurrency: {
      name: 'Avalanche',
      symbol: 'AVAX',
      decimals: 18,
    },
    blockExplorerUrls: ['https://testnet.snowtrace.io'],
    rpcUrls: [
      process.env.NEXT_PUBLIC_AVALANCHE_RPC_URL ||
        'https://api.avax-test.network/ext/bc/C/rpc',
    ],
  },
};

const solanaDevnetPlaceholder: ChainConfig = {
  key: 'solana_devnet',
  name: 'Solana Devnet (Planned)',
  family: 'solana',
  chainId: process.env.NEXT_PUBLIC_SOLANA_CHAIN_ID || 'devnet',
  rpcUrl:
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  contractAddress: process.env.NEXT_PUBLIC_SOLANA_CONTRACT_ADDRESS || '',
  wallets: [],
  nativeToken: {
    id: 'sol',
    name: 'Solana',
    symbol: 'SOL',
    denom: 'SOL',
    decimals: 9,
    price: 0,
    isNative: true,
  },
  paymentTokens: [
    {
      id: 'sol',
      name: 'SOL',
      symbol: 'SOL',
      denom: 'SOL',
      decimals: 9,
      price: 0,
      isNative: true,
    },
  ],
  status: 'planned',
};

export const CHAIN_REGISTRY: Record<string, ChainConfig> = {
  avalanche_fuji: avalancheFuji,
  injective_testnet: injectiveTestnet,
  solana_devnet: solanaDevnetPlaceholder,
};

export const DEFAULT_CHAIN_KEY =
  process.env.NEXT_PUBLIC_DEFAULT_CHAIN || 'avalanche_fuji';

export function getChainConfig(chainKey?: string): ChainConfig {
  const key = chainKey || DEFAULT_CHAIN_KEY;
  return CHAIN_REGISTRY[key] || CHAIN_REGISTRY[DEFAULT_CHAIN_KEY] || avalancheFuji;
}

export function listChains(): ChainConfig[] {
  return Object.values(CHAIN_REGISTRY);
}

export function isCosmosChain(chain: ChainConfig): boolean {
  return chain.family === 'cosmos';
}

export function isEvmChain(chain: ChainConfig): boolean {
  return chain.family === 'evm';
}
