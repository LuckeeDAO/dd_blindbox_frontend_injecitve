'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, X, Save, AlertCircle } from 'lucide-react'
import { useCreateBlindBox } from '../../hooks/useCreateBlindBox'
import { toast } from 'react-hot-toast'

interface RarityConfig {
  rarity: string
  probability: number
  nftIds: string[]
}

export const CreateBlindBoxForm: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    totalSupply: '',
    maxPerUser: '',
    nftCollection: '',
    startTime: '',
    endTime: '',
  })

  const [rarityConfigs, setRarityConfigs] = useState<RarityConfig[]>([
    { rarity: '', probability: 0, nftIds: [''] }
  ])

  const [errors, setErrors] = useState<Record<string, string>>({})

  const createBlindBoxMutation = useCreateBlindBox()

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) newErrors.name = 'Name is required'
    if (!formData.description.trim()) newErrors.description = 'Description is required'
    if (!formData.price || parseFloat(formData.price) <= 0) newErrors.price = 'Valid price is required'
    if (!formData.totalSupply || parseInt(formData.totalSupply) <= 0) newErrors.totalSupply = 'Valid total supply is required'
    if (!formData.maxPerUser || parseInt(formData.maxPerUser) <= 0) newErrors.maxPerUser = 'Valid max per user is required'
    if (!formData.nftCollection.trim()) newErrors.nftCollection = 'NFT collection address is required'

    // Validate rarity configs
    const totalProbability = rarityConfigs.reduce((sum, config) => sum + config.probability, 0)
    if (totalProbability !== 1000) {
      newErrors.rarity = 'Total probability must be 1000 (100%)'
    }

    rarityConfigs.forEach((config, index) => {
      if (!config.rarity.trim()) {
        newErrors[`rarity_${index}`] = 'Rarity name is required'
      }
      if (config.probability <= 0) {
        newErrors[`probability_${index}`] = 'Probability must be greater than 0'
      }
      if (config.nftIds.some(id => !id.trim())) {
        newErrors[`nftIds_${index}`] = 'All NFT IDs are required'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      toast.error('Please fix the errors before submitting')
      return
    }

    try {
      const rarityConfig = rarityConfigs.map(config => ({
        rarity: config.rarity,
        probability: config.probability,
        nft_ids: config.nftIds.filter(id => id.trim())
      }))

      await createBlindBoxMutation.mutateAsync({
        name: formData.name,
        description: formData.description,
        price: { denom: 'inj', amount: formData.price },
        total_supply: parseInt(formData.totalSupply),
        max_per_user: parseInt(formData.maxPerUser),
        start_time: formData.startTime ? new Date(formData.startTime).toISOString() : undefined,
        end_time: formData.endTime ? new Date(formData.endTime).toISOString() : undefined,
        nft_collection: formData.nftCollection,
        rarity_config: rarityConfig,
      })

      toast.success('Blind box created successfully!')
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        price: '',
        totalSupply: '',
        maxPerUser: '',
        nftCollection: '',
        startTime: '',
        endTime: '',
      })
      setRarityConfigs([{ rarity: '', probability: 0, nftIds: [''] }])
    } catch (error) {
      toast.error('Failed to create blind box')
      console.error('Error creating blind box:', error)
    }
  }

  const addRarityConfig = () => {
    setRarityConfigs([...rarityConfigs, { rarity: '', probability: 0, nftIds: [''] }])
  }

  const removeRarityConfig = (index: number) => {
    if (rarityConfigs.length > 1) {
      setRarityConfigs(rarityConfigs.filter((_, i) => i !== index))
    }
  }

  const updateRarityConfig = (index: number, field: keyof RarityConfig, value: string | number | string[]) => {
    const updated = [...rarityConfigs]
    updated[index] = { ...updated[index], [field]: value }
    setRarityConfigs(updated)
  }

  const addNftId = (rarityIndex: number) => {
    const updated = [...rarityConfigs]
    updated[rarityIndex].nftIds.push('')
    setRarityConfigs(updated)
  }

  const removeNftId = (rarityIndex: number, nftIndex: number) => {
    const updated = [...rarityConfigs]
    updated[rarityIndex].nftIds = updated[rarityIndex].nftIds.filter((_, i) => i !== nftIndex)
    setRarityConfigs(updated)
  }

  const totalProbability = rarityConfigs.reduce((sum, config) => sum + config.probability, 0)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Create New Blind Box</h2>
        <p className="text-gray-300">Design and configure a new blind box for your marketplace</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white font-medium mb-2">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter blind box name"
              />
              {errors.name && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Price (inj)</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1000"
              />
              {errors.price && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.price}
                </p>
              )}
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Total Supply</label>
              <input
                type="number"
                value={formData.totalSupply}
                onChange={(e) => setFormData({ ...formData, totalSupply: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1000"
              />
              {errors.totalSupply && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.totalSupply}
                </p>
              )}
            </div>

            <div>
              <label className="block text-white font-medium mb-2">Max Per User</label>
              <input
                type="number"
                value={formData.maxPerUser}
                onChange={(e) => setFormData({ ...formData, maxPerUser: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="5"
              />
              {errors.maxPerUser && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.maxPerUser}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-white font-medium mb-2">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your blind box..."
              />
              {errors.description && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.description}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-white font-medium mb-2">NFT Collection Address</label>
              <input
                type="text"
                value={formData.nftCollection}
                onChange={(e) => setFormData({ ...formData, nftCollection: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="inj1..."
              />
              {errors.nftCollection && (
                <p className="text-red-400 text-sm mt-1 flex items-center">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {errors.nftCollection}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Time Settings */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <h3 className="text-xl font-bold text-white mb-4">Time Settings (Optional)</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-white font-medium mb-2">Start Time</label>
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-white font-medium mb-2">End Time</label>
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Rarity Configuration */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Rarity Configuration</h3>
            <button
              type="button"
              onClick={addRarityConfig}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Rarity</span>
            </button>
          </div>

          <div className="space-y-4">
            {rarityConfigs.map((config, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 rounded-lg p-4 border border-white/10"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-white font-medium">Rarity {index + 1}</h4>
                  {rarityConfigs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRarityConfig(index)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-white text-sm mb-1">Rarity Name</label>
                    <input
                      type="text"
                      value={config.rarity}
                      onChange={(e) => updateRarityConfig(index, 'rarity', e.target.value)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Common, Rare, Epic..."
                    />
                    {errors[`rarity_${index}`] && (
                      <p className="text-red-400 text-xs mt-1">{errors[`rarity_${index}`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white text-sm mb-1">Probability (‰)</label>
                    <input
                      type="number"
                      value={config.probability}
                      onChange={(e) => updateRarityConfig(index, 'probability', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="500"
                    />
                    {errors[`probability_${index}`] && (
                      <p className="text-red-400 text-xs mt-1">{errors[`probability_${index}`]}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-white text-sm mb-1">NFT IDs</label>
                    <div className="space-y-2">
                      {config.nftIds.map((nftId, nftIndex) => (
                        <div key={nftIndex} className="flex space-x-2">
                          <input
                            type="text"
                            value={nftId}
                            onChange={(e) => {
                              const updated = [...config.nftIds]
                              updated[nftIndex] = e.target.value
                              updateRarityConfig(index, 'nftIds', updated)
                            }}
                            className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="NFT ID"
                          />
                          {config.nftIds.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeNftId(index, nftIndex)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addNftId(index)}
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        + Add NFT ID
                      </button>
                    </div>
                    {errors[`nftIds_${index}`] && (
                      <p className="text-red-400 text-xs mt-1">{errors[`nftIds_${index}`]}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-4 p-4 bg-white/5 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">Total Probability:</span>
              <span className={`font-bold ${totalProbability === 1000 ? 'text-green-400' : 'text-red-400'}`}>
                {totalProbability}‰ ({totalProbability / 10}%)
              </span>
            </div>
            {errors.rarity && (
              <p className="text-red-400 text-sm mt-2 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                {errors.rarity}
              </p>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={createBlindBoxMutation.isPending}
            className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all duration-200"
          >
            {createBlindBoxMutation.isPending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Create Blind Box</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
