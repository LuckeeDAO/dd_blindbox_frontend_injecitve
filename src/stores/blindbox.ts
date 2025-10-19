import { create } from 'zustand';
import { BlindBox, Purchase } from '@/types';
import { contractService } from '@/services/contract';

interface BlindBoxStore {
  blindBoxes: BlindBox[];
  purchases: Purchase[];
  isLoading: boolean;
  error: string | null;
  
  fetchBlindBoxes: () => Promise<void>;
  fetchPurchases: (user?: string) => Promise<void>;
  buyBlindBox: (blindBoxId: number, quantity: number, userRandom?: string) => Promise<string>;
  openBlindBox: (purchaseId: number, userRandom?: string) => Promise<string>;
  setError: (error: string | null) => void;
}

export const useBlindBoxStore = create<BlindBoxStore>((set, get) => ({
  blindBoxes: [],
  purchases: [],
  isLoading: false,
  error: null,

  fetchBlindBoxes: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const blindBoxes = await contractService.getBlindBoxes();
      set({ blindBoxes, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch blind boxes';
      set({ error: errorMessage, isLoading: false });
    }
  },

  fetchPurchases: async (user?: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const purchases = await contractService.getPurchases(user);
      set({ purchases, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch purchases';
      set({ error: errorMessage, isLoading: false });
    }
  },

  buyBlindBox: async (blindBoxId: number, quantity: number, userRandom?: string) => {
    set({ error: null });
    
    try {
      const txHash = await contractService.buyBlindBox(blindBoxId, quantity, userRandom);
      
      // 刷新盲盒列表
      await get().fetchBlindBoxes();
      
      return txHash;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to buy blind box';
      set({ error: errorMessage });
      throw error;
    }
  },

  openBlindBox: async (purchaseId: number, userRandom?: string) => {
    set({ error: null });
    
    try {
      const txHash = await contractService.openBlindBox(purchaseId, userRandom);
      
      // 刷新购买记录
      await get().fetchPurchases();
      
      return txHash;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to open blind box';
      set({ error: errorMessage });
      throw error;
    }
  },

  setError: (error: string | null) => {
    set({ error });
  }
}));
