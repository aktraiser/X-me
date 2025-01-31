'use client';

import { Suspense } from 'react';
import MarketResearchChatWindow from '@/components/MarketResearchChatWindow';

export default function MarketResearchPage() {
  return (
    <div className="flex-1 h-full">
      <Suspense fallback={<div>Loading...</div>}>
        <MarketResearchChatWindow />
      </Suspense>
    </div>
  );
}
