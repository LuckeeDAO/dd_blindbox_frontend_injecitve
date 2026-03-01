'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/hooks/useWallet';
import { useTranslation } from '@/hooks/useTranslation';

interface WalletStatusProps {
  onConnect: () => void;
}

export const WalletStatus: React.FC<WalletStatusProps> = ({ onConnect }) => {
  const { t } = useTranslation();
  const { address, isConnected, walletType, balance, disconnect, chain } = useWallet();

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (!isConnected) {
    return (
      <button
        onClick={onConnect}
        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors duration-200"
      >
        {t('wallet.connect')}
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center space-x-3"
    >
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        <span className="text-sm text-gray-600">
          {walletType?.toUpperCase()}
        </span>
      </div>
      
      <div className="flex flex-col items-end">
        <span className="text-sm font-medium text-gray-900">
          {formatAddress(address || '')}
        </span>
        {balance && (
          <span className="text-xs text-gray-500">
            {balance} {chain.nativeToken.symbol}
          </span>
        )}
      </div>
      
      <button
        onClick={disconnect}
        className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
        title={t('wallet.disconnect')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
};
