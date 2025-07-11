// src/app/(app)/fitness/logger/page.tsx
'use client'

import { useRouter } from 'next/navigation';
import WorkoutLogger from '@/components/fitness/WorkoutLogger';

export default function LoggerPage() {
  const router = useRouter();

  const handleWorkoutComplete = () => {
    // After completing a workout, redirect to the history page
    router.push('/fitness/history');
  };

  return (
    <div>
      <WorkoutLogger onWorkoutComplete={handleWorkoutComplete} />
    </div>
  );
}
