'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useWalletStore } from '@/stores/wallet';

interface WalletConnectProps {
  onClose: () => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ onClose }) => {
  const [mnemonic, setMnemonic] = useState('');
  const [showMnemonic, setShowMnemonic] = useState(false);
  const { connect, isConnecting, error } = useWalletStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mnemonic.trim()) {
      return;
    }

    try {
      await connect(mnemonic.trim());
      onClose();
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const generateMnemonic = () => {
    // 这里应该使用真正的助记词生成库
    const words = [
      'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract', 'absurd', 'abuse',
      'access', 'accident', 'account', 'accuse', 'achieve', 'acid', 'acoustic', 'acquire', 'across', 'act',
      'action', 'actor', 'actress', 'actual', 'adapt', 'add', 'addict', 'address', 'adjust', 'admit'
    ];
    
    const mnemonic = Array.from({ length: 12 }, () => 
      words[Math.floor(Math.random() * words.length)]
    ).join(' ');
    
    setMnemonic(mnemonic);
  };

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
          <h2 className="text-xl font-semibold text-gray-900">连接钱包</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              助记词
            </label>
            <div className="relative">
              <textarea
                value={mnemonic}
                onChange={(e) => setMnemonic(e.target.value)}
                placeholder="请输入12个单词的助记词，用空格分隔"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm"
                rows={3}
                required
              />
              <button
                type="button"
                onClick={() => setShowMnemonic(!showMnemonic)}
                className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
              >
                {showMnemonic ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              请输入您的12个单词助记词
            </p>
          </div>

          <div className="flex space-x-2">
            <button
              type="button"
              onClick={generateMnemonic}
              className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm"
            >
              生成测试助记词
            </button>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={isConnecting || !mnemonic.trim()}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isConnecting ? '连接中...' : '连接钱包'}
            </button>
          </div>
        </form>

        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-xs">
            <strong>注意:</strong> 这是测试版本，请使用测试助记词。不要输入真实的助记词。
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
};
