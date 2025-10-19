import { useQuery } from '@tanstack/react-query'
import { getAdminStats } from '../services/admin'

export const useAdminStats = () => {
  return useQuery({
    queryKey: ['adminStats'],
    queryFn: getAdminStats,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 10000, // Consider data stale after 10 seconds
  })
}
