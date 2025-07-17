// src/components/dashboard/tabs/NutritionTab.tsx
'use client'

import { NutritionOverview } from '@/components/nutrition/NutritionOverview';

export function NutritionTab() {
  return (
    <div className="space-y-8">
      <NutritionOverview />
    </div>
  );
}
