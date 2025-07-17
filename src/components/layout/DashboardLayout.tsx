
'use client'

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { ModeToggle } from '@/components/ui/mode-toggle';
import { LogOut, Settings, LayoutDashboard, Dumbbell, Scale, Utensils } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navItems = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Fitness', href: '/fitness', icon: Dumbbell },
    { name: 'Weight', href: '/weight', icon: Scale },
    { name: 'Nutrition', href: '/nutrition', icon: Utensils },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex flex-col">
      {/* Header */}
      <header className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold">
                Synthetivolve
              </h1>
              <nav className="ml-8 hidden md:flex space-x-4">
                {navItems.map((item) => (
                  <Button
                    key={item.href}
                    variant="ghost"
                    size="sm"
                    onClick={() => router.push(item.href)}
                    className={pathname === item.href ? 'bg-accent text-accent-foreground' : ''}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Button>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-3">
              <ModeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push('/profile')} // Navigate to dedicated profile page
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {children}
      </main>
    </div>
  );
}
