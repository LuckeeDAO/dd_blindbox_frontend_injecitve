/**
 * V2.0 揭示页面（动态路由）
 */

'use client';

import React from 'react';
import { RevealPageV2 } from '@/components/v2';
import { use } from 'react';

export default function RevealPage({ params }: { params: Promise<{ period: string }> }) {
  const { period } = use(params);
  const periodNum = parseInt(period);

  return <RevealPageV2 period={periodNum} />;
}

