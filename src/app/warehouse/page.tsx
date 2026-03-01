'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Warehouse } from '@/types';
import { contractService } from '@/services/contract';
import { NftWarehouseForm } from '@/components/NftWarehouseForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Package, Plus, AlertCircle } from 'lucide-react';

export default function WarehousePage() {
  const router = useRouter();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const warehousesData = await contractService.getWarehouses();
      setWarehouses(Array.isArray(warehousesData) ? warehousesData : []);
    } catch (err) {
      setError('加载仓库失败');
      console.error('Error loading warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    loadWarehouses(); // 重新加载仓库数据
  };

  const getWarehouseColor = (warehouseId: string) => {
    switch (warehouseId) {
      case 'economy':
        return 'border-green-400/30 bg-green-400/10';
      case 'standard':
        return 'border-blue-400/30 bg-blue-400/10';
      case 'premium':
        return 'border-yellow-400/30 bg-yellow-400/10';
      default:
        return 'border-gray-400/30 bg-gray-400/10';
    }
  };

  const getWarehouseIcon = (warehouseId: string) => {
    switch (warehouseId) {
      case 'economy':
        return <Package className="w-5 h-5 text-green-400" />;
      case 'standard':
        return <Package className="w-5 h-5 text-blue-400" />;
      case 'premium':
        return <Package className="w-5 h-5 text-yellow-400" />;
      default:
        return <Package className="w-5 h-5 text-gray-400" />;
    }
  };

  const formatGuaranteePrice = (price: string) => {
    const numPrice = parseInt(price);
    if (numPrice >= 1000000) {
      return `${(numPrice / 1000000).toFixed(1)}M`;
    } else if (numPrice >= 1000) {
      return `${(numPrice / 1000).toFixed(1)}K`;
    }
    return price;
  };

  if (showForm) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => setShowForm(false)}
              className="mb-4 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Warehouses
            </Button>
          </div>
          
          <NftWarehouseForm
            onSuccess={handleFormSuccess}
            onCancel={() => setShowForm(false)}
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-white" />
          <p className="text-white">正在加载仓库...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">错误</h2>
            <p className="text-gray-400 mb-4">{error}</p>
            <Button onClick={loadWarehouses} className="w-full">
              重试
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="mb-4 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              返回首页
            </Button>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                NFT 仓库管理
              </h1>
              <p className="text-gray-400">
                管理盲盒分发中的 NFT 仓库
              </p>
            </div>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              添加 NFT
            </Button>
          </div>
        </div>

        {/* 仓库概览 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {warehouses.map((warehouse) => (
            <Card key={warehouse.id} className={`${getWarehouseColor(warehouse.id)} border`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-lg">
                  <div className="flex items-center space-x-2">
                    {getWarehouseIcon(warehouse.id)}
                    <span className="text-white">{warehouse.name}</span>
                  </div>
                </CardTitle>
                <div className="text-sm text-gray-400">
                  <p>基本价格: {warehouse.price_multiplier * 1} USDT</p>
                  <p>容量: {warehouse.current_capacity} / {warehouse.max_capacity}</p>
                  <p>状态: {warehouse.status}</p>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-white">NFTs ({warehouse.nft_list.length})</h4>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {warehouse.nft_list.slice(0, 5).map((nft) => (
                      <div key={nft.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-300 truncate">{nft.id}</span>
                        <Badge variant="outline" className="text-xs">
                          {formatGuaranteePrice(nft.guarantee_price)}
                        </Badge>
                      </div>
                    ))}
                    {warehouse.nft_list.length > 5 && (
                      <p className="text-xs text-gray-400">
                        ... 还有 {warehouse.nft_list.length - 5} 个
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* 详细仓库信息 */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">仓库详情</h2>
          
          {warehouses.map((warehouse) => (
            <Card key={warehouse.id} className="bg-gray-800 border-gray-600">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  {getWarehouseIcon(warehouse.id)}
                  <span>{warehouse.name}</span>
                  <Badge variant="outline" className="ml-auto">
                    {warehouse.status}
                  </Badge>
                </CardTitle>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-400">
                  <div>
                    <p className="font-medium">基本价格</p>
                    <p className="text-white">{warehouse.price_multiplier * 1} USDT</p>
                  </div>
                  <div>
                    <p className="font-medium">容量</p>
                    <p className="text-white">{warehouse.current_capacity} / {warehouse.max_capacity}</p>
                  </div>
                  <div>
                    <p className="font-medium">NFTs</p>
                    <p className="text-white">{warehouse.nft_list.length}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-white">NFT 列表</h4>
                  {warehouse.nft_list.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>此仓库暂无 NFT</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {warehouse.nft_list.map((nft) => (
                        <div
                          key={nft.id}
                          className="p-4 bg-gray-700 rounded-lg border border-gray-600"
                        >
                          <div className="space-y-2">
                            <h5 className="font-medium text-white truncate">{nft.id}</h5>
                            <p className="text-xs text-gray-400 truncate">
                              合约: {nft.contract_address}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs">
                                {formatGuaranteePrice(nft.guarantee_price)}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  nft.status === 'Available'
                                    ? 'border-green-400 text-green-400'
                                    : 'border-gray-400 text-gray-400'
                                }`}
                              >
                                {nft.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-400">
                              所有者: {nft.owner}
                            </p>
                            <p className="text-xs text-gray-400">
                              注册时间: {new Date(nft.registered_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
