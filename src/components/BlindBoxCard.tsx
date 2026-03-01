'use client';

import React, { useState, useEffect } from 'react';
import { BlindBox, BlindBoxStatus, BlindBoxStats } from '@/types';
import { motion } from 'framer-motion';
import { contractService } from '@/services/contract';
import { useTranslation } from '@/hooks/useTranslation';
import { useChain } from '@/hooks/useChain';

interface BlindBoxCardProps {
  blindBox: BlindBox;
  onBuy?: (blindBoxId: number) => void;
  onView?: (blindBoxId: number) => void;
}

export const BlindBoxCard: React.FC<BlindBoxCardProps> = ({
  blindBox,
  onBuy,
  onView
}) => {
  const { t } = useTranslation();
  const { chain } = useChain();
  const [stats, setStats] = useState<BlindBoxStats | null>(null);

  const inferDecimals = (denom: string) => {
    const lower = denom.toLowerCase();
    if (lower.includes('usdt') || lower.includes('usdc')) return 6;
    return chain.nativeToken.decimals;
  };

  const formatTokenAmount = (amount: string, denom: string) => {
    const decimals = inferDecimals(denom);
    const base = 10 ** decimals;
    return (Number(amount) / base).toFixed(4);
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsData = await contractService.getBlindBoxStats(blindBox.id);
        setStats(statsData);
      } catch (error) {
        console.error('Failed to fetch blind box stats:', error);
      }
    };

    fetchStats();
  }, [blindBox.id]);
  const getStatusColor = (status: BlindBoxStatus) => {
    switch (status) {
      case BlindBoxStatus.Preparing:
        return 'bg-gray-100 text-gray-800';
      case BlindBoxStatus.Packaged:
        return 'bg-green-100 text-green-800';
      case BlindBoxStatus.Revealed:
        return 'bg-orange-100 text-orange-800';
      case BlindBoxStatus.Rewarded:
        return 'bg-blue-100 text-blue-800';
      case BlindBoxStatus.AfterSale:
        return 'bg-purple-100 text-purple-800';
      case BlindBoxStatus.Completed:
        return 'bg-gray-100 text-gray-800';
      case BlindBoxStatus.Paused:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: BlindBoxStatus) => {
    switch (status) {
      case BlindBoxStatus.Preparing:
        return t('blindBox.statusPreparing');
      case BlindBoxStatus.Packaged:
        return t('blindBox.statusPackaged');
      case BlindBoxStatus.Revealed:
        return t('blindBox.statusRevealed');
      case BlindBoxStatus.Rewarded:
        return t('blindBox.statusRewarded');
      case BlindBoxStatus.AfterSale:
        return t('blindBox.statusAfterSale');
      case BlindBoxStatus.Completed:
        return t('blindBox.statusCompleted');
      case BlindBoxStatus.Paused:
        return t('blindBox.statusPaused');
      default:
        return t('blindBox.statusUnknown');
    }
  };

  const isAvailable = blindBox.status === BlindBoxStatus.Packaged;
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
          <div>
            <h3 className="text-xl font-semibold text-gray-900 truncate">
              {blindBox.name}
            </h3>
            <p className="text-sm text-gray-500">{t('blindBox.period')} {blindBox.period}</p>
          </div>
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
            {formatTokenAmount(blindBox.price.amount, blindBox.price.denom)}{' '}
            {blindBox.price.denom.toUpperCase()}
          </span>
        </div>

        {/* 进度条 */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>{t('blindBox.sold')}</span>
            <span>{blindBox.sold_count} / {blindBox.total_supply}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{t('blindBox.remaining')}: {blindBox.total_supply - blindBox.sold_count}</span>
            <span>{t('blindBox.progress')}: {progressPercentage.toFixed(1)}%</span>
          </div>
        </div>

        {/* 统计信息 */}
        {stats && (
          <div className="mb-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="bg-blue-50 p-2 rounded">
                <div className="text-blue-600 font-medium">{t('blindBox.participants')}</div>
                <div className="text-blue-800">{stats.unique_buyers}</div>
              </div>
              <div className="bg-green-50 p-2 rounded">
                <div className="text-green-600 font-medium">{t('blindBox.totalRevenue')}</div>
                <div className="text-green-800">
                  {formatTokenAmount(stats.total_revenue.amount, stats.total_revenue.denom)}{' '}
                  {stats.total_revenue.denom.toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 稀有度配置 */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">{t('blindBox.prizeDistribution')}</h4>
          <div className="flex flex-wrap gap-1">
            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
              一等奖 (0.1%)
            </span>
            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
              二等奖 (9.9%)
            </span>
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
              三等奖 (90%)
            </span>
          </div>
        </div>

        {/* 按钮 */}
        <div className="flex gap-2">
          <button
            onClick={() => onView?.(blindBox.id)}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
          >
            {t('common.viewDetails')}
          </button>
          <button
            onClick={() => onBuy?.(blindBox.id)}
            disabled={!isAvailable}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              isAvailable
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isAvailable ? t('blindBox.buy') : t('blindBox.unavailable')}
          </button>
        </div>
      </div>
    </motion.div>
  );
};
