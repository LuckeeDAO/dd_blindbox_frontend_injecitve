/**
 * 揭示进度组件 V2.0
 * 显示揭示进度、剩余时间、未揭示用户
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { contractServiceV2, RevealProgressResponse, UnrevealedUsersResponse } from '@/services/contractV2';

interface RevealProgressV2Props {
  period: number;
  refreshInterval?: number; // 刷新间隔(ms)，默认5000
}

export function RevealProgressV2({ period, refreshInterval = 5000 }: RevealProgressV2Props) {
  const [progress, setProgress] = useState<RevealProgressResponse | null>(null);
  const [unrevealedUsers, setUnrevealedUsers] = useState<UnrevealedUsersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取揭示进度
  const fetchProgress = useCallback(async () => {
    try {
      const progressData = await contractServiceV2.queryRevealProgress(period);
      setProgress(progressData);

      // 如果还有未揭示的用户，获取列表
      if (progressData.revealed_count < progressData.total_participants) {
        const unrevealedData = await contractServiceV2.queryUnrevealedUsers(period, 20);
        setUnrevealedUsers(unrevealedData);
      }

      setError(null);
    } catch (err: unknown) {
      console.error('获取揭示进度失败:', err);
      const message = err instanceof Error ? err.message : '获取进度失败';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [period]);

  // 首次加载和定时刷新
  useEffect(() => {
    fetchProgress();

    const timer = setInterval(fetchProgress, refreshInterval);
    return () => clearInterval(timer);
  }, [fetchProgress, refreshInterval]);

  if (isLoading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-20 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">❌ {error}</p>
      </div>
    );
  }

  if (!progress) {
    return null;
  }

  const isComplete = progress.revealed_count === progress.total_participants;
  const hasTimeout = progress.is_timeout;

  return (
    <div className="space-y-4">
      {/* 进度卡片 */}
      <div className="p-6 bg-white rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">揭示进度</h3>
          <button
            onClick={fetchProgress}
            className="px-3 py-1 text-sm bg-gray-100 rounded hover:bg-gray-200"
          >
            🔄 刷新
          </button>
        </div>

        {/* 进度条 */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">
              {progress.revealed_count} / {progress.total_participants} 人已揭示
            </span>
            <span className={`font-bold ${
              progress.reveal_percentage >= 100
                ? 'text-green-600'
                : progress.reveal_percentage >= 50
                ? 'text-blue-600'
                : 'text-orange-600'
            }`}>
              {progress.reveal_percentage.toFixed(1)}%
            </span>
          </div>

          <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isComplete
                  ? 'bg-green-500'
                  : hasTimeout
                  ? 'bg-red-500'
                  : 'bg-blue-500'
              }`}
              style={{ width: `${progress.reveal_percentage}%` }}
            />
          </div>
        </div>

        {/* 状态提示 */}
        {isComplete && (
          <div className="p-3 bg-green-100 border border-green-300 rounded-lg">
            <p className="text-green-800 font-medium">
              ✅ 所有用户已完成揭示！
            </p>
            <p className="text-sm text-green-700 mt-1">
              系统将自动分配NFT，请稍候...
            </p>
          </div>
        )}

        {hasTimeout && !isComplete && (
          <div className="p-3 bg-red-100 border border-red-300 rounded-lg">
            <p className="text-red-800 font-medium">
              ⏰ 揭示超时！触发惩罚机制
            </p>
            <p className="text-sm text-red-700 mt-1">
              未全部揭示，所有参与者仅获得三等奖
            </p>
          </div>
        )}

        {!isComplete && !hasTimeout && (
          <div className="p-3 bg-blue-100 border border-blue-300 rounded-lg">
            <p className="text-blue-800 font-medium">
              ⏳ 等待所有用户完成揭示...
            </p>
            <p className="text-sm text-blue-700 mt-1">
              还有 {progress.total_participants - progress.revealed_count} 人未揭示
            </p>
          </div>
        )}
      </div>

      {/* 未揭示用户列表 */}
      {unrevealedUsers && unrevealedUsers.count > 0 && (
        <div className="p-6 bg-white rounded-lg shadow">
          <h4 className="text-md font-bold mb-3">
            未揭示用户 ({unrevealedUsers.count}人)
          </h4>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {unrevealedUsers.users.map((user, index) => (
              <div
                key={user}
                className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm"
              >
                <span className="text-gray-500">{index + 1}.</span>
                <code className="flex-1 text-xs">
                  {user}
                </code>
              </div>
            ))}
          </div>

          {unrevealedUsers.count > unrevealedUsers.users.length && (
            <p className="text-sm text-gray-500 mt-2">
              还有 {unrevealedUsers.count - unrevealedUsers.users.length} 人未显示...
            </p>
          )}
        </div>
      )}

      {/* 实时更新提示 */}
      <div className="text-xs text-gray-500 text-center">
        自动刷新中... (每{refreshInterval / 1000}秒)
      </div>
    </div>
  );
}

