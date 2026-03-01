'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface PrizeNumbersInputProps {
  purchaseId: number;
  blindBoxNumbers: string[]; // 盲盒编号列表
  onNumbersSubmit: (firstPrizeNumbers: number[], secondPrizeNumbers: number[]) => Promise<void>;
  onValidateNumbers: () => Promise<void>;
  initialFirstPrizeNumbers?: number[];
  initialSecondPrizeNumbers?: number[];
  isSubmitting?: boolean;
  isValidating?: boolean;
  validationErrors?: string[];
  isNumbersValid?: boolean;
}

export const PrizeNumbersInput: React.FC<PrizeNumbersInputProps> = ({
  purchaseId,
  blindBoxNumbers,
  onNumbersSubmit,
  onValidateNumbers,
  initialFirstPrizeNumbers,
  initialSecondPrizeNumbers,
  isSubmitting = false,
  isValidating = false,
  validationErrors = [],
  isNumbersValid = false,
}) => {
  const [firstPrizeNumbers, setFirstPrizeNumbers] = useState<number[]>(
    initialFirstPrizeNumbers ?? [Math.floor(Math.random() * 1000)]
  );
  const [secondPrizeNumbers, setSecondPrizeNumbers] = useState<number[]>(
    initialSecondPrizeNumbers ?? generateRandomNumbers(99)
  );
  const [localValidationErrors, setLocalValidationErrors] = useState<string[]>([]);
  const [isLocalValid, setIsLocalValid] = useState<boolean>(false);

  // 生成99个不重复的随机数
  function generateRandomNumbers(count: number): number[] {
    const numbers = new Set<number>();
    while (numbers.size < count) {
      numbers.add(Math.floor(Math.random() * 1000));
    }
    return Array.from(numbers);
  }

  // 验证随机数
  const validateNumbers = useCallback(() => {
    const errors: string[] = [];
    
    // 检查一等奖随机数数量（至少1个）
    if (firstPrizeNumbers.length === 0) {
      errors.push('一等奖随机数至少需要1个');
    }
    
    // 检查一等奖随机数范围
    for (let i = 0; i < firstPrizeNumbers.length; i++) {
      if (firstPrizeNumbers[i] < 0 || firstPrizeNumbers[i] > 1023) {
        errors.push(`一等奖随机数${i + 1}必须在0-1023范围内`);
      }
    }
    
    // 检查二等奖随机数数量
    if (secondPrizeNumbers.length !== 99) {
      errors.push('二等奖随机数必须恰好有99个');
    }
    
    // 检查二等奖随机数范围
    for (let i = 0; i < secondPrizeNumbers.length; i++) {
      if (secondPrizeNumbers[i] < 0 || secondPrizeNumbers[i] > 1023) {
        errors.push(`二等奖随机数${i + 1}超出范围`);
      }
    }
    
    // 检查重复
    const allNumbers = [...firstPrizeNumbers, ...secondPrizeNumbers];
    const uniqueNumbers = new Set(allNumbers);
    
    if (uniqueNumbers.size !== allNumbers.length) {
      errors.push('随机数存在重复，请确保所有随机数都不相同');
    }
    
    setLocalValidationErrors(errors);
    setIsLocalValid(errors.length === 0);
    
    return errors.length === 0;
  }, [firstPrizeNumbers, secondPrizeNumbers]);

  // 实时验证
  useEffect(() => {
    validateNumbers();
  }, [validateNumbers]);

  // 重新生成随机数
  const regenerateNumbers = () => {
    setFirstPrizeNumbers([Math.floor(Math.random() * 1000)]);
    setSecondPrizeNumbers(generateRandomNumbers(99));
  };

  // 清空随机数
  const clearNumbers = () => {
    setFirstPrizeNumbers([0]);
    setSecondPrizeNumbers(new Array(99).fill(0));
  };

  // 更新一等奖随机数
  const updateFirstPrizeNumber = (index: number, value: number) => {
    const newNumbers = [...firstPrizeNumbers];
    newNumbers[index] = value;
    setFirstPrizeNumbers(newNumbers);
  };

  // 添加一等奖随机数
  const addFirstPrizeNumber = () => {
    setFirstPrizeNumbers([...firstPrizeNumbers, Math.floor(Math.random() * 1000)]);
  };

  // 删除一等奖随机数
  const removeFirstPrizeNumber = (index: number) => {
    if (firstPrizeNumbers.length > 1) {
      const newNumbers = firstPrizeNumbers.filter((_, i) => i !== index);
      setFirstPrizeNumbers(newNumbers);
    }
  };

  // 更新二等奖随机数
  const updateSecondPrizeNumber = (index: number, value: number) => {
    const newNumbers = [...secondPrizeNumbers];
    newNumbers[index] = value;
    setSecondPrizeNumbers(newNumbers);
  };

  // 提交随机数
  const handleSubmit = async () => {
    if (validateNumbers()) {
      await onNumbersSubmit(firstPrizeNumbers, secondPrizeNumbers);
    }
  };

  // 验证号码
  const handleValidate = async () => {
    if (validateNumbers()) {
      await onValidateNumbers();
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-blue-500" />
          中奖随机数输入
        </CardTitle>
        <CardDescription>
          请输入一等奖随机数（1个）和二等奖随机数（99个）来确定中奖等级
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 购买信息 */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">购买信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">购买ID：</span>
              <span className="font-mono">{purchaseId}</span>
            </div>
            <div>
              <span className="text-gray-600">盲盒编号：</span>
              <span className="font-mono">{blindBoxNumbers.join(', ')}</span>
            </div>
            <div>
              <span className="text-gray-600">购买数量：</span>
              <span>{blindBoxNumbers.length}个</span>
            </div>
          </div>
        </div>

        {/* 一等奖随机数 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">
              一等奖随机数 <span className="text-red-500">*</span>
            </Label>
            <Button
              variant="outline"
              size="sm"
              onClick={addFirstPrizeNumber}
              className="text-xs"
            >
              + 添加
            </Button>
          </div>
          <div className="space-y-2">
            {firstPrizeNumbers.map((number, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  max="1023"
                  value={number}
                  onChange={(e) => updateFirstPrizeNumber(index, parseInt(e.target.value) || 0)}
                  className="w-24 text-center font-mono text-lg"
                />
                <Badge variant="outline" className="text-xs">
                  0-1023
                </Badge>
                {firstPrizeNumbers.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFirstPrizeNumber(index)}
                    className="text-xs text-red-500"
                  >
                    删除
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* 二等奖随机数 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">
              二等奖随机数 <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={regenerateNumbers}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                重新生成
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearNumbers}
                className="text-xs"
              >
                清空
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-10 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg bg-gray-50">
            {secondPrizeNumbers.map((number, index) => (
              <Input
                key={index}
                type="number"
                min="0"
                max="1023"
                value={number}
                onChange={(e) => updateSecondPrizeNumber(index, parseInt(e.target.value) || 0)}
                className="w-12 h-8 text-center text-xs font-mono"
                placeholder={`${index + 1}`}
              />
            ))}
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            共 {secondPrizeNumbers.length} 个随机数，范围：0-1023
          </div>
        </div>

        {/* 验证状态 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {isLocalValid ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-sm font-medium ${isLocalValid ? 'text-green-600' : 'text-red-600'}`}>
              {isLocalValid ? '随机数验证通过' : '随机数验证失败'}
            </span>
          </div>
          
          {localValidationErrors.length > 0 && (
            <div className="space-y-1">
              {localValidationErrors.map((error, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  {error}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 服务器验证结果 */}
        {validationErrors.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-red-600">服务器验证失败</span>
            </div>
            <div className="space-y-1">
              {validationErrors.map((error, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={!isLocalValid || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? '提交中...' : '提交号码'}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleValidate}
            disabled={!isLocalValid || isValidating}
          >
            {isValidating ? '验证中...' : '验证号码'}
          </Button>
        </div>

        {/* 说明文字 */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• 系统会提供随机数作为初始值，您可以修改这些数字</p>
          <p>• 一等奖号码：1个，范围0-99</p>
          <p>• 二等奖号码：99个，范围0-99</p>
          <p>• 所有号码必须不重复，总共100个不同的号码</p>
          <p>• 中奖等级将根据您输入的号码确定</p>
        </div>
      </CardContent>
    </Card>
  );
};
