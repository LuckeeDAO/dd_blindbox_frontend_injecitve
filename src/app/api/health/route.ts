import { NextResponse } from 'next/server';
import { getChainConfig } from '@/config/chains';

export async function GET() {
  try {
    const defaultChain = process.env.NEXT_PUBLIC_DEFAULT_CHAIN || 'avalanche_fuji';
    const chain = getChainConfig(defaultChain);

    // 检查系统状态
    const healthStatus = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'Luckee Blind Box',
      version: '1.0.0',
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      chain: {
        key: chain.key,
        family: chain.family,
        id: chain.chainId,
        rpc: chain.rpcUrl,
        contract: chain.contractAddress,
      },
      features: {
        blindBox: true,
        nft: true,
        trading: true,
        admin: true,
      },
    };

    return NextResponse.json(healthStatus, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
