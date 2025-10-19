'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Purchase } from '@/types';

interface OpenBoxAnimationProps {
  purchase: Purchase;
  onComplete: () => void;
  onClose: () => void;
}

export const OpenBoxAnimation: React.FC<OpenBoxAnimationProps> = ({
  purchase,
  onComplete,
  onClose
}) => {
  const [isAnimating, setIsAnimating] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    '正在验证购买记录...',
    '生成随机数...',
    '计算NFT分发...',
    '开盒中...',
    '完成！'
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsAnimating(false);
      setShowResult(true);
      onComplete();
    }, 5000);

    const stepTimer = setInterval(() => {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    }, 1000);

    return () => {
      clearTimeout(timer);
      clearInterval(stepTimer);
    };
  }, [onComplete, steps.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
    >
      <div className="bg-white rounded-lg p-8 w-full max-w-md mx-4 text-center">
        {isAnimating ? (
          <div className="space-y-6">
            {/* 盲盒图标 */}
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-24 h-24 mx-auto bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg flex items-center justify-center"
            >
              <span className="text-white text-3xl font-bold">
                {purchase.blind_box_id}
              </span>
            </motion.div>

            {/* 进度步骤 */}
            <div className="space-y-2">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0.3 }}
                  animate={{ 
                    opacity: index <= currentStep ? 1 : 0.3,
                    color: index <= currentStep ? '#7c3aed' : '#6b7280'
                  }}
                  className="text-sm font-medium"
                >
                  {step}
                </motion.div>
              ))}
            </div>

            {/* 进度条 */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-purple-600 h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>

            {/* 加载动画 */}
            <div className="flex justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full"
              />
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="space-y-6"
              >
                {/* 成功图标 */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center"
                >
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>

                {/* 结果标题 */}
                <h2 className="text-2xl font-bold text-gray-900">开盒成功！</h2>

                {/* NFT结果 */}
                <div className="space-y-3">
                  <h3 className="text-lg font-medium text-gray-700">获得NFT</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {purchase.nft_tokens.map((token, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                        className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                      >
                        <div className="text-sm font-medium text-gray-900">
                          NFT #{token}
                        </div>
                        <div className="text-xs text-gray-500">
                          稀有度: 待定
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* 统计信息 */}
                <div className="bg-gray-50 rounded-lg p-4 text-left">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">购买数量:</span>
                    <span className="text-gray-900">{purchase.quantity}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">获得NFT:</span>
                    <span className="text-gray-900">{purchase.nft_tokens.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">开盒时间:</span>
                    <span className="text-gray-900">
                      {purchase.opened_at ? new Date(purchase.opened_at).toLocaleString() : '刚刚'}
                    </span>
                  </div>
                </div>

                {/* 关闭按钮 */}
                <button
                  onClick={onClose}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
                >
                  完成
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
};
