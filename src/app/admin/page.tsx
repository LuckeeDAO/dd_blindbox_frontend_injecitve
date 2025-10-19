'use client'

import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AdminPanel } from '@/components/admin/AdminPanel'
import { useWalletStore } from '@/stores/wallet'

// Mock admin addresses - in production, this should be checked against the contract
const ADMIN_ADDRESSES = [
  'inj1admin123456789',
  'inj1creator123456789',
  // Add more admin addresses as needed
]

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
  
  // Check if current wallet is admin
  const isAdmin = wallet && ADMIN_ADDRESSES.includes(wallet.address)

  return (
    <QueryClientProvider client={queryClient}>
      <AdminPanel isAdmin={isAdmin || false} />
    </QueryClientProvider>
  )
}
