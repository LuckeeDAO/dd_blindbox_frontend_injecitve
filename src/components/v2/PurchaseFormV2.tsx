/**
 * 购买表单组件 V2.0
 * 包含random_hash生成和提交
 */

'use client';

import React, { useState, useEffect } from 'react';
import { generateRandomPair } from '@/utils/crypto';
import { randomValueStorage } from '@/services/randomValueStorage';
import { contractServiceV2, BlindBoxInfoV2 } from '@/services/contractV2';
import { walletService } from '@/services/wallet';
import PaymentTokenSelector from '../PaymentTokenSelector';
import toast from 'react-hot-toast';
import { usePaymentTokens } from '@/hooks/usePaymentTokens';
import { useChain } from '@/hooks/useChain';

interface PurchaseFormV2Props {
  blindBox: BlindBoxInfoV2;
  onSuccess?: () => void;
}

function toAtomicAmount(value: number | string, decimals: number): string {
  const normalized = String(value).trim();
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return '0';
  }

  const [intPart, fracPart = ''] = normalized.split('.');
  const paddedFraction = (fracPart + '0'.repeat(decimals)).slice(0, decimals);
  const base = BigInt(10) ** BigInt(decimals);
  const intAtomic = BigInt(intPart || '0') * base;
  const fracAtomic = BigInt(paddedFraction || '0');
  return (intAtomic + fracAtomic).toString();
}

export function PurchaseFormV2({ blindBox, onSuccess }: PurchaseFormV2Props) {
  const [quantity, setQuantity] = useState(1);
  const [paymentToken, setPaymentToken] = useState('usdt'); // 默认USDT
  const [randomPair, setRandomPair] = useState<{
    randomValue: string;
    randomHash: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [userAddress, setUserAddress] = useState<string>('');
  const paymentTokens = usePaymentTokens();
  const { chain } = useChain();
  if (paymentTokens.length === 0) {
    return null;
  }

  useEffect(() => {
    if (paymentTokens.length > 0 && !paymentTokens.find((t) => t.id === paymentToken)) {
      setPaymentToken(paymentTokens[0].id);
    }
  }, [paymentToken, paymentTokens]);

  // 获取用户地址
  useEffect(() => {
    const addr = walletService.getAddress();
    if (addr) {
      setUserAddress(addr);
    }
  }, []);

  // 生成随机值对
  const handleGenerateRandom = async () => {
    setIsGenerating(true);
    try {
      const pair = await generateRandomPair();
      setRandomPair(pair);
      toast.success('随机值生成成功！');
    } catch (error) {
      console.error('生成随机值失败:', error);
      toast.error('生成随机值失败');
    } finally {
      setIsGenerating(false);
    }
  };

  // 购买盲盒
  const handlePurchase = async () => {
    if (!randomPair) {
      toast.error('请先生成随机值');
      return;
    }

    if (!userAddress) {
      toast.error('请先连接钱包');
      return;
    }

    setIsPurchasing(true);
    const toastId = toast.loading('正在购买...');

    try {
      // 1. 保存random_value到本地存储 ⭐⭐⭐ 重要！
      await randomValueStorage.save(
        {
          period: blindBox.period,
          userAddress,
        },
        randomPair.randomValue
      );
      console.log('✅ random_value已保存到本地');

      // 2. 计算总价（根据选择的代币）
      const selectedToken =
        paymentTokens.find((t) => t.id === paymentToken) || paymentTokens[0];
      const unitAmount = toAtomicAmount(selectedToken.price, selectedToken.decimals);
      const totalAmount = (BigInt(unitAmount) * BigInt(quantity)).toString();

      // 3. 调用合约购买 ⭐⭐⭐ 提交random_hash和payment_token
      const txHash = await contractServiceV2.buyBlindBox(
        blindBox.period,
        quantity,
        paymentToken,              // ⭐ 支付代币类型
        randomPair.randomHash,     // ⭐⭐⭐ V2.0核心
        [
          {
            denom: selectedToken.denom,
            amount: totalAmount,
          },
        ]
      );

      toast.success(`购买成功！交易哈希: ${txHash.substring(0, 10)}...`, {
        id: toastId,
        duration: 5000,
      });

      // 4. 显示保存提示
      toast.success(
        `⚠️ 重要：您的随机值已保存，请勿清理浏览器数据！\n随机值: ${randomPair.randomValue}`,
        {
          duration: 10000,
        }
      );

      // 5. 重置表单
      setRandomPair(null);
      setQuantity(1);

      // 6. 回调
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      console.error('购买失败:', error);
      const message = error instanceof Error ? error.message : '购买失败';
      toast.error(message, { id: toastId });
    } finally {
      setIsPurchasing(false);
    }
  };

  // 复制随机值
  const handleCopyRandomValue = () => {
    if (randomPair) {
      navigator.clipboard.writeText(randomPair.randomValue);
      toast.success('随机值已复制到剪贴板');
    }
  };

  // 导出随机值
  const handleExportRandomValue = () => {
    if (randomPair) {
      const data = {
        period: blindBox.period,
        randomValue: randomPair.randomValue,
        randomHash: randomPair.randomHash,
        timestamp: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `luckee-random-period-${blindBox.period}.json`;
      a.click();
      URL.revokeObjectURL(url);

      toast.success('随机值已导出');
    }
  };

  const remaining = blindBox.total_supply - blindBox.sold_count;
  const displayToken =
    paymentTokens.find((t) => t.denom === blindBox.price.denom) || paymentTokens[0];
  const displayDecimals = displayToken?.decimals ?? chain.nativeToken.decimals;
  const unitBase = 10 ** displayDecimals;
  const singlePrice = Number(blindBox.price.amount) / unitBase;

  return (
    <div className="space-y-6 p-6 bg-white rounded-lg shadow">
      <h3 className="text-xl font-bold">购买盲盒 (V2.0)</h3>

      {/* 盲盒信息 */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">期数：</span>
          <span className="font-medium">第 {blindBox.period} 期</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">单价：</span>
          <span className="font-medium">
            {singlePrice.toFixed(2)} {blindBox.price.denom.toUpperCase()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">剩余：</span>
          <span className="font-medium">
            {remaining} / {blindBox.total_supply}
          </span>
        </div>
      </div>

      {/* 支付代币选择 ⭐ */}
      <PaymentTokenSelector
        selectedToken={paymentToken}
        onTokenChange={setPaymentToken}
        quantity={quantity}
      />

      {/* 数量选择 */}
      <div>
        <label className="block text-sm font-medium mb-2">购买数量</label>
        <input
          type="number"
          min="1"
          max={remaining}
          value={quantity}
          onChange={(e) => setQuantity(Number(e.target.value))}
          className="w-full px-3 py-2 border rounded-lg"
        />
      </div>

      {/* 随机值生成 ⭐⭐⭐ V2.0核心 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium">随机值（步骤1）</label>
          <button
            onClick={handleGenerateRandom}
            disabled={isGenerating}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isGenerating ? '生成中...' : '生成随机值'}
          </button>
        </div>

        {randomPair && (
          <div className="space-y-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-yellow-800 mb-1">
                ⚠️ 随机值（请务必保存！）
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-white p-2 rounded break-all">
                  {randomPair.randomValue}
                </code>
                <button
                  onClick={handleCopyRandomValue}
                  className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  复制
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                哈希值（将提交到链上）
              </p>
              <code className="block text-xs bg-white p-2 rounded break-all">
                {randomPair.randomHash}
              </code>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleExportRandomValue}
                className="flex-1 px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600"
              >
                导出备份
              </button>
            </div>

            <p className="text-xs text-yellow-700">
              ⚠️ 重要提示：
              <br />
              1. 此随机值将自动保存到浏览器本地
              <br />
              2. 建议导出备份到安全位置
              <br />
              3. 揭示时需要此随机值，丢失将无法揭示！
              <br />
              4. 请勿清理浏览器数据
            </p>
          </div>
        )}
      </div>

      {/* 总价已在 PaymentTokenSelector 中显示 */}

      {/* 购买按钮 */}
      <button
        onClick={handlePurchase}
        disabled={!randomPair || isPurchasing || !userAddress}
        className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-lg hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPurchasing
          ? '购买中...'
          : !userAddress
          ? '请先连接钱包'
          : !randomPair
          ? '请先生成随机值'
          : `购买 ${quantity} 个盲盒`}
      </button>

      {/* V2.0说明 */}
      <div className="text-xs text-gray-500 space-y-1">
        <p>📌 V2.0承诺-揭秘机制：</p>
        <p>1. 生成随机值并计算哈希</p>
        <p>2. 提交哈希到链上（无法预测结果）</p>
        <p>3. 售罄后需揭示随机值</p>
        <p>4. 所有用户随机值组合生成最终结果</p>
      </div>
    </div>
  );
}
