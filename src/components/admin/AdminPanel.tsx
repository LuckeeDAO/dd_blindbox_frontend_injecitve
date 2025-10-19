'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings, 
  Plus, 
  BarChart3, 
  Users, 
  Package, 
  DollarSign,
  TrendingUp,
  Activity
} from 'lucide-react'
import { useAdminStats } from '../../hooks/useAdminStats'
import { CreateBlindBoxForm } from './CreateBlindBoxForm'
import { BlindBoxManagement } from './BlindBoxManagement'
import { SystemSettings } from './SystemSettings'
import { StatisticsDashboard } from './StatisticsDashboard'

interface AdminPanelProps {
  isAdmin: boolean
}

type TabType = 'dashboard' | 'create' | 'manage' | 'settings'

export const AdminPanel: React.FC<AdminPanelProps> = ({ isAdmin }) => {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const { data: stats } = useAdminStats()

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 mx-auto mb-6 bg-red-500/20 rounded-full flex items-center justify-center">
            <Activity className="w-12 h-12 text-red-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-gray-300 text-lg">
            You don&apos;t have permission to access the admin panel.
          </p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'create', label: 'Create Blind Box', icon: Plus },
    { id: 'manage', label: 'Manage Blind Boxes', icon: Package },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Admin Panel</h1>
          <p className="text-gray-300 text-lg">
            Manage your blind box marketplace
          </p>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Total Blind Boxes</p>
                  <p className="text-2xl font-bold text-white">{stats.totalBlindBoxes}</p>
                </div>
                <Package className="w-8 h-8 text-blue-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Total Users</p>
                  <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                </div>
                <Users className="w-8 h-8 text-green-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold text-white">{stats.totalRevenue}</p>
                </div>
                <DollarSign className="w-8 h-8 text-yellow-400" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-300 text-sm">Growth Rate</p>
                  <p className="text-2xl font-bold text-white">{stats.growthRate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-purple-400" />
              </div>
            </motion.div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-white/10 backdrop-blur-lg rounded-lg p-1 border border-white/20">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-md transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-white/20 text-white shadow-lg'
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white/10 backdrop-blur-lg rounded-xl p-8 border border-white/20"
          >
            {activeTab === 'dashboard' && <StatisticsDashboard />}
            {activeTab === 'create' && <CreateBlindBoxForm />}
            {activeTab === 'manage' && <BlindBoxManagement />}
            {activeTab === 'settings' && <SystemSettings />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
