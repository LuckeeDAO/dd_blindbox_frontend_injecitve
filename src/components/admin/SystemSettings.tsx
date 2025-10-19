'use client'

import React, { useState } from 'react'
// import { motion } from 'framer-motion'
import { 
  Settings, 
  Save, 
  AlertCircle, 
  Shield, 
  // DollarSign,
  Users,
  // Clock,
  Pause,
  Play
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface SystemSettings {
  admin: string
  feeCollector: string
  feeRate: number
  paused: boolean
  maxBlindBoxes: number
  maxUsersPerBlindBox: number
  autoSettleThreshold: number
}

export const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<SystemSettings>({
    admin: 'inj1...',
    feeCollector: 'inj1...',
    feeRate: 50,
    paused: false,
    maxBlindBoxes: 100,
    maxUsersPerBlindBox: 1000,
    autoSettleThreshold: 90
  })

  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateSettings = () => {
    const newErrors: Record<string, string> = {}

    if (settings.feeRate < 0 || settings.feeRate > 1000) {
      newErrors.feeRate = 'Fee rate must be between 0 and 1000 (0-100%)'
    }

    if (settings.maxBlindBoxes < 1) {
      newErrors.maxBlindBoxes = 'Max blind boxes must be at least 1'
    }

    if (settings.maxUsersPerBlindBox < 1) {
      newErrors.maxUsersPerBlindBox = 'Max users per blind box must be at least 1'
    }

    if (settings.autoSettleThreshold < 0 || settings.autoSettleThreshold > 100) {
      newErrors.autoSettleThreshold = 'Auto settle threshold must be between 0 and 100'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateSettings()) {
      toast.error('Please fix the errors before saving')
      return
    }

    setIsLoading(true)
    try {
      // TODO: Implement save settings API call
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      toast.success('Settings saved successfully')
    } catch (error) {
      toast.error('Failed to save settings')
      console.error('Error saving settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTogglePause = async () => {
    setIsLoading(true)
    try {
      // TODO: Implement pause/unpause API call
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      setSettings(prev => ({ ...prev, paused: !prev.paused }))
      toast.success(`Contract ${settings.paused ? 'resumed' : 'paused'} successfully`)
    } catch (error) {
      toast.error('Failed to toggle contract status')
      console.error('Error toggling contract status:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">System Settings</h2>
        <p className="text-gray-300">Configure system-wide settings and parameters</p>
      </div>

      {/* Contract Status */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Contract Status</h3>
          </div>
          <button
            onClick={handleTogglePause}
            disabled={isLoading}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              settings.paused
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-red-500 hover:bg-red-600 text-white'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {settings.paused ? (
              <>
                <Play className="w-4 h-4" />
                <span>Resume Contract</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4" />
                <span>Pause Contract</span>
              </>
            )}
          </button>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className={`w-3 h-3 rounded-full ${settings.paused ? 'bg-red-400' : 'bg-green-400'}`}></div>
          <span className="text-white">
            Contract is currently {settings.paused ? 'paused' : 'active'}
          </span>
        </div>
        
        {settings.paused && (
          <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-400/30 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
              <span className="text-yellow-200">
                Contract is paused. Users cannot buy or open blind boxes.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Basic Settings */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Basic Settings</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-white font-medium mb-2">Admin Address</label>
            <input
              type="text"
              value={settings.admin}
              onChange={(e) => setSettings({ ...settings, admin: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="inj1..."
              disabled
            />
            <p className="text-gray-400 text-sm mt-1">Cannot be changed after deployment</p>
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Fee Collector Address</label>
            <input
              type="text"
              value={settings.feeCollector}
              onChange={(e) => setSettings({ ...settings, feeCollector: e.target.value })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="inj1..."
            />
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Fee Rate (‰)</label>
            <input
              type="number"
              value={settings.feeRate}
              onChange={(e) => setSettings({ ...settings, feeRate: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="50"
              min="0"
              max="1000"
            />
            {errors.feeRate && (
              <p className="text-red-400 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.feeRate}
              </p>
            )}
            <p className="text-gray-400 text-sm mt-1">
              Current fee rate: {settings.feeRate / 10}% (50‰ = 5%)
            </p>
          </div>
        </div>
      </div>

      {/* Limits and Thresholds */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <div className="flex items-center space-x-3 mb-6">
          <Users className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Limits and Thresholds</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-white font-medium mb-2">Max Blind Boxes</label>
            <input
              type="number"
              value={settings.maxBlindBoxes}
              onChange={(e) => setSettings({ ...settings, maxBlindBoxes: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="100"
              min="1"
            />
            {errors.maxBlindBoxes && (
              <p className="text-red-400 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.maxBlindBoxes}
              </p>
            )}
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Max Users per Blind Box</label>
            <input
              type="number"
              value={settings.maxUsersPerBlindBox}
              onChange={(e) => setSettings({ ...settings, maxUsersPerBlindBox: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1000"
              min="1"
            />
            {errors.maxUsersPerBlindBox && (
              <p className="text-red-400 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.maxUsersPerBlindBox}
              </p>
            )}
          </div>

          <div>
            <label className="block text-white font-medium mb-2">Auto Settle Threshold (%)</label>
            <input
              type="number"
              value={settings.autoSettleThreshold}
              onChange={(e) => setSettings({ ...settings, autoSettleThreshold: parseInt(e.target.value) || 0 })}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="90"
              min="0"
              max="100"
            />
            {errors.autoSettleThreshold && (
              <p className="text-red-400 text-sm mt-1 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.autoSettleThreshold}
              </p>
            )}
            <p className="text-gray-400 text-sm mt-1">
              Auto-settle when {settings.autoSettleThreshold}% sold
            </p>
          </div>
        </div>
      </div>

      {/* Emergency Actions */}
      <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
        <div className="flex items-center space-x-3 mb-6">
          <AlertCircle className="w-6 h-6 text-red-400" />
          <h3 className="text-xl font-bold text-white">Emergency Actions</h3>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-red-500/20 border border-red-400/30 rounded-lg">
            <h4 className="text-red-200 font-medium mb-2">Emergency Withdraw</h4>
            <p className="text-red-200 text-sm mb-4">
              Withdraw all funds from a specific blind box in case of emergency.
            </p>
            <button
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              onClick={() => toast.error('Emergency withdraw functionality will be implemented')}
            >
              Emergency Withdraw
            </button>
          </div>

          <div className="p-4 bg-yellow-500/20 border border-yellow-400/30 rounded-lg">
            <h4 className="text-yellow-200 font-medium mb-2">Force Settle</h4>
            <p className="text-yellow-200 text-sm mb-4">
              Force settle a blind box before it reaches the auto-settle threshold.
            </p>
            <button
              className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
              onClick={() => toast.error('Force settle functionality will be implemented')}
            >
              Force Settle
            </button>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save Settings</span>
            </>
          )}
        </button>
      </div>
    </div>
  )
}
