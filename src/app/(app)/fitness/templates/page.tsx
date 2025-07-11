// src/app/(app)/fitness/templates/page.tsx
'use client'

import { useRouter } from 'next/navigation';
import TemplateManager from '@/components/fitness/TemplateManager';
import type { MesocyclePlan as Mesocycle } from '@/lib/fitness.types';

export default function TemplatesPage() {
  const router = useRouter();

  const handleSelectTemplate = (template: Mesocycle) => {
    // When a template is selected, go to the planner with it
    // This will require passing the template data to the planner page,
    // which can be done via state management or query params.
    // For now, we'll just navigate to the planner.
    console.log('Selected template:', template);
    router.push('/fitness/planner');
  };

  const handleCreateNew = () => {
    router.push('/fitness/planner');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <TemplateManager 
        onSelectTemplate={handleSelectTemplate}
        onCreateNew={handleCreateNew}
      />
    </div>
  );
}
