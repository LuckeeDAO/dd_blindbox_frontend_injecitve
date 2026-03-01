/**
 * V2.0 盲盒页面
 * 展示承诺-揭秘机制
 */

'use client';

import React, { useState, useEffect } from 'react';
import { PurchaseFormV2 } from '@/components/v2';
import { contractServiceV2, BlindBoxInfoV2 } from '@/services/contractV2';
import { useChain } from '@/hooks/useChain';

export default function BlindBoxV2Page() {
  const { chain } = useChain();
  const [currentSale, setCurrentSale] = useState<BlindBoxInfoV2 | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 加载当前销售的盲盒
  useEffect(() => {
    const loadCurrentSale = async () => {
      try {
        const sale = await contractServiceV2.queryCurrentSale();
        setCurrentSale(sale);
      } catch (error) {
        console.error('加载当前销售失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrentSale();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* 页面标题 */}
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2">
          Luckee 盲盒 V2.0
        </h1>
        <p className="text-gray-600">
          基于承诺-揭秘机制的去中心化随机盲盒
        </p>
      </div>

      {/* V2.0特性说明 */}
      <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <h2 className="text-xl font-bold mb-3">🌟 V2.0新特性</h2>
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="font-bold text-blue-600 mb-1">🔐 承诺-揭秘机制</p>
            <p className="text-gray-600">
              购买时提交哈希，售罄后揭示原值，确保公平
            </p>
          </div>
          <div>
            <p className="font-bold text-purple-600 mb-1">👥 用户协作随机</p>
            <p className="text-gray-600">
              所有用户随机值组合，无法预测和操控
            </p>
          </div>
          <div>
            <p className="font-bold text-orange-600 mb-1">⏰ 超时惩罚</p>
            <p className="text-gray-600">
              12小时内未全部揭示，仅发放三等奖
            </p>
          </div>
        </div>
      </div>

      {/* 当前销售 */}
      {currentSale && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* 盲盒信息 */}
          <div className="p-6 bg-white rounded-lg shadow">
            <h2 className="text-2xl font-bold mb-4">
              当前销售 - 第{currentSale.period}期
            </h2>
            <div className="space-y-3 mb-6">
              <div>
                <p className="text-sm text-gray-600">名称</p>
                <p className="font-medium">{currentSale.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">描述</p>
                <p className="text-gray-700">{currentSale.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">单价</p>
                  <p className="font-bold text-lg">
                    {(
                      Number(currentSale.price.amount) /
                      10 ** chain.nativeToken.decimals
                    ).toFixed(2)}{' '}
                    {currentSale.price.denom.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">状态</p>
                  <p className="font-bold text-lg">
                    {currentSale.status === 'Packaged' && '🔥 销售中'}
                    {currentSale.status === 'Revealed' && '🔒 揭示中'}
                  </p>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>销售进度</span>
                  <span className="font-bold">
                    {currentSale.sold_count}/{currentSale.total_supply}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all"
                    style={{
                      width: `${
                        (currentSale.sold_count / currentSale.total_supply) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                <div className="p-2 bg-yellow-50 rounded">
                  <p className="text-gray-600">一等奖</p>
                  <p className="font-bold">{currentSale.first_prize_count}</p>
                </div>
                <div className="p-2 bg-blue-50 rounded">
                  <p className="text-gray-600">二等奖</p>
                  <p className="font-bold">{currentSale.second_prize_count}</p>
                </div>
                <div className="p-2 bg-green-50 rounded">
                  <p className="text-gray-600">三等奖</p>
                  <p className="font-bold">{currentSale.third_prize_count}</p>
                </div>
              </div>
            </div>

            {currentSale.status === 'Packaged' && (
              <button
                onClick={() => setSelectedPeriod(currentSale.period)}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                购买盲盒
              </button>
            )}
            {currentSale.status === 'Revealed' && (
              <button
                onClick={() => setSelectedPeriod(currentSale.period)}
                className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                揭示承诺
              </button>
            )}
          </div>

          {/* 购买表单或揭示页面 */}
          <div>
            {selectedPeriod === null && currentSale.status === 'Packaged' && (
              <div className="p-6 bg-gray-50 rounded-lg text-center">
                <p className="text-gray-600">
                  点击&ldquo;购买盲盒&rdquo;按钮开始购买
                </p>
              </div>
            )}

            {selectedPeriod === currentSale.period &&
              currentSale.status === 'Packaged' && (
                <PurchaseFormV2
                  blindBox={currentSale}
                  onSuccess={() => {
                    // 刷新页面
                    window.location.reload();
                  }}
                />
              )}

            {selectedPeriod === currentSale.period &&
              currentSale.status === 'Revealed' && (
                <div className="p-6 bg-white rounded-lg shadow">
                  <h3 className="text-lg font-bold mb-4">揭示您的承诺</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    盲盒已售罄，请揭示您购买时生成的随机值
                  </p>
                  <button
                    onClick={() =>
                      (window.location.href = `/v2/reveal/${currentSale.period}`)
                    }
                    className="w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-blue-700"
                  >
                    前往揭示页面
                  </button>
                </div>
              )}
          </div>
        </div>
      )}

      {!currentSale && (
        <div className="p-12 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600 text-lg">暂无正在销售的盲盒</p>
        </div>
      )}

      {/* 使用说明 */}
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">📖 使用说明</h2>
        <ol className="list-decimal list-inside space-y-2 text-gray-700">
          <li>
            <strong>生成随机值</strong>：点击&ldquo;生成随机值&rdquo;按钮，系统会生成一个32位的随机字符串
          </li>
          <li>
            <strong>保存随机值</strong>：务必备份您的随机值！丢失将无法揭示
          </li>
          <li>
            <strong>购买盲盒</strong>：系统将提交随机值的SHA256哈希到链上
          </li>
          <li>
            <strong>等待售罄</strong>：盲盒售罄后进入揭示阶段
          </li>
          <li>
            <strong>揭示承诺</strong>：在揭示页面提交您的随机值进行验证
          </li>
          <li>
            <strong>等待分配</strong>：所有用户揭示后，系统自动分配NFT
          </li>
        </ol>
      </div>
    </div>
  );
}
