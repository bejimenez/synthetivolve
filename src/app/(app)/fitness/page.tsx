// src/app/(app)/fitness/page.tsx
'use client'

import { useRouter } from 'next/navigation';
import FitnessDashboard from '@/components/fitness/Dashboard';

export default function FitnessPage() {
  const router = useRouter();

  const handleNavigate = (view: string) => {
    router.push(`/fitness/${view}`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <FitnessDashboard onNavigate={handleNavigate} />
    </div>
  );
}
