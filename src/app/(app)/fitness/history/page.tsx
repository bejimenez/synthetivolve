// src/app/(app)/fitness/history/page.tsx
'use client'

import WorkoutHistory from '@/components/fitness/WorkoutHistory';

export default function HistoryPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <WorkoutHistory />
    </div>
  );
}
