'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '@/hooks/useWallet';
import { useTranslation } from '@/hooks/useTranslation';
import { WalletType } from '@/types/wallet';
import { useChain } from '@/hooks/useChain';

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const walletButtonClass =
  'w-full px-4 py-3 text-white rounded-lg transition-colors duration-200 flex items-center justify-center';

export const WalletConnectModal: React.FC<WalletConnectModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useTranslation();
  const { connect, disconnect, isConnected, address, walletType, chain } = useWallet();
  const { availableChains, chainKey, setChainKey } = useChain();

  const handleConnect = async (type: WalletType) => {
    try {
      await connect(type);
      onClose();
    } catch (error) {
      console.error('钱包连接失败:', error);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    onClose();
  };

  const handleSwitchChain = async (nextChainKey: string) => {
    if (isConnected) {
      await disconnect();
    }
    setChainKey(nextChainKey);
  };

  const getWalletLabel = (type: WalletType): string => {
    if (type === WalletType.ANDAO) return t('wallet.andao');
    if (type === WalletType.KEPLR) return t('wallet.keplr');
    if (type === WalletType.METAMASK) return t('wallet.metamask');
    if (type === WalletType.COSMOSTATION) return 'Cosmostation';
    if (type === WalletType.LEAP) return 'Leap';
    return type;
  };

  const getWalletButtonColor = (type: WalletType): string => {
    if (type === WalletType.ANDAO) return `${walletButtonClass} bg-emerald-600 hover:bg-emerald-700`;
    if (type === WalletType.METAMASK) return `${walletButtonClass} bg-orange-500 hover:bg-orange-600`;
    if (type === WalletType.COSMOSTATION) return `${walletButtonClass} bg-blue-600 hover:bg-blue-700`;
    if (type === WalletType.KEPLR) return `${walletButtonClass} bg-purple-600 hover:bg-purple-700`;
    return `${walletButtonClass} bg-gray-700 hover:bg-gray-800`;
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{t('wallet.connectWallet')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-600 mb-2">网络</label>
          <select
            value={chainKey}
            onChange={(e) => void handleSwitchChain(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            {availableChains.map((item) => (
              <option key={item.key} value={item.key}>
                {item.name}
                {item.status === 'planned' ? ' (Planned)' : ''}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-2">
            当前链族：<span className="font-medium">{chain.family.toUpperCase()}</span>
          </p>
        </div>

        {isConnected ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                <span className="text-green-800 font-medium">{t('wallet.connected')}</span>
              </div>
              <p className="text-green-700 text-sm break-all">
                {t('wallet.address')}: {address}
              </p>
              <p className="text-green-700 text-sm mt-1">{walletType}</p>
              <p className="text-green-700 text-sm">{chain.name}</p>
            </div>
            <button
              onClick={() => void handleDisconnect()}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              {t('wallet.disconnect')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {chain.status === 'planned' ? (
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                该网络处于预留阶段，钱包连接尚未开放。
              </div>
            ) : (
              chain.wallets.map((type) => (
                <button
                  key={type}
                  onClick={() => void handleConnect(type)}
                  className={getWalletButtonColor(type)}
                >
                  {getWalletLabel(type)}
                </button>
              ))
            )}
          </div>
        )}

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-xs">
            <strong>注意:</strong>{' '}
            {t('wallet.installExtension') || '请确保已安装对应钱包扩展，并切换到正确网络'}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
