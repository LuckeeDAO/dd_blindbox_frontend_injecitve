import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createBlindBox } from '../services/admin'
// import { toast } from 'react-hot-toast'

export interface CreateBlindBoxParams {
  name: string
  description: string
  price: { denom: string; amount: string }
  total_supply: number
  max_per_user: number
  start_time?: string
  end_time?: string
  nft_collection: string
  rarity_config: Array<{
    rarity: string
    probability: number
    nft_ids: string[]
  }>
}

export const useCreateBlindBox = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createBlindBox,
    onSuccess: () => {
      // Invalidate and refetch blind boxes list
      queryClient.invalidateQueries({ queryKey: ['blindBoxes'] })
      queryClient.invalidateQueries({ queryKey: ['adminStats'] })
    },
    onError: (error) => {
      console.error('Error creating blind box:', error)
    },
  })
}
