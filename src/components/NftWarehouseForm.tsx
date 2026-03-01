'use client';

import React, { useState, useEffect } from 'react';
import { Warehouse, RegisterNftRequest, CreateAndRegisterNftRequest } from '@/types';
import { contractService } from '@/services/contract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { Separator } from '@/components/ui/separator';
import { Loader2, Package, Plus, Upload, AlertCircle, CheckCircle } from 'lucide-react';

interface NftWarehouseFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const NftWarehouseForm: React.FC<NftWarehouseFormProps> = ({
  onSuccess,
  onCancel
}) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // 注册现有NFT表单状态
  const [registerForm, setRegisterForm] = useState<RegisterNftRequest>({
    nft_id: '',
    contract_address: '',
    warehouse_id: '',
    guarantee_price: ''
  });

  // 创建并注册NFT表单状态
  const [createForm, setCreateForm] = useState<CreateAndRegisterNftRequest>({
    nft_id: '',
    contract_address: '',
    warehouse_id: '',
    guarantee_price: '',
    metadata: ''
  });

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

  const handleRegisterNft = async () => {
    if (!registerForm.nft_id || !registerForm.contract_address || !registerForm.warehouse_id || !registerForm.guarantee_price) {
      setError('请填写所有必填字段');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const result = await contractService.registerNft(registerForm);

      if (result.success) {
        setSuccess(`NFT registered successfully! Transaction: ${result.txHash}`);
        setRegisterForm({
          nft_id: '',
          contract_address: '',
          warehouse_id: '',
          guarantee_price: ''
        });
        onSuccess?.();
      } else {
        setError(result.error || 'Failed to register NFT');
      }
    } catch (err) {
      setError('发生意外错误');
      console.error('Register NFT error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateAndRegisterNft = async () => {
    if (!createForm.nft_id || !createForm.contract_address || !createForm.warehouse_id || !createForm.guarantee_price) {
      setError('请填写所有必填字段');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      setSuccess(null);

      const result = await contractService.createAndRegisterNft(createForm);

      if (result.success) {
        setSuccess(`NFT 创建并注册成功！交易哈希: ${result.txHash}`);
        setCreateForm({
          nft_id: '',
          contract_address: '',
          warehouse_id: '',
          guarantee_price: '',
          metadata: ''
        });
        onSuccess?.();
      } else {
        setError(result.error || '创建并注册 NFT 失败');
      }
    } catch (err) {
      setError('发生意外错误');
      console.error('Create and register NFT error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const getWarehouseInfo = (warehouseId: string) => {
    return warehouses.find(w => w.id === warehouseId);
  };

  // const formatGuaranteePrice = (price: string) => {
  //   const numPrice = parseInt(price);
  //   if (numPrice >= 1000000) {
  //     return `${(numPrice / 1000000).toFixed(1)}M`;
  //   } else if (numPrice >= 1000) {
  //     return `${(numPrice / 1000).toFixed(1)}K`;
  //   }
  //   return price;
  // };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">正在加载仓库...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          NFT 仓库管理
        </h2>
        <p className="text-gray-400">
          注册您现有的 NFT 或创建新的 NFT 并将其添加到仓库
        </p>
      </div>

      {/* 仓库信息概览 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {warehouses.map((warehouse) => (
          <Card key={warehouse.id} className="bg-gray-800 border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-blue-400" />
                  <span className="text-white">{warehouse.name}</span>
                </div>
              </CardTitle>
              <div className="text-sm text-gray-400">
                <p>基本价格: {warehouse.price_multiplier * 1} USDT</p>
                <p>容量: {warehouse.current_capacity} / {warehouse.max_capacity}</p>
                <p>NFTs: {warehouse.nft_list.length}</p>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* 错误和成功消息 */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-500/20 border border-red-400/30 rounded-lg mb-6">
          <AlertCircle className="w-5 h-5 text-red-400" />
          <span className="text-red-200 text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center space-x-2 p-3 bg-green-500/20 border border-green-400/30 rounded-lg mb-6">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-200 text-sm">{success}</span>
        </div>
      )}

      {/* 主要表单 */}
      <Tabs defaultValue="register" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="register" className="flex items-center space-x-2">
            <Upload className="w-4 h-4" />
            <span>注册现有 NFT</span>
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>创建新 NFT</span>
          </TabsTrigger>
        </TabsList>

        {/* 注册现有NFT */}
        <TabsContent value="register" className="space-y-6">
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white">注册现有 NFT</CardTitle>
              <p className="text-gray-400 text-sm">
                将现有 NFT 注册到仓库用于盲盒分发
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="register-nft-id" className="text-white">NFT ID *</Label>
                  <Input
                    id="register-nft-id"
                    placeholder="输入 NFT ID"
                    value={registerForm.nft_id}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, nft_id: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-contract" className="text-white">合约地址 *</Label>
                  <Input
                    id="register-contract"
                    placeholder="输入 NFT 合约地址"
                    value={registerForm.contract_address}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, contract_address: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="register-warehouse" className="text-white">仓库 *</Label>
                  <Select
                    value={registerForm.warehouse_id}
                    onValueChange={(value) => setRegisterForm(prev => ({ ...prev, warehouse_id: value }))}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="选择仓库" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name} ({warehouse.current_capacity}/{warehouse.max_capacity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="register-price" className="text-white">担保价格 *</Label>
                  <Input
                    id="register-price"
                    type="number"
                    placeholder="输入担保价格"
                    value={registerForm.guarantee_price}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, guarantee_price: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              {registerForm.warehouse_id && (
                <div className="p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                  <p className="text-blue-200 text-sm">
                    仓库: {getWarehouseInfo(registerForm.warehouse_id)?.name}
                  </p>
                  <p className="text-blue-200 text-sm">
                    基本价格: {(getWarehouseInfo(registerForm.warehouse_id)?.price_multiplier || 0) * 1} USDT
                  </p>
                </div>
              )}

              <Button
                onClick={handleRegisterNft}
                disabled={submitting}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    注册中...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    注册 NFT
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 创建新NFT */}
        <TabsContent value="create" className="space-y-6">
          <Card className="bg-gray-800 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white">创建新 NFT</CardTitle>
              <p className="text-gray-400 text-sm">
                创建新的 NFT 并将其注册到仓库
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-nft-id" className="text-white">NFT ID *</Label>
                  <Input
                    id="create-nft-id"
                    placeholder="输入 NFT ID"
                    value={createForm.nft_id}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, nft_id: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-contract" className="text-white">Contract Address *</Label>
                  <Input
                    id="create-contract"
                    placeholder="输入 NFT 合约地址"
                    value={createForm.contract_address}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, contract_address: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="create-warehouse" className="text-white">仓库 *</Label>
                  <Select
                    value={createForm.warehouse_id}
                    onValueChange={(value) => setCreateForm(prev => ({ ...prev, warehouse_id: value }))}
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="选择仓库" />
                    </SelectTrigger>
                    <SelectContent>
                      {warehouses.map((warehouse) => (
                        <SelectItem key={warehouse.id} value={warehouse.id}>
                          {warehouse.name} ({warehouse.current_capacity}/{warehouse.max_capacity})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-price" className="text-white">担保价格 *</Label>
                  <Input
                    id="create-price"
                    type="number"
                    placeholder="输入担保价格"
                    value={createForm.guarantee_price}
                    onChange={(e) => setCreateForm(prev => ({ ...prev, guarantee_price: e.target.value }))}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="create-metadata" className="text-white">元数据 URI (可选)</Label>
                <Input
                  id="create-metadata"
                  placeholder="输入元数据 URI (例如: ipfs://...)"
                  value={createForm.metadata || ''}
                  onChange={(e) => setCreateForm(prev => ({ ...prev, metadata: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              {createForm.warehouse_id && (
                <div className="p-3 bg-blue-500/20 border border-blue-400/30 rounded-lg">
                  <p className="text-blue-200 text-sm">
                    仓库: {getWarehouseInfo(createForm.warehouse_id)?.name}
                  </p>
                  <p className="text-blue-200 text-sm">
                    基本价格: {(getWarehouseInfo(createForm.warehouse_id)?.price_multiplier || 0) * 1} USDT
                  </p>
                </div>
              )}

              <Button
                onClick={handleCreateAndRegisterNft}
                disabled={submitting}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    创建中...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    创建并注册 NFT
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 操作按钮 */}
      <div className="flex space-x-3 mt-6">
        {onCancel && (
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1"
          >
            取消
          </Button>
        )}
      </div>
    </div>
  );
};
