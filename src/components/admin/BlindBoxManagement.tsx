'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Edit, 
  Trash2, 
  Eye, 
  // MoreVertical,
  Package,
  Users,
  DollarSign,
  // Calendar,
  Settings
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useChain } from '@/hooks/useChain'

interface BlindBox {
  id: number
  period: number
  name: string
  description: string
  price: { denom: string; amount: string }
  total_supply: number
  sold_count: number
  max_per_user: number
  status: 'Preparing' | 'Packaged' | 'Revealed' | 'Rewarded' | 'AfterSale' | 'Completed' | 'Paused'
  created_at: string
  updated_at: string
}

export const BlindBoxManagement: React.FC = () => {
  const { chain } = useChain()
  const nativeUnit = BigInt(10) ** BigInt(chain.nativeToken.decimals)
  const [blindBoxes, setBlindBoxes] = useState<BlindBox[]>([
    {
      id: 1,
      period: 1,
      name: 'Legendary Collection',
      description: 'A collection of legendary NFTs',
      price: { denom: chain.nativeToken.denom, amount: nativeUnit.toString() },
      total_supply: 1000,
      sold_count: 750,
      max_per_user: 5,
      status: 'Packaged',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      period: 2,
      name: 'Epic Warriors',
      description: 'Epic warrior NFTs with special abilities',
      price: { denom: chain.nativeToken.denom, amount: (nativeUnit / BigInt(2)).toString() },
      total_supply: 500,
      sold_count: 500,
      max_per_user: 3,
      status: 'Revealed',
      created_at: '2024-01-05T00:00:00Z',
      updated_at: '2024-01-20T15:45:00Z'
    },
    {
      id: 3,
      period: 3,
      name: 'Mystic Creatures',
      description: 'Mystical creatures from another realm',
      price: { denom: chain.nativeToken.denom, amount: ((nativeUnit * BigInt(3)) / BigInt(4)).toString() },
      total_supply: 300,
      sold_count: 150,
      max_per_user: 2,
      status: 'Paused',
      created_at: '2024-01-10T00:00:00Z',
      updated_at: '2024-01-25T09:15:00Z'
    }
  ])

  const [selectedBlindBox, setSelectedBlindBox] = useState<BlindBox | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'text-green-400 bg-green-400/20'
      case 'Paused': return 'text-yellow-400 bg-yellow-400/20'
      case 'SoldOut': return 'text-red-400 bg-red-400/20'
      case 'Ended': return 'text-gray-400 bg-gray-400/20'
      case 'Settled': return 'text-blue-400 bg-blue-400/20'
      default: return 'text-gray-400 bg-gray-400/20'
    }
  }

  const inferDecimals = (denom: string) => {
    const lower = denom.toLowerCase()
    if (lower.includes('usdt') || lower.includes('usdc')) return 6
    return chain.nativeToken.decimals
  }

  const formatPrice = (price: { denom: string; amount: string }) => {
    const amount = Number(price.amount) / 10 ** inferDecimals(price.denom)
    return `${amount} ${price.denom.replace('u', '').toUpperCase()}`
  }

  const handleEdit = (blindBox: BlindBox) => {
    setSelectedBlindBox(blindBox)
    setShowEditModal(true)
  }

  const handleViewStats = (blindBox: BlindBox) => {
    setSelectedBlindBox(blindBox)
    setShowStatsModal(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this blind box?')) {
      try {
        // TODO: Implement delete API call
        setBlindBoxes(blindBoxes.filter(bb => bb.id !== id))
        toast.success('Blind box deleted successfully')
      } catch (error) {
        toast.error('Failed to delete blind box')
        console.error('Error deleting blind box:', error)
      }
    }
  }

  // const handleUpdateStatus = async (id: number, newStatus: string) => {
  //   try {
  //     // TODO: Implement status update API call
  //     setBlindBoxes(blindBoxes.map(bb => 
  //       bb.id === id ? { ...bb, status: newStatus as BlindBoxStatus } : bb
  //     ))
  //     toast.success('Status updated successfully')
  //   } catch (error) {
  //     toast.error('Failed to update status')
  //     console.error('Error updating status:', error)
  //   }
  // }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Blind Box Management</h2>
        <p className="text-gray-300">Manage and monitor your blind boxes</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 backdrop-blur-lg rounded-xl p-6 border border-blue-400/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm">Total Blind Boxes</p>
              <p className="text-3xl font-bold text-white">{blindBoxes.length}</p>
            </div>
            <Package className="w-12 h-12 text-blue-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-green-500/20 to-green-600/20 backdrop-blur-lg rounded-xl p-6 border border-green-400/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-200 text-sm">Active Boxes</p>
              <p className="text-3xl font-bold text-white">
                {blindBoxes.filter(bb => bb.status === 'Packaged').length}
              </p>
            </div>
            <Settings className="w-12 h-12 text-green-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-purple-500/20 to-purple-600/20 backdrop-blur-lg rounded-xl p-6 border border-purple-400/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-200 text-sm">Total Sales</p>
              <p className="text-3xl font-bold text-white">
                {blindBoxes.reduce((sum, bb) => sum + bb.sold_count, 0)}
              </p>
            </div>
            <Users className="w-12 h-12 text-purple-400" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 backdrop-blur-lg rounded-xl p-6 border border-yellow-400/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-200 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold text-white">
                {blindBoxes.reduce((sum, bb) => {
                  const price = Number(bb.price.amount) / 10 ** inferDecimals(bb.price.denom)
                  return sum + (price * bb.sold_count)
                }, 0).toFixed(0)} {chain.nativeToken.symbol}
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-yellow-400" />
          </div>
        </motion.div>
      </div>

      {/* Blind Boxes Table */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 overflow-hidden">
        <div className="p-6 border-b border-white/20">
          <h3 className="text-xl font-bold text-white">All Blind Boxes</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-white font-medium">Name</th>
                <th className="px-6 py-4 text-left text-white font-medium">Period</th>
                <th className="px-6 py-4 text-left text-white font-medium">Price</th>
                <th className="px-6 py-4 text-left text-white font-medium">Supply</th>
                <th className="px-6 py-4 text-left text-white font-medium">Sold</th>
                <th className="px-6 py-4 text-left text-white font-medium">Status</th>
                <th className="px-6 py-4 text-left text-white font-medium">Created</th>
                <th className="px-6 py-4 text-left text-white font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {blindBoxes.map((blindBox, index) => (
                <motion.tr
                  key={blindBox.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-white font-medium">{blindBox.name}</p>
                      <p className="text-gray-400 text-sm">{blindBox.description}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-white">
                    第 {blindBox.period} 期
                  </td>
                  <td className="px-6 py-4 text-white">
                    {formatPrice(blindBox.price)}
                  </td>
                  <td className="px-6 py-4 text-white">
                    {blindBox.total_supply}
                  </td>
                  <td className="px-6 py-4 text-white">
                    {blindBox.sold_count}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(blindBox.status)}`}>
                      {blindBox.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {new Date(blindBox.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleViewStats(blindBox)}
                        className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/20 rounded-lg transition-colors"
                        title="View Statistics"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(blindBox)}
                        className="p-2 text-green-400 hover:text-green-300 hover:bg-green-400/20 rounded-lg transition-colors"
                        title="Edit Blind Box"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(blindBox.id)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/20 rounded-lg transition-colors"
                        title="Delete Blind Box"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedBlindBox && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setShowEditModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">Edit Blind Box</h3>
            <p className="text-gray-600 mb-4">Edit functionality will be implemented here.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Stats Modal */}
      {showStatsModal && selectedBlindBox && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setShowStatsModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-lg p-6 w-full max-w-lg mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Statistics for {selectedBlindBox.name}
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm">Total Supply</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedBlindBox.total_supply}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm">Sold</p>
                  <p className="text-2xl font-bold text-gray-900">{selectedBlindBox.sold_count}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm">Remaining</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {selectedBlindBox.total_supply - selectedBlindBox.sold_count}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-gray-600 text-sm">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatPrice(selectedBlindBox.price)} × {selectedBlindBox.sold_count}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowStatsModal(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
