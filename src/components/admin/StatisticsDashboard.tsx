'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { 
  // BarChart3, 
  TrendingUp, 
  TrendingDown,
  Eye,
  ShoppingCart,
  Package,
  Users,
  DollarSign
} from 'lucide-react'
import { useAdminStats } from '../../hooks/useAdminStats'

export const StatisticsDashboard: React.FC = () => {
  const { data: stats, isLoading } = useAdminStats()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-300">
        <p>No statistics available</p>
      </div>
    )
  }

  const chartData = [
    { name: 'Jan', value: 1200, color: 'bg-blue-500' },
    { name: 'Feb', value: 1900, color: 'bg-green-500' },
    { name: 'Mar', value: 3000, color: 'bg-purple-500' },
    { name: 'Apr', value: 2800, color: 'bg-yellow-500' },
    { name: 'May', value: 3500, color: 'bg-red-500' },
    { name: 'Jun', value: 4200, color: 'bg-indigo-500' },
  ]

  const maxValue = Math.max(...chartData.map(d => d.value))

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Statistics Dashboard</h2>
        <p className="text-gray-300">Overview of your marketplace performance</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-r from-blue-500/20 to-blue-600/20 backdrop-blur-lg rounded-xl p-6 border border-blue-400/30"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-200 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold text-white">{stats.totalRevenue}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                <span className="text-green-400 text-sm">+12.5%</span>
              </div>
            </div>
            <DollarSign className="w-12 h-12 text-blue-400" />
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
              <p className="text-green-200 text-sm">Total Users</p>
              <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                <span className="text-green-400 text-sm">+8.2%</span>
              </div>
            </div>
            <Users className="w-12 h-12 text-green-400" />
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
              <p className="text-3xl font-bold text-white">{stats.totalSales}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="w-4 h-4 text-green-400 mr-1" />
                <span className="text-green-400 text-sm">+15.3%</span>
              </div>
            </div>
            <ShoppingCart className="w-12 h-12 text-purple-400" />
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
              <p className="text-yellow-200 text-sm">Active Blind Boxes</p>
              <p className="text-3xl font-bold text-white">{stats.totalBlindBoxes}</p>
              <div className="flex items-center mt-2">
                <TrendingDown className="w-4 h-4 text-red-400 mr-1" />
                <span className="text-red-400 text-sm">-2.1%</span>
              </div>
            </div>
            <Package className="w-12 h-12 text-yellow-400" />
          </div>
        </motion.div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Revenue Trend</h3>
          <div className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-gray-400" />
            <span className="text-gray-400 text-sm">Last 6 months</span>
          </div>
        </div>

        <div className="h-64 flex items-end justify-between space-x-2">
          {chartData.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ height: 0 }}
              animate={{ height: `${(item.value / maxValue) * 100}%` }}
              transition={{ delay: index * 0.1, duration: 0.8 }}
              className={`${item.color} rounded-t-lg flex-1 min-h-[20px] relative group`}
            >
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="bg-gray-800 text-white text-xs px-2 py-1 rounded">
                  {item.value}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-between mt-4">
          {chartData.map((item) => (
            <div key={item.name} className="text-center">
              <span className="text-gray-400 text-sm">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">Top Performing Blind Boxes</h3>
          <div className="space-y-4">
            {[
              { name: 'Legendary Collection', sales: 1250, revenue: '12,500 INJ' },
              { name: 'Epic Warriors', sales: 980, revenue: '9,800 INJ' },
              { name: 'Mystic Creatures', sales: 750, revenue: '7,500 INJ' },
              { name: 'Cosmic Heroes', sales: 620, revenue: '6,200 INJ' },
            ].map((item, index) => (
              <motion.div
                key={item.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
              >
                <div>
                  <p className="text-white font-medium">{item.name}</p>
                  <p className="text-gray-400 text-sm">{item.sales} sales</p>
                </div>
                <div className="text-right">
                  <p className="text-green-400 font-bold">{item.revenue}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">Recent Transactions</h3>
          <div className="space-y-4">
            {[
              { user: '0x1234...5678', action: 'Bought', amount: '5 boxes', time: '2 min ago' },
              { user: '0x2345...6789', action: 'Opened', amount: '3 boxes', time: '5 min ago' },
              { user: '0x3456...7890', action: 'Bought', amount: '2 boxes', time: '8 min ago' },
              { user: '0x4567...8901', action: 'Opened', amount: '1 box', time: '12 min ago' },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
              >
                <div>
                  <p className="text-white font-medium">{item.user}</p>
                  <p className="text-gray-400 text-sm">{item.action} {item.amount}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">{item.time}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
