'use client';

import React, { useState, useEffect } from 'react';
import { Warehouse } from '@/types';
import { contractService } from '@/services/contract';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Package, Star, Crown } from 'lucide-react';

interface NftSelectionProps {
  onSelectionChange: (selectedNfts: string[]) => void;
  selectedNfts: string[];
}

export const NftSelection: React.FC<NftSelectionProps> = ({
  onSelectionChange,
  selectedNfts
}) => {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWarehouses();
  }, []);

  const loadWarehouses = async () => {
    try {
      setLoading(true);
      const warehousesData = await contractService.getWarehouses();
      setWarehouses(warehousesData);
    } catch (err) {
      setError('Failed to load warehouses');
      console.error('Error loading warehouses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNftToggle = (nftId: string) => {
    const newSelection = selectedNfts.includes(nftId)
      ? selectedNfts.filter(id => id !== nftId)
      : [...selectedNfts, nftId];
    
    onSelectionChange(newSelection);
  };

  const getWarehouseIcon = (warehouseId: string) => {
    switch (warehouseId) {
      case 'economy':
        return <Package className="w-5 h-5 text-green-400" />;
      case 'standard':
        return <Star className="w-5 h-5 text-blue-400" />;
      case 'premium':
        return <Crown className="w-5 h-5 text-yellow-400" />;
      default:
        return <Package className="w-5 h-5 text-gray-400" />;
    }
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

  const formatGuaranteePrice = (price: string) => {
    const numPrice = parseInt(price);
    if (numPrice >= 1000000) {
      return `${(numPrice / 1000000).toFixed(1)}M`;
    } else if (numPrice >= 1000) {
      return `${(numPrice / 1000).toFixed(1)}K`;
    }
    return price;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin" />
        <span className="ml-2">Loading warehouses...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-400">
        <p>{error}</p>
        <Button onClick={loadWarehouses} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">
          Select Your Preferred NFTs
        </h3>
        <p className="text-gray-400 text-sm">
          Choose NFTs from different warehouses to increase your chances of getting them
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <p>Base Price: {warehouse.price_multiplier * 1} USDT</p>
                <p>Available: {warehouse.current_capacity} NFTs</p>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {warehouse.nft_list.map((nft) => (
                  <div
                    key={nft.id}
                    className={`flex items-center space-x-3 p-2 rounded-lg border transition-colors ${
                      selectedNfts.includes(nft.id)
                        ? 'border-blue-400 bg-blue-400/20'
                        : 'border-gray-600 bg-gray-800/50 hover:bg-gray-700/50'
                    }`}
                  >
                    <Checkbox
                      checked={selectedNfts.includes(nft.id)}
                      onCheckedChange={() => handleNftToggle(nft.id)}
                      className="border-gray-400"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {nft.id}
                      </p>
                      <p className="text-xs text-gray-400">
                        Guarantee: {formatGuaranteePrice(nft.guarantee_price)}
                      </p>
                    </div>
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
                ))}
              </div>
              {warehouse.nft_list.length === 0 && (
                <div className="text-center py-4 text-gray-400">
                  <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No NFTs available</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedNfts.length > 0 && (
        <div className="text-center">
          <Badge variant="outline" className="text-sm">
            {selectedNfts.length} NFT(s) selected
          </Badge>
        </div>
      )}
    </div>
  );
};
