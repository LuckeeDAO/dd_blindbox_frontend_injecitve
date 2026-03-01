'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdminPanel } from '@/components/admin/AdminPanel'
import { useWalletStore } from '@/stores/wallet'
import { useChain } from '@/hooks/useChain'

function parseAddressList(value?: string): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function getAdminAddressesByChain(chainKey: string): string[] {
  if (chainKey === 'avalanche_fuji') {
    const chainSpecific = parseAddressList(process.env.NEXT_PUBLIC_AVALANCHE_ADMIN_ADDRESSES)
    if (chainSpecific.length > 0) return chainSpecific
  }

  if (chainKey === 'injective_testnet') {
    const chainSpecific = parseAddressList(process.env.NEXT_PUBLIC_INJECTIVE_ADMIN_ADDRESSES)
    if (chainSpecific.length > 0) return chainSpecific
  }

  return parseAddressList(process.env.NEXT_PUBLIC_ADMIN_ADDRESSES)
}

function normalizeAddress(address: string): string {
  if (address.startsWith('0x')) {
    return address.toLowerCase()
  }
  return address
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

export default function AdminPage() {
  const { wallet } = useWalletStore()
  const { chainKey } = useChain()
  const adminAddresses = getAdminAddressesByChain(chainKey)
  
  const isAdmin = wallet
    ? adminAddresses.map(normalizeAddress).includes(normalizeAddress(wallet.address))
    : false

  return (
    <QueryClientProvider client={queryClient}>
      <AdminPanel isAdmin={isAdmin} />
    </QueryClientProvider>
  )
}
