import { create } from 'zustand';
import { WalletInfo } from '@/types/wallet';

interface WalletStore {
  wallet: WalletInfo | null;
  isConnecting: boolean;
  error: string | null;
  
  connect: (walletInfo: WalletInfo) => Promise<void>;
  disconnect: () => Promise<void>;
  setWallet: (wallet: WalletInfo | null) => void;
  updateBalance: (balance: string) => void;
  setError: (error: string | null) => void;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  wallet: null,
  isConnecting: false,
  error: null,

  connect: async (walletInfo: WalletInfo) => {
    set({ isConnecting: true, error: null });

    set({
      wallet: walletInfo,
      isConnecting: false,
    });
  },

  disconnect: async () => {
    set({ wallet: null, error: null });
  },

  setWallet: (wallet: WalletInfo | null) => {
    set({ wallet });
  },

  updateBalance: (balance: string) => {
    const { wallet } = get();
    if (!wallet) return;

    set({
      wallet: {
        ...wallet,
        balance,
      },
    });
  },

  setError: (error: string | null) => {
    set({ error });
  }
}));
