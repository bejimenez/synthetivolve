// src/app/(app)/fitness/planner/page.tsx
'use client'

import { useRouter } from 'next/navigation';
import MesocyclePlanner from '@/components/fitness/MesocyclePlanner';
import { useFitness } from '@/hooks/useFitness';
import { MesocycleSavePayload } from '@/lib/fitness.types';

export default function PlannerPage() {
  const router = useRouter();
  const { createMesocycle } = useFitness();

  const handleSave = async (mesocycle: MesocycleSavePayload) => {
    await createMesocycle(mesocycle);
    router.push('/');
  };

  return (
    <div>
      <MesocyclePlanner onSave={handleSave} />
    </div>
  );
}
