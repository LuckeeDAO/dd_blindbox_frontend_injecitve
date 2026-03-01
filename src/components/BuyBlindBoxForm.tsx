'use client';

import React, { useState } from 'react';
import { BlindBox } from '@/types';
import { contractService } from '@/services/contract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ShoppingCart, Package, AlertCircle } from 'lucide-react';
import { NftSelection } from './NftSelection';
import { useChain } from '@/hooks/useChain';

interface BuyBlindBoxFormProps {
  blindBox: BlindBox;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const BuyBlindBoxForm: React.FC<BuyBlindBoxFormProps> = ({
  blindBox,
  onSuccess,
  onCancel
}) => {
  const { chain } = useChain();
  const [quantity, setQuantity] = useState(1);
  const [luckyNumber1, setLuckyNumber1] = useState('');
  const [luckyNumber2, setLuckyNumber2] = useState('');
  const [luckyNumber3, setLuckyNumber3] = useState('');
  const [selectedNfts, setSelectedNfts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxQuantity = Math.min(blindBox.max_per_user, blindBox.total_supply - blindBox.sold_count);
  const totalPrice = parseInt(blindBox.price.amount) * quantity;
  const unit = 10 ** chain.nativeToken.decimals;
  const totalPriceFormatted = (totalPrice / unit).toFixed(4);

  const handleBuy = async () => {
    if (quantity < 1 || quantity > maxQuantity) {
      setError(`数量必须在 1 到 ${maxQuantity} 之间`);
      return;
    }

    // 验证幸运数字
    if (luckyNumber1 || luckyNumber2 || luckyNumber3) {
      const num1 = parseInt(luckyNumber1);
      const num2 = parseInt(luckyNumber2);
      const num3 = parseInt(luckyNumber3);
      
      if (luckyNumber1 && (isNaN(num1) || num1 < 0 || num1 > 9)) {
        setError('幸运数字必须是 0-9 的数字');
        return;
      }
      if (luckyNumber2 && (isNaN(num2) || num2 < 0 || num2 > 9)) {
        setError('幸运数字必须是 0-9 的数字');
        return;
      }
      if (luckyNumber3 && (isNaN(num3) || num3 < 0 || num3 > 9)) {
        setError('幸运数字必须是 0-9 的数字');
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      // 组合幸运数字
      const userRandom = (luckyNumber1 || luckyNumber2 || luckyNumber3) 
        ? `${luckyNumber1 || '0'}${luckyNumber2 || '0'}${luckyNumber3 || '0'}`
        : undefined;

      const result = await contractService.buyBlindBox(
        blindBox.id,
        quantity,
        userRandom,
        selectedNfts.length > 0 ? selectedNfts : undefined
      );

      if (result.success) {
        // 购买成功后跳转到号码输入页面
        window.location.href = `/input-numbers/${result.purchaseId || '1'}`;
      } else {
        setError(result.error || 'Purchase failed');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Purchase error:', err);
    } finally {
      setLoading(false);
    }
  };

  const isAvailable = blindBox.status === 'Packaged' && blindBox.sold_count < blindBox.total_supply;

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ShoppingCart className="w-5 h-5" />
          <span>购买盲盒</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Blind Box Info */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">{blindBox.name}</h3>
          <p className="text-gray-400 text-sm">{blindBox.description}</p>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <Package className="w-4 h-4 text-blue-400" />
              <span className="text-gray-300">
                已售 {blindBox.sold_count} / {blindBox.total_supply}
              </span>
            </div>
            <Badge 
              variant={isAvailable ? "default" : "secondary"}
              className={isAvailable ? "bg-green-600" : ""}
            >
              {blindBox.status}
            </Badge>
          </div>
        </div>

        <Separator />

        {/* Quantity Selection */}
        <div className="space-y-2">
          <Label htmlFor="quantity" className="text-white">
            购买数量
          </Label>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
            >
              -
            </Button>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="text-center w-20"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuantity(Math.min(maxQuantity, quantity + 1))}
              disabled={quantity >= maxQuantity}
            >
              +
            </Button>
            <span className="text-gray-400 text-sm">
              (最多: {maxQuantity})
            </span>
          </div>
        </div>

        {/* Lucky Numbers */}
        <div className="space-y-3">
          <Label className="text-white text-base font-semibold">
            幸运数字 (可选)
          </Label>
          <p className="text-xs text-gray-400 mb-3">
            输入三个 0-9 的数字作为你的幸运数字，影响你的奖品选择
          </p>
          <div className="flex items-center justify-center space-x-4">
            <div className="flex flex-col items-center">
              <Input
                id="luckyNumber1"
                type="number"
                min="0"
                max="9"
                placeholder="0"
                value={luckyNumber1}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 9)) {
                    setLuckyNumber1(val);
                  }
                }}
                className="bg-gray-800 border-gray-600 text-white text-center text-2xl font-bold w-20 h-20"
                maxLength={1}
              />
              <span className="text-xs text-gray-500 mt-1">第1位</span>
            </div>
            <span className="text-white text-2xl font-bold">-</span>
            <div className="flex flex-col items-center">
              <Input
                id="luckyNumber2"
                type="number"
                min="0"
                max="9"
                placeholder="0"
                value={luckyNumber2}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 9)) {
                    setLuckyNumber2(val);
                  }
                }}
                className="bg-gray-800 border-gray-600 text-white text-center text-2xl font-bold w-20 h-20"
                maxLength={1}
              />
              <span className="text-xs text-gray-500 mt-1">第2位</span>
            </div>
            <span className="text-white text-2xl font-bold">-</span>
            <div className="flex flex-col items-center">
              <Input
                id="luckyNumber3"
                type="number"
                min="0"
                max="9"
                placeholder="0"
                value={luckyNumber3}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || (parseInt(val) >= 0 && parseInt(val) <= 9)) {
                    setLuckyNumber3(val);
                  }
                }}
                className="bg-gray-800 border-gray-600 text-white text-center text-2xl font-bold w-20 h-20"
                maxLength={1}
              />
              <span className="text-xs text-gray-500 mt-1">第3位</span>
            </div>
          </div>
          <div className="flex justify-center mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLuckyNumber1(Math.floor(Math.random() * 10).toString());
                setLuckyNumber2(Math.floor(Math.random() * 10).toString());
                setLuckyNumber3(Math.floor(Math.random() * 10).toString());
              }}
              className="text-xs"
            >
              🎲 随机生成
            </Button>
          </div>
        </div>

        <Separator />

        {/* NFT Selection */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">
              选择偏好 NFT
            </h3>
          </div>
          <p className="text-sm text-gray-400">
            选择你希望获得的 NFT。系统会尽可能根据你的偏好分配 NFT。
          </p>
          
          <NftSelection
            selectedNfts={selectedNfts}
            onSelectionChange={setSelectedNfts}
          />
        </div>

        <Separator />

        {/* Price Summary */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-gray-300">单价:</span>
            <span className="text-white">
              {(parseInt(blindBox.price.amount) / unit).toFixed(4)}{' '}
              {blindBox.price.denom.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-300">数量:</span>
            <span className="text-white">{quantity}</span>
          </div>
          <div className="flex justify-between items-center text-lg font-semibold">
            <span className="text-white">总价:</span>
            <span className="text-green-400">{totalPriceFormatted} {blindBox.price.denom.toUpperCase()}</span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center space-x-2 p-3 bg-red-500/20 border border-red-400/30 rounded-lg">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <span className="text-red-200 text-sm">{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button
            onClick={handleBuy}
            disabled={!isAvailable || loading}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                处理中...
              </>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2" />
                立即购买
              </>
            )}
          </Button>
          {onCancel && (
            <Button
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              取消
            </Button>
          )}
        </div>

        {!isAvailable && (
          <div className="text-center text-gray-400 text-sm p-4 bg-gray-800/50 rounded-lg">
            <p className="font-medium">该盲盒暂时无法购买</p>
            <p className="text-xs mt-1">状态: {blindBox.status}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
