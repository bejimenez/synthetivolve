import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { NutritionOverview } from '@/components/nutrition/NutritionOverview'; // This component will be created next

export const dynamic = 'force-dynamic';

export default async function NutritionOverviewPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth');
  }

  return (
    <DashboardLayout>
      <NutritionOverview />
    </DashboardLayout>
  );
}