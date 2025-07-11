// src/app/(app)/fitness/planner/page.tsx
'use client'

import { useRouter } from 'next/navigation';
import MesocyclePlanner from '@/components/fitness/MesocyclePlanner';

export default function PlannerPage() {
  const router = useRouter();

  const handleSave = () => {
    // After saving, redirect to the main fitness dashboard
    router.push('/fitness');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <MesocyclePlanner onSave={handleSave} />
    </div>
  );
}
