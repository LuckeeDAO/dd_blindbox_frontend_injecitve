'use client';

import React, { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { BlindBoxCard } from '@/components/BlindBoxCard';
import { BuyForm } from '@/components/BuyForm';
import { OpenBoxAnimation } from '@/components/OpenBoxAnimation';
import { WalletConnect } from '@/components/WalletConnect';
import { useWalletStore } from '@/stores/wallet';
import { useBlindBoxStore } from '@/stores/blindbox';
import { BlindBox, Purchase } from '@/types';

export default function HomePage() {
  const [showWalletConnect, setShowWalletConnect] = useState(false);
  const [showBuyForm, setShowBuyForm] = useState(false);
  const [showOpenAnimation, setShowOpenAnimation] = useState(false);
  const [selectedBlindBox, setSelectedBlindBox] = useState<BlindBox | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [isBuying, setIsBuying] = useState(false);

  const { wallet, isConnecting } = useWalletStore();
  const { 
    blindBoxes, 
    purchases, 
    isLoading, 
    error,
    fetchBlindBoxes, 
    fetchPurchases, 
    buyBlindBox, 
    openBlindBox 
  } = useBlindBoxStore();

  useEffect(() => {
    fetchBlindBoxes();
  }, [fetchBlindBoxes]);

  useEffect(() => {
    if (wallet) {
      fetchPurchases(wallet.address);
    }
  }, [wallet, fetchPurchases]);

  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const handleConnectWallet = () => {
    setShowWalletConnect(true);
  };

  const handleBuyBlindBox = (blindBoxId: number) => {
    if (!wallet) {
      toast.error('请先连接钱包');
      return;
    }

    const blindBox = blindBoxes.find(bb => bb.id === blindBoxId);
    if (blindBox) {
      setSelectedBlindBox(blindBox);
      setShowBuyForm(true);
    }
  };

  const handleViewBlindBox = (blindBoxId: number) => {
    const blindBox = blindBoxes.find(bb => bb.id === blindBoxId);
    if (blindBox) {
      setSelectedBlindBox(blindBox);
      // 这里可以添加查看详情的逻辑
      toast('查看详情功能开发中...');
    }
  };

  const handleBuy = async (quantity: number, userRandom?: string) => {
    if (!selectedBlindBox) return;

    setIsBuying(true);
    try {
      const txHash = await buyBlindBox(selectedBlindBox.id, quantity, userRandom);
      toast.success(`购买成功！交易哈希: ${txHash}`);
      setShowBuyForm(false);
      setSelectedBlindBox(null);
    } catch (error) {
      console.error('Purchase failed:', error);
    } finally {
      setIsBuying(false);
    }
  };

  const handleOpenBlindBox = (purchaseId: number) => {
    const purchase = purchases.find(p => p.id === purchaseId);
    if (purchase) {
      setSelectedPurchase(purchase);
      setShowOpenAnimation(true);
    }
  };

  const handleOpenComplete = async () => {
    if (!selectedPurchase) return;

    try {
      const txHash = await openBlindBox(selectedPurchase.id);
      toast.success(`开盒成功！交易哈希: ${txHash}`);
    } catch (error) {
      console.error('Open box failed:', error);
    }
  };

  const handleCloseModals = () => {
    setShowWalletConnect(false);
    setShowBuyForm(false);
    setShowOpenAnimation(false);
    setSelectedBlindBox(null);
    setSelectedPurchase(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 头部 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-purple-600">Luckee 盲盒</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {wallet ? (
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-600">
                    <div className="font-medium">{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</div>
                    <div>余额: {parseInt(wallet.balance) / 1000000000000000000} INJ</div>
                  </div>
                  <button
                    onClick={() => useWalletStore.getState().disconnect()}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  >
                    断开连接
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors duration-200"
                >
                  {isConnecting ? '连接中...' : '连接钱包'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 欢迎区域 */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            欢迎来到 Luckee 盲盒市场
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                    基于 Injective 区块链的去中心化盲盒交易平台，公平透明的随机开盒机制，让每一次购买都充满惊喜。
          </p>
        </div>

        {/* 盲盒列表 */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">热门盲盒</h3>
            <button
              onClick={() => fetchBlindBoxes()}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors duration-200"
            >
              {isLoading ? '加载中...' : '刷新'}
            </button>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                  <div className="h-48 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : blindBoxes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blindBoxes.map((blindBox) => (
                <BlindBoxCard
                  key={blindBox.id}
                  blindBox={blindBox}
                  onBuy={handleBuyBlindBox}
                  onView={handleViewBlindBox}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">暂无盲盒</h3>
              <p className="text-gray-600">当前没有可用的盲盒，请稍后再试。</p>
            </div>
          )}
        </div>

        {/* 我的购买记录 */}
        {wallet && purchases.length > 0 && (
          <div className="mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">我的购买记录</h3>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        盲盒
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        数量
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        状态
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        购买时间
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {purchases.map((purchase) => (
                      <tr key={purchase.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          盲盒 #{purchase.blind_box_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {purchase.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            purchase.status === 'Opened' 
                              ? 'bg-green-100 text-green-800'
                              : purchase.status === 'Pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {purchase.status === 'Opened' ? '已开盒' : 
                             purchase.status === 'Pending' ? '待开盒' : '失败'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(purchase.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {purchase.status === 'Pending' && (
                            <button
                              onClick={() => handleOpenBlindBox(purchase.id)}
                              className="text-purple-600 hover:text-purple-900"
                            >
                              开盒
                            </button>
                          )}
                          {purchase.status === 'Opened' && purchase.nft_tokens.length > 0 && (
                            <span className="text-green-600">
                              获得 {purchase.nft_tokens.length} 个NFT
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 模态框 */}
      {showWalletConnect && (
        <WalletConnect onClose={handleCloseModals} />
      )}

      {showBuyForm && selectedBlindBox && (
        <BuyForm
          blindBox={selectedBlindBox}
          onBuy={handleBuy}
          onClose={handleCloseModals}
          isLoading={isBuying}
        />
      )}

      {showOpenAnimation && selectedPurchase && (
        <OpenBoxAnimation
          purchase={selectedPurchase}
          onComplete={handleOpenComplete}
          onClose={handleCloseModals}
        />
      )}
    </div>
  );
}