'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { BlindBox } from '@/types';
import { contractService } from '@/services/contract';
import { BuyBlindBoxForm } from '@/components/BuyBlindBoxForm';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, AlertCircle } from 'lucide-react';

export default function BuyBlindBoxPage() {
  const params = useParams();
  const router = useRouter();
  const [blindBox, setBlindBox] = useState<BlindBox | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const blindBoxId = parseInt(params?.id as string || '0');

  const loadBlindBox = useCallback(async () => {
    try {
      setLoading(true);
      const blindBoxes = await contractService.getBlindBoxes();
      const foundBlindBox = blindBoxes.find(bb => bb.id === blindBoxId);
      
      if (foundBlindBox) {
        setBlindBox(foundBlindBox);
      } else {
        setError('盲盒不存在');
      }
    } catch (err) {
      setError('加载盲盒失败');
      console.error('Error loading blind box:', err);
    } finally {
      setLoading(false);
    }
  }, [blindBoxId]);

  useEffect(() => {
    loadBlindBox();
  }, [loadBlindBox]);

  const handleSuccess = () => {
    // 购买成功后跳转到盲盒详情页面
    router.push(`/blindbox/${blindBoxId}`);
  };

  const handleCancel = () => {
    // 取消购买，返回盲盒列表
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-white" />
            <p className="text-white">加载盲盒信息中...</p>
        </div>
      </div>
    );
  }

  if (error || !blindBox) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">错误</h2>
            <p className="text-gray-400 mb-4">
              {error || '盲盒不存在'}
            </p>
            <Button onClick={() => router.push('/')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-4 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回盲盒列表
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-white mb-2">
              购买盲盒
            </h1>
            <p className="text-gray-400">
              选择你偏好的 NFT 并输入幸运数字，完成购买
            </p>
          </div>
        </div>

        {/* Purchase Form */}
        <div className="flex justify-center">
          <BuyBlindBoxForm
            blindBox={blindBox}
            onSuccess={handleSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
