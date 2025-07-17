import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { NutritionLogger } from '@/components/nutrition/NutritionLogger'; // This component will be created next

export const dynamic = 'force-dynamic';

export default async function NutritionPage() {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    redirect('/auth');
  }

  return (
    <DashboardLayout>
      <NutritionLogger />
    </DashboardLayout>
  );
}