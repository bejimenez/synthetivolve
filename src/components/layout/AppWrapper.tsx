
'use client'

import { useAuth } from '@/components/auth/AuthProvider';
import DashboardLayout from '@/components/layout/DashboardLayout';
import AuthPage from '@/app/auth/page';
import { Loader2 } from 'lucide-react';

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-6">
            <span className="text-white font-bold text-2xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Synthetivolve</h1>
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-gray-600 mt-4">Loading your health dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}
