// src/app/(app)/fitness/planner/page.tsx
'use client'

import { useRouter } from 'next/navigation';
import MesocyclePlanner from '@/components/fitness/MesocyclePlanner';

export default function PlannerPage() {
  const router = useRouter();

  const handleSave = () => {
    // After saving, redirect to the main dashboard
    router.push('/dashboard');
  };

  return (
    <div>
      <MesocyclePlanner onSave={handleSave} />
    </div>
  );
}
