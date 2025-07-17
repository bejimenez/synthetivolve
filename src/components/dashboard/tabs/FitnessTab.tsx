// src/components/dashboard/tabs/FitnessTab.tsx
'use client'

import { FitnessOverview } from '@/components/fitness/dashboard/FitnessOverview';

export function FitnessTab() {
  return (
    <div className="space-y-8">
      <FitnessOverview />
    </div>
  );
}
