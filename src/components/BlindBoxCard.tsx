'use client';

import React from 'react';
import { BlindBox, BlindBoxStatus } from '@/types';
import { motion } from 'framer-motion';

interface BlindBoxCardProps {
  blindBox: BlindBox;
  onBuy: (blindBoxId: number) => void;
  onView: (blindBoxId: number) => void;
}

export const BlindBoxCard: React.FC<BlindBoxCardProps> = ({
  blindBox,
  onBuy,
  onView
}) => {
  const getStatusColor = (status: BlindBoxStatus) => {
    switch (status) {
      case BlindBoxStatus.Active:
        return 'bg-green-100 text-green-800';
      case BlindBoxStatus.Paused:
        return 'bg-yellow-100 text-yellow-800';
      case BlindBoxStatus.SoldOut:
        return 'bg-red-100 text-red-800';
      case BlindBoxStatus.Ended:
        return 'bg-gray-100 text-gray-800';
      case BlindBoxStatus.Settled:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: BlindBoxStatus) => {
    switch (status) {
      case BlindBoxStatus.Active:
        return '活跃';
      case BlindBoxStatus.Paused:
        return '暂停';
      case BlindBoxStatus.SoldOut:
        return '售罄';
      case BlindBoxStatus.Ended:
        return '结束';
      case BlindBoxStatus.Settled:
        return '已结算';
      default:
        return '未知';
    }
  };

  const isAvailable = blindBox.status === BlindBoxStatus.Active;
  const progressPercentage = (blindBox.sold_count / blindBox.total_supply) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      {/* 盲盒图片占位符 */}
      <div className="h-48 bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
        <div className="text-white text-4xl font-bold">
          {blindBox.name.charAt(0)}
        </div>
      </div>

      <div className="p-6">
        {/* 标题和状态 */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-semibold text-gray-900 truncate">
            {blindBox.name}
          </h3>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(blindBox.status)}`}>
            {getStatusText(blindBox.status)}
          </span>
        </div>

        {/* 描述 */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {blindBox.description}
        </p>

        {/* 价格 */}
        <div className="mb-4">
          <span className="text-2xl font-bold text-purple-600">
            {parseInt(blindBox.price.amount) / 1000000000000000000} INJ
          </span>
        </div>

        {/* 进度条 */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>已售出</span>
            <span>{blindBox.sold_count} / {blindBox.total_supply}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* 稀有度配置 */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">稀有度分布</h4>
          <div className="flex flex-wrap gap-1">
            {blindBox.rarity_config.map((config, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
              >
                {config.rarity} ({config.probability / 10}%)
              </span>
            ))}
          </div>
        </div>

        {/* 按钮 */}
        <div className="flex gap-2">
          <button
            onClick={() => onView(blindBox.id)}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            查看详情
          </button>
          <button
            onClick={() => onBuy(blindBox.id)}
            disabled={!isAvailable}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              isAvailable
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isAvailable ? '购买' : '不可购买'}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
