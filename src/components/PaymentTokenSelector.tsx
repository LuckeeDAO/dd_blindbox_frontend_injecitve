'use client';

import { usePaymentTokens } from '@/hooks/usePaymentTokens';

interface PaymentTokenSelectorProps {
  selectedToken: string;
  onTokenChange: (tokenId: string) => void;
  quantity: number;
}

export default function PaymentTokenSelector({
  selectedToken,
  onTokenChange,
  quantity
}: PaymentTokenSelectorProps) {
  const paymentTokens = usePaymentTokens();
  if (paymentTokens.length === 0) {
    return null;
  }

  const currentToken =
    paymentTokens.find((t) => t.id === selectedToken) || paymentTokens[0];
  const totalPrice = currentToken.price * quantity;

  return (
    <div className="space-y-4">
      {/* 代币选择标签 */}
      <div className="flex gap-2">
        {paymentTokens.map((token) => (
          <button
            key={token.id}
            onClick={() => onTokenChange(token.id)}
            className={`
              flex-1 px-4 py-3 rounded-lg border-2 transition-all
              ${selectedToken === token.id
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 bg-white hover:border-gray-300'
              }
            `}
          >
            <div className="flex items-center justify-center gap-2">
              {token.icon && (
                <img
                  src={token.icon}
                  alt={token.name}
                  className="w-6 h-6"
                  onError={(e) => {
                    // 如果图标加载失败，隐藏图标
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              <span className="font-semibold">{token.name}</span>
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {token.price} {token.name}/盒
            </div>
          </button>
        ))}
      </div>

      {/* 价格显示 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
        <div className="flex justify-between items-center">
          <span className="text-gray-700">支付代币:</span>
          <span className="font-semibold text-blue-700">{currentToken.name}</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-gray-700">单价:</span>
          <span className="font-semibold">{currentToken.price} {currentToken.name}/盒</span>
        </div>
        <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200">
          <span className="text-gray-900 font-semibold">总价:</span>
          <span className="text-2xl font-bold text-blue-600">
            {totalPrice} {currentToken.name}
          </span>
        </div>
      </div>

      {/* 代币说明 */}
      <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
        <p className="flex items-start gap-2">
          <span className="text-blue-500">ℹ️</span>
          <span>
            {currentToken.id === 'usdt' 
              ? 'USDT 是稳定币，价格固定，适合大额购买'
              : '当前显示为所选链的默认支付代币'
            }
          </span>
        </p>
      </div>
    </div>
  );
}
