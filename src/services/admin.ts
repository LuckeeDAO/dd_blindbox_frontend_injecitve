import axios from 'axios'
import { BlindBox, BlindBoxStats } from '../types'
import { DEFAULT_CHAIN_KEY, getChainConfig } from '@/config/chains'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api'
const defaultChain = getChainConfig(DEFAULT_CHAIN_KEY)

// Admin statistics interface
export interface AdminStats {
  totalBlindBoxes: number
  totalUsers: number
  totalSales: number
  totalRevenue: string
  growthRate: number
}

// System settings interface
export interface SystemSettings {
  admin: string
  feeCollector: string
  feeRate: number
  baseValue: string
  taxRate: number
  paused: boolean
}

// Create blind box parameters interface
export interface CreateBlindBoxParams {
  period: number
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

// Get admin statistics
export const getAdminStats = async (): Promise<AdminStats> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/stats`)
    return response.data
  } catch (error) {
    console.error('Error fetching admin stats:', error)
    // Return mock data for development
    return {
      totalBlindBoxes: 12,
      totalUsers: 1250,
      totalSales: 5430,
      totalRevenue: `54,300 ${defaultChain.nativeToken.symbol}`,
      growthRate: 15.3
    }
  }
}

// Create a new blind box
export const createBlindBox = async (params: CreateBlindBoxParams): Promise<BlindBox> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/admin/blind-boxes`, params)
    return response.data
  } catch (error) {
    console.error('Error creating blind box:', error)
    throw error
  }
}

// Update blind box
export const updateBlindBox = async (id: number, params: Partial<CreateBlindBoxParams>): Promise<BlindBox> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/admin/blind-boxes/${id}`, params)
    return response.data
  } catch (error) {
    console.error('Error updating blind box:', error)
    throw error
  }
}

// Delete blind box
export const deleteBlindBox = async (id: number): Promise<void> => {
  try {
    await axios.delete(`${API_BASE_URL}/admin/blind-boxes/${id}`)
  } catch (error) {
    console.error('Error deleting blind box:', error)
    throw error
  }
}

// Get all blind boxes for admin
export const getAdminBlindBoxes = async (): Promise<BlindBox[]> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/blind-boxes`)
    return response.data
  } catch (error) {
    console.error('Error fetching admin blind boxes:', error)
    throw error
  }
}

// Get blind box statistics
export const getBlindBoxStats = async (id: number): Promise<BlindBoxStats> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/blind-boxes/${id}/stats`)
    return response.data
  } catch (error) {
    console.error('Error fetching blind box stats:', error)
    throw error
  }
}

// Get system settings
export const getSystemSettings = async (): Promise<SystemSettings> => {
  try {
    const response = await axios.get(`${API_BASE_URL}/admin/settings`)
    return response.data
  } catch (error) {
    console.error('Error fetching system settings:', error)
    throw error
  }
}

// Update system settings
export const updateSystemSettings = async (settings: SystemSettings): Promise<SystemSettings> => {
  try {
    const response = await axios.put(`${API_BASE_URL}/admin/settings`, settings)
    return response.data
  } catch (error) {
    console.error('Error updating system settings:', error)
    throw error
  }
}

// Pause/unpause contract
export const toggleContractPause = async (paused: boolean): Promise<{ success: boolean }> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/admin/contract/pause`, { paused })
    return response.data
  } catch (error) {
    console.error('Error toggling contract pause:', error)
    throw error
  }
}

// Emergency withdraw
export const emergencyWithdraw = async (blindBoxId: number): Promise<{ success: boolean }> => {
  try {
    const response = await axios.post(`${API_BASE_URL}/admin/emergency-withdraw`, { blindBoxId })
    return response.data
  } catch (error) {
    console.error('Error performing emergency withdraw:', error)
    throw error
  }
}
