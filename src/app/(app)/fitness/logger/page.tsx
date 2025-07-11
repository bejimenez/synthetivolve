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
    <div className="p-4 sm:p-6 lg:p-8">
      <WorkoutLogger onWorkoutComplete={handleWorkoutComplete} />
    </div>
  );
}
