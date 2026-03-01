import { useMemo } from 'react';
import { useChain } from '@/hooks/useChain';
import { PaymentToken } from '@/types';

export function usePaymentTokens(): PaymentToken[] {
  const { chain } = useChain();

  return useMemo(
    () =>
      chain.paymentTokens.map((token) => ({
        id: token.id,
        name: token.name,
        denom: token.denom,
        decimals: token.decimals,
        price: token.price,
        icon: token.icon,
      })),
    [chain.paymentTokens]
  );
}
