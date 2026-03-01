/**
 * 揭示按钮组件 V2.0
 * 允许用户揭示自己的random_value
 */

'use client';

import React, { useState, useEffect } from 'react';
import { randomValueStorage } from '@/services/randomValueStorage';
import { contractServiceV2 } from '@/services/contractV2';
import { walletService } from '@/services/wallet';
import toast from 'react-hot-toast';

interface RevealButtonV2Props {
  period: number;
  onSuccess?: () => void;
}

export function RevealButtonV2({ period, onSuccess }: RevealButtonV2Props) {
  const [randomValue, setRandomValue] = useState<string | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [hasRevealed, setHasRevealed] = useState(false);
  const [userAddress, setUserAddress] = useState<string>('');

  // 获取用户地址
  useEffect(() => {
    const addr = walletService.getAddress();
    if (addr) {
      setUserAddress(addr);
    }
  }, []);

  // 检查是否已购买和已揭示
  useEffect(() => {
    if (!userAddress) return;

    const checkStatus = async () => {
      setIsChecking(true);
      try {
        // 1. 从本地存储读取random_value
        const stored = await randomValueStorage.load({
          period,
          userAddress,
        });
        setRandomValue(stored);

        // 2. 查询链上揭示状态
        const status = await contractServiceV2.queryUserRevealStatus(
          period,
          userAddress
        );
        setHasRevealed(status.has_revealed);
      } catch (error) {
        console.error('检查揭示状态失败:', error);
      } finally {
        setIsChecking(false);
      }
    };

    checkStatus();
  }, [period, userAddress]);

  // 揭示承诺
  const handleReveal = async () => {
    if (!randomValue) {
      toast.error('未找到本地保存的随机值');
      return;
    }

    if (!userAddress) {
      toast.error('请先连接钱包');
      return;
    }

    setIsRevealing(true);
    const toastId = toast.loading('正在揭示...');

    try {
      // 调用合约揭示 ⭐⭐⭐
      const txHash = await contractServiceV2.revealMyCommitment(
        period,
        randomValue
      );

      toast.success(`揭示成功！交易哈希: ${txHash.substring(0, 10)}...`, {
        id: toastId,
        duration: 5000,
      });

      // 标记为已揭示
      await randomValueStorage.markRevealed({
        period,
        userAddress,
      });

      setHasRevealed(true);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      console.error('揭示失败:', error);
      
      // 处理常见错误
      let errorMessage = '揭示失败';
      if (error instanceof Error && error.message.includes('AlreadyRevealed')) {
        errorMessage = '您已经揭示过了';
        setHasRevealed(true);
      } else if (error instanceof Error && error.message.includes('RandomValueMismatch')) {
        errorMessage = '随机值不匹配，请检查您保存的随机值';
      } else if (error instanceof Error && error.message.includes('NotParticipant')) {
        errorMessage = '您未参与此期盲盒';
      }

      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsRevealing(false);
    }
  };

  // 手动输入随机值
  const [isManualMode, setIsManualMode] = useState(false);
  const [manualRandomValue, setManualRandomValue] = useState('');

  const handleManualReveal = async () => {
    if (!manualRandomValue.trim()) {
      toast.error('请输入随机值');
      return;
    }

    setIsRevealing(true);
    const toastId = toast.loading('正在揭示...');

    try {
      const txHash = await contractServiceV2.revealMyCommitment(
        period,
        manualRandomValue
      );

      toast.success(`揭示成功！交易哈希: ${txHash.substring(0, 10)}...`, {
        id: toastId,
        duration: 5000,
      });

      setHasRevealed(true);

      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      console.error('揭示失败:', error);
      const message = error instanceof Error ? error.message : '揭示失败';
      toast.error(message, { id: toastId });
    } finally {
      setIsRevealing(false);
    }
  };

  if (isChecking) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg text-center">
        <p className="text-gray-600">检查揭示状态...</p>
      </div>
    );
  }

  if (hasRevealed) {
    return (
      <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
        <p className="text-green-800 font-medium">✅ 您已经揭示承诺</p>
        <p className="text-sm text-green-700 mt-1">
          感谢您的参与！请等待所有用户完成揭示。
        </p>
      </div>
    );
  }

  if (!randomValue && !isManualMode) {
    return (
      <div className="space-y-3 p-4 bg-yellow-50 border border-yellow-300 rounded-lg">
        <p className="text-yellow-800 font-medium">
          ⚠️ 未找到本地保存的随机值
        </p>
        <p className="text-sm text-yellow-700">
          可能原因：
          <br />
          1. 您未在此浏览器购买
          <br />
          2. 浏览器数据已清理
          <br />
          3. 使用了其他设备
        </p>
        <button
          onClick={() => setIsManualMode(true)}
          className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
        >
          手动输入随机值
        </button>
      </div>
    );
  }

  if (isManualMode) {
    return (
      <div className="space-y-3 p-4 bg-blue-50 border border-blue-300 rounded-lg">
        <p className="text-blue-800 font-medium">手动输入随机值</p>
        <input
          type="text"
          value={manualRandomValue}
          onChange={(e) => setManualRandomValue(e.target.value)}
          placeholder="请输入购买时生成的随机值"
          className="w-full px-3 py-2 border rounded-lg"
        />
        <div className="flex gap-2">
          <button
            onClick={handleManualReveal}
            disabled={isRevealing}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isRevealing ? '揭示中...' : '确认揭示'}
          </button>
          <button
            onClick={() => setIsManualMode(false)}
            className="px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
          >
            取消
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 bg-white border border-gray-200 rounded-lg">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">
          您的随机值（已从本地读取）
        </p>
        <code className="block text-xs bg-gray-100 p-2 rounded break-all">
          {randomValue}
        </code>
      </div>

      <button
        onClick={handleReveal}
        disabled={isRevealing}
        className="w-full py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold rounded-lg hover:from-green-700 hover:to-blue-700 disabled:opacity-50"
      >
        {isRevealing ? '揭示中...' : '🔓 揭示我的承诺'}
      </button>

      <p className="text-xs text-gray-500">
        点击揭示按钮后，您的随机值将提交到链上进行验证。
      </p>
    </div>
  );
}

