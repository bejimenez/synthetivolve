import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Calendar, 
  Dumbbell, 
  History, 
  BookOpen, 
  Settings,
  Home,
  Target
} from 'lucide-react';

interface NavigationProps {
  currentView: string;
  onViewChange: (view: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    {
      id: 'home',
      label: 'Home',
      icon: Home,
      description: 'Dashboard and overview'
    },
    {
      id: 'planner',
      label: 'Planner',
      icon: Calendar,
      description: 'Create and manage mesocycles'
    },
    {
      id: 'workout',
      label: 'Workout',
      icon: Dumbbell,
      description: 'Log your training sessions'
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: BookOpen,
      description: 'Manage workout templates'
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
      description: 'View past workouts'
    }
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Target className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Synthetivolve</h1>
              <p className="text-xs text-gray-500">Smart Training Platform</p>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <Button
                  key={item.id}
                  variant={isActive ? "default" : "ghost"}
                  onClick={() => onViewChange(item.id)}
                  className="flex items-center space-x-2"
                  title={item.description}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </div>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <select
              value={currentView}
              onChange={(e) => onViewChange(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              {navItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden border-t border-gray-200">
        <div className="grid grid-cols-5 gap-1 p-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                onClick={() => onViewChange(item.id)}
                className="flex flex-col items-center space-y-1 h-auto py-2"
                size="sm"
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;

