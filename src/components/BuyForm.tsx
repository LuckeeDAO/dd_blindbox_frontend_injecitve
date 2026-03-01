'use client';

import React, { useState } from 'react';
import { BlindBox } from '@/types';
import { motion } from 'framer-motion';
import PaymentTokenSelector from './PaymentTokenSelector';
import { usePaymentTokens } from '@/hooks/usePaymentTokens';

interface BuyFormProps {
  blindBox: BlindBox;
  onBuy: (quantity: number, paymentToken: string, userRandom?: string) => Promise<void>;
  onClose: () => void;
  isLoading?: boolean;
}

export const BuyForm: React.FC<BuyFormProps> = ({
  blindBox,
  onBuy,
  onClose,
  isLoading = false
}) => {
  const [quantity, setQuantity] = useState(1);
  const [paymentToken, setPaymentToken] = useState('usdt'); // 默认USDT
  const [userRandom, setUserRandom] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const paymentTokens = usePaymentTokens();
  if (paymentTokens.length === 0) {
    return null;
  }

  const maxQuantity = Math.min(blindBox.max_per_user, blindBox.total_supply - blindBox.sold_count);
  
  // 根据选择的代币计算价格
  const currentToken =
    paymentTokens.find((t) => t.id === paymentToken) || paymentTokens[0];
  const totalPrice = currentToken.price * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (quantity < 1 || quantity > maxQuantity) {
      return;
    }

    try {
      await onBuy(quantity, paymentToken, userRandom.trim() || undefined);
      onClose();
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  const generateRandom = () => {
    const random = Math.random().toString(36).substring(2, 15);
    setUserRandom(random);
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
          <h2 className="text-xl font-semibold text-gray-900">购买盲盒</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{blindBox.name}</h3>
          <p className="text-gray-600 text-sm">{blindBox.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 支付代币选择 ⭐ */}
          <PaymentTokenSelector
            selectedToken={paymentToken}
            onTokenChange={setPaymentToken}
            quantity={quantity}
          />

          {/* 数量选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              购买数量
            </label>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(maxQuantity, parseInt(e.target.value) || 1)))}
                className="w-16 text-center border border-gray-300 rounded px-2 py-1"
              />
              <button
                type="button"
                onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
                disabled={quantity >= maxQuantity}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              最多可购买 {maxQuantity} 个
            </p>
          </div>

          {/* 高级选项 */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-sm text-purple-600 hover:text-purple-700"
            >
              {showAdvanced ? '隐藏' : '显示'} 高级选项
            </button>
            
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 space-y-2"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    用户随机数（可选）
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={userRandom}
                      onChange={(e) => setUserRandom(e.target.value)}
                      placeholder="输入随机数或点击生成"
                      className="flex-1 border border-gray-300 rounded px-3 py-2 text-sm"
                    />
                    <button
                      type="button"
                      onClick={generateRandom}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                    >
                      生成
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    提供随机数可以增加开盒的随机性
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* 价格信息已在 PaymentTokenSelector 中显示 */}

          {/* 提交按钮 */}
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
              disabled={isLoading || quantity < 1 || quantity > maxQuantity}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {isLoading ? '购买中...' : '确认购买'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
