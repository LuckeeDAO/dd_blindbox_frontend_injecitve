/**
 * 揭示页面组件 V2.0
 * 整合揭示按钮、揭示进度、未揭示用户列表
 */

'use client';

import React, { useState, useEffect } from 'react';
import { RevealButtonV2 } from './RevealButtonV2';
import { RevealProgressV2 } from './RevealProgressV2';
import { contractServiceV2, BlindBoxInfoV2 } from '@/services/contractV2';

interface RevealPageV2Props {
  period: number;
}

export function RevealPageV2({ period }: RevealPageV2Props) {
  const [blindBox, setBlindBox] = useState<BlindBoxInfoV2 | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // 加载盲盒信息
  useEffect(() => {
    const loadBlindBox = async () => {
      try {
        const data = await contractServiceV2.queryBlindBoxByPeriod(period);
        setBlindBox(data);
      } catch (error) {
        console.error('加载盲盒失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBlindBox();
  }, [period]);

  const handleRevealSuccess = () => {
    // 刷新进度
    setRefreshKey(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!blindBox) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">❌ 未找到第{period}期盲盒</p>
        </div>
      </div>
    );
  }

  const canReveal = blindBox.status === 'Revealed';
  const isCompleted = ['Rewarded', 'AfterSale', 'Completed'].includes(blindBox.status);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold mb-2">
          揭示承诺 - 第{period}期
        </h1>
        <p className="text-gray-600">
          {blindBox.name}
        </p>
      </div>

      {/* 盲盒状态 */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">状态</p>
            <p className="font-bold text-lg">
              {blindBox.status === 'Packaged' && '🔥 销售中'}
              {blindBox.status === 'Revealed' && '🔒 揭示中'}
              {blindBox.status === 'Rewarded' && '🎁 奖励发放'}
              {blindBox.status === 'Completed' && '✅ 已完成'}
            </p>
          </div>
          <div>
            <p className="text-gray-600">参与人数</p>
            <p className="font-bold text-lg">{blindBox.participants_count}</p>
          </div>
          <div>
            <p className="text-gray-600">已售</p>
            <p className="font-bold text-lg">
              {blindBox.sold_count}/{blindBox.total_supply}
            </p>
          </div>
          <div>
            <p className="text-gray-600">惩罚状态</p>
            <p className={`font-bold text-lg ${
              blindBox.is_default_random ? 'text-red-600' : 'text-green-600'
            }`}>
              {blindBox.is_default_random ? '已触发' : '正常'}
            </p>
          </div>
        </div>
      </div>

      {/* 状态提示 */}
      {blindBox.status === 'Packaged' && (
        <div className="p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
          <p className="text-yellow-800 font-medium">
            ⏳ 盲盒尚未售罄，请等待售罄后再进行揭示
          </p>
        </div>
      )}

      {canReveal && (
        <>
          {/* 揭示按钮 */}
          <div>
            <h2 className="text-xl font-bold mb-3">第一步：揭示您的承诺</h2>
            <RevealButtonV2
              period={period}
              onSuccess={handleRevealSuccess}
            />
          </div>

          {/* 揭示进度 */}
          <div>
            <h2 className="text-xl font-bold mb-3">第二步：等待所有用户揭示</h2>
            <RevealProgressV2
              key={refreshKey}
              period={period}
              refreshInterval={5000}
            />
          </div>
        </>
      )}

      {isCompleted && (
        <div className="p-6 bg-green-50 border border-green-300 rounded-lg">
          <p className="text-green-800 font-bold text-lg mb-2">
            ✅ 揭示已完成！
          </p>
          <p className="text-green-700">
            {blindBox.is_default_random
              ? '⚠️ 由于超时，所有参与者获得三等奖'
              : '🎉 NFT已正常分配，请查看您的奖品！'}
          </p>
        </div>
      )}

      {/* V2.0说明 */}
      <div className="p-4 bg-gray-50 rounded-lg text-sm text-gray-600 space-y-2">
        <p className="font-medium text-gray-800">📌 V2.0承诺-揭秘机制说明：</p>
        <ol className="list-decimal list-inside space-y-1 ml-2">
          <li>售罄后，盲盒进入&ldquo;揭示中&rdquo;状态</li>
          <li>每个参与者需要揭示购买时生成的random_value</li>
          <li>系统自动验证random_value与之前提交的random_hash是否匹配</li>
          <li>所有用户的random_value组合生成最终随机数</li>
          <li>如果12小时内未全部揭示，触发超时惩罚（仅三等奖）</li>
        </ol>
      </div>
    </div>
  );
}

