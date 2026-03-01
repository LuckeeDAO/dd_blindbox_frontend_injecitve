'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { PrizeNumbersInput } from '@/components/PrizeNumbersInput';
import { contractService } from '@/services/contract';
import { PurchaseNumbersResponse, NumbersInputStatus } from '@/types';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function InputNumbersPage() {
  const params = useParams();
  const router = useRouter();
  const purchaseId = parseInt(params?.id as string || '0');
  
  const [purchaseNumbers, setPurchaseNumbers] = useState<PurchaseNumbersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 生成盲盒编号
  const generateBlindBoxNumbers = useCallback((purchaseId: number, quantity: number): string[] => {
    const numbers: string[] = [];
    for (let i = 0; i < quantity; i++) {
      numbers.push(`BB${String(purchaseId).padStart(6, '0')}-${String(i + 1).padStart(3, '0')}`);
    }
    return numbers;
  }, []);

  // 加载购买号码信息
  const loadPurchaseNumbers = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const numbers = await contractService.getPurchaseNumbers(purchaseId);
      if (numbers) {
        setPurchaseNumbers(numbers);
      } else {
        setError('无法加载购买号码信息');
      }
    } catch (err) {
      console.error('Failed to load purchase numbers:', err);
      setError('加载购买号码信息失败');
    } finally {
      setIsLoading(false);
    }
  }, [purchaseId]);

  // 提交号码
  const handleNumbersSubmit = useCallback(async (firstPrizeNumbers: number[], secondPrizeNumbers: number[]) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);

      const result = await contractService.inputPrizeNumbers({
        purchase_id: purchaseId,
        first_prize_numbers: firstPrizeNumbers,
        second_prize_numbers: secondPrizeNumbers
      });

      if (result.success) {
        setSuccess('号码提交成功！');
        // 重新加载号码信息
        await loadPurchaseNumbers();
      } else {
        setError(result.error || '号码提交失败');
      }
    } catch (err) {
      console.error('Failed to submit numbers:', err);
      setError('号码提交失败');
    } finally {
      setIsSubmitting(false);
    }
  }, [purchaseId, loadPurchaseNumbers]);

  // 验证号码
  const handleValidateNumbers = useCallback(async () => {
    try {
      setIsValidating(true);
      setError(null);
      setSuccess(null);

      const result = await contractService.validatePrizeNumbers(purchaseId);

      if (result.success) {
        setSuccess('号码验证成功！');
        // 重新加载号码信息
        await loadPurchaseNumbers();
      } else {
        setError(result.error || '号码验证失败');
      }
    } catch (err) {
      console.error('Failed to validate numbers:', err);
      setError('号码验证失败');
    } finally {
      setIsValidating(false);
    }
  }, [purchaseId, loadPurchaseNumbers]);

  // 初始加载
  useEffect(() => {
    if (purchaseId > 0) {
      loadPurchaseNumbers();
    }
  }, [purchaseId, loadPurchaseNumbers]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500 mb-4" />
            <p className="text-gray-600">加载中...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error && !purchaseNumbers) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <AlertCircle className="h-8 w-8 text-red-500 mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={() => router.back()}>返回</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 根据号码输入状态确定页面内容
  const getStatusInfo = () => {
    if (!purchaseNumbers) return null;

    switch (purchaseNumbers.numbers_input_status) {
      case NumbersInputStatus.NotInput:
        return {
          title: '输入中奖号码',
          description: '请输入一等奖号码和二等奖号码',
          showInput: true,
          showValidate: false
        };
      case NumbersInputStatus.Input:
        return {
          title: '验证中奖号码',
          description: '号码已输入，请验证后开盒',
          showInput: false,
          showValidate: true
        };
      case NumbersInputStatus.Validating:
        return {
          title: '号码验证中',
          description: '正在验证您的号码，请稍候...',
          showInput: false,
          showValidate: false
        };
      case NumbersInputStatus.Validated:
        return {
          title: '号码验证完成',
          description: '号码验证成功，可以开盒了！',
          showInput: false,
          showValidate: false
        };
      default:
        return null;
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {statusInfo?.title || '中奖号码管理'}
          </h1>
          <p className="text-gray-600">
            {statusInfo?.description || '管理您的中奖号码'}
          </p>
        </div>

        {/* 状态信息 */}
        {purchaseNumbers && (
          <div className="max-w-2xl mx-auto mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  购买信息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-600">购买ID：</span>
                    <span className="font-mono">{purchaseNumbers.purchase_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">号码状态：</span>
                    <Badge variant={
                      purchaseNumbers.numbers_input_status === NumbersInputStatus.Validated 
                        ? 'default' 
                        : 'secondary'
                    }>
                      {purchaseNumbers.numbers_input_status}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-gray-600">验证状态：</span>
                    <Badge variant={purchaseNumbers.is_valid ? 'default' : 'destructive'}>
                      {purchaseNumbers.is_valid ? '有效' : '无效'}
                    </Badge>
                  </div>
                  {purchaseNumbers.first_prize_numbers.length > 0 && (
                    <div>
                      <span className="text-gray-600">一等奖号码：</span>
                      <span className="font-mono">{purchaseNumbers.first_prize_numbers.join(', ')}</span>
                    </div>
                  )}
                </div>
                
                {purchaseNumbers.validation_errors.length > 0 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-semibold text-red-800 mb-2">验证错误：</h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {purchaseNumbers.validation_errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* 成功/错误消息 */}
        {success && (
          <div className="max-w-2xl mx-auto mb-6">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="flex items-center gap-2 py-4">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-700">{success}</span>
              </CardContent>
            </Card>
          </div>
        )}

        {error && (
          <div className="max-w-2xl mx-auto mb-6">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="flex items-center gap-2 py-4">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-700">{error}</span>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 号码输入组件 */}
        {statusInfo?.showInput && (
          <PrizeNumbersInput
            purchaseId={purchaseId}
            blindBoxNumbers={generateBlindBoxNumbers(purchaseId, 3)} // 假设购买3个盲盒
            onNumbersSubmit={handleNumbersSubmit}
            onValidateNumbers={handleValidateNumbers}
            initialFirstPrizeNumbers={purchaseNumbers?.first_prize_numbers}
            initialSecondPrizeNumbers={purchaseNumbers?.second_prize_numbers}
            isSubmitting={isSubmitting}
            isValidating={isValidating}
            validationErrors={purchaseNumbers?.validation_errors || []}
            isNumbersValid={purchaseNumbers?.is_valid || false}
          />
        )}

        {/* 验证按钮 */}
        {statusInfo?.showValidate && (
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  <p className="text-gray-600">
                    号码已输入，点击下方按钮进行验证
                  </p>
                  <Button
                    onClick={handleValidateNumbers}
                    disabled={isValidating}
                    size="lg"
                    className="w-full max-w-xs"
                  >
                    {isValidating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        验证中...
                      </>
                    ) : (
                      '验证号码'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 完成状态 */}
        {statusInfo?.title === '号码验证完成' && (
          <div className="max-w-2xl mx-auto">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="py-8">
                <div className="text-center space-y-4">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
                  <h3 className="text-xl font-semibold text-green-800">
                    号码验证完成！
                  </h3>
                  <p className="text-green-700">
                    您的号码已通过验证，现在可以开盒了
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={() => router.push(`/open/${purchaseId}`)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      开盒
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.back()}
                    >
                      返回
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 返回按钮 */}
        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            返回
          </Button>
        </div>
      </div>
    </div>
  );
}
