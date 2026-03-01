'use client';

import React, { useState, useEffect } from 'react';
import { WalletStatus } from '@/components/WalletStatus';
import { WalletConnectModal } from '@/components/WalletConnectModal';
import { BlindBoxCard } from '@/components/BlindBoxCard';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { BlindBox } from '@/types';
import { contractService } from '@/services/contract';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/useTranslation';
import { useChain } from '@/hooks/useChain';

export default function Home() {
  const { t } = useTranslation();
  const { chain } = useChain();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [blindBoxes, setBlindBoxes] = useState<BlindBox[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contractAddress = chain.contractAddress || process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || '';
  const contractStackLabel =
    chain.family === 'cosmos'
      ? 'CosmWasm'
      : chain.family === 'evm'
        ? 'Solidity / EVM'
        : 'Solana Program';

  useEffect(() => {
    const fetchBlindBoxes = async () => {
      try {
        setLoading(true);
        const boxes = await contractService.getBlindBoxes();
        
        console.log('📦 页面收到的盲盒数据:', boxes);
        console.log('📦 数据类型:', typeof boxes);
        console.log('📦 是否为数组:', Array.isArray(boxes));
        
        // 确保设置的是数组
        if (Array.isArray(boxes)) {
          setBlindBoxes(boxes);
          setError(null);
        } else {
          console.error('❌ 收到的数据不是数组:', boxes);
          setBlindBoxes([]);
          setError(t('blindBox.errorLoadingDesc'));
        }
      } catch (err) {
        console.error('Failed to fetch blind boxes:', err);
        const errorMessage = err instanceof Error ? err.message : t('blindBox.errorLoading');
        setError(errorMessage + '。' + t('error.tryAgain'));
        setBlindBoxes([]); // 确保出错时也设置为空数组
      } finally {
        setLoading(false);
      }
    };

    fetchBlindBoxes();
  }, [chain.key, t]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-purple-600">{t('blindBox.title')}</h1>
            </div>
            <div className="flex items-center space-x-4">
              <LanguageSwitcher />
              <Button
                variant="outline"
                onClick={() => window.location.href = '/warehouse'}
                className="text-purple-600 border-purple-600 hover:bg-purple-50"
              >
                {t('nav.warehouse')}
              </Button>
              <WalletStatus onConnect={() => setIsWalletModalOpen(true)} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{t('blindBox.subtitle')}</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">
            {t('blindBox.description')}
          </p>
          {contractAddress && (
            <div className="inline-flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
              <span className="text-sm text-blue-600 font-medium">{t('blindBox.contractAddress')}:</span>
              <code className="text-xs text-blue-800 font-mono">{contractAddress}</code>
              <span className="text-xs text-green-600">✓ {t('blindBox.connectedToTestnet')}</span>
            </div>
          )}
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900">{t('blindBox.hotBoxes')}</h3>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors duration-200"
            >
              {t('common.refresh')}
            </button>
          </div>
          
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">{t('blindBox.loadingBoxes')}</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">{t('blindBox.errorLoading')}</h3>
              <p className="text-gray-600 mb-4">{error}</p>
              <button 
                onClick={() => setIsWalletModalOpen(true)}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
              >
                {t('wallet.connectWallet')}
              </button>
            </div>
          ) : blindBoxes.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📦</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">{t('blindBox.noBoxes')}</h3>
              <p className="text-gray-600">{t('blindBox.noBoxesDesc')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blindBoxes.map((blindBox) => (
                <BlindBoxCard
                  key={blindBox.id}
                  blindBox={blindBox}
                  onBuy={(id) => {
                    window.location.href = `/buy/${id}`;
                  }}
                  onView={(id) => {
                    console.log('查看盲盒:', id);
                    // TODO: 实现查看详情逻辑
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* 平台介绍部分 */}
        <div className="mt-16 bg-white rounded-2xl shadow-lg p-8 md:p-12">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {t('about.title')}
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-purple-600 to-pink-600 mx-auto rounded-full"></div>
            </div>

            <div className="space-y-8">
              {/* 平台定位 */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border-l-4 border-purple-600">
                <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="text-2xl mr-3">🎁</span>
                  {t('about.platformTitle')}
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {t('about.platformDesc')}
                  <span className="font-semibold text-purple-600">{t('about.platformDescHighlight')}</span>
                  {t('about.platformDescEnd')}
                </p>
              </div>

              {/* 核心理念 */}
              <div className="bg-blue-50 rounded-xl p-6 border-l-4 border-blue-600">
                <h3 className="text-xl font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="text-2xl mr-3">🔍</span>
                  {t('about.whyTitle')}
                </h3>
                <p className="text-gray-700 leading-relaxed mb-3">
                  {t('about.whyDesc1')}
                  <span className="font-semibold text-red-600">{t('about.whyDesc1Highlight')}</span>
                  {t('about.whyDesc1End')}
                </p>
                <p className="text-gray-700 leading-relaxed">
                  {t('about.whyDesc2')}
                  <span className="font-semibold text-blue-600">{t('about.whyDesc2Highlight')}</span>
                  {t('about.whyDesc2End')}
                </p>
              </div>

              {/* 平台优势 */}
              <div className="grid md:grid-cols-3 gap-6">
                <div className="bg-green-50 rounded-xl p-6 text-center hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-3">✅</div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{t('about.feature1Title')}</h4>
                  <p className="text-sm text-gray-600">
                    {t('about.feature1Desc')}
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-6 text-center hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-3">⚖️</div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{t('about.feature2Title')}</h4>
                  <p className="text-sm text-gray-600">
                    {t('about.feature2Desc')}
                  </p>
                </div>
                <div className="bg-purple-50 rounded-xl p-6 text-center hover:shadow-md transition-shadow">
                  <div className="text-4xl mb-3">🤝</div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-2">{t('about.feature3Title')}</h4>
                  <p className="text-sm text-gray-600">
                    {t('about.feature3Desc')}
                  </p>
                </div>
              </div>

              {/* 邀请参与 */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 text-center text-white">
                <h3 className="text-2xl font-bold mb-4">{t('about.joinTitle')}</h3>
                <p className="text-lg mb-6 opacity-90">
                  {t('about.joinDesc')}
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <button
                    onClick={() => setIsWalletModalOpen(true)}
                    className="px-8 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200"
                  >
                    {t('about.startNow')}
                  </button>
                  <button
                    onClick={() => window.location.href = '/warehouse'}
                    className="px-8 py-3 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-400 transition-colors duration-200"
                  >
                    {t('about.learnMore')}
                  </button>
                </div>
              </div>

              {/* 技术支持 */}
              <div className="text-center pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">{t('about.techSupport')}</p>
                <div className="flex justify-center items-center space-x-6 text-gray-600">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{chain.name}</span>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">{t('about.blockchain')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">{contractStackLabel}</span>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">{t('about.smartContract')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold">Next.js</span>
                    <span className="text-xs bg-gray-200 px-2 py-1 rounded">{t('about.frontend')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <WalletConnectModal 
        isOpen={isWalletModalOpen} 
        onClose={() => setIsWalletModalOpen(false)} 
      />
    </div>
  );
}
