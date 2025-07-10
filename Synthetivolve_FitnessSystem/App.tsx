import React, { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import MesocyclePlanner from './components/MesocyclePlanner';
import WorkoutLogger from './components/WorkoutLogger';
import TemplateManager from './components/TemplateManager';
import WorkoutHistory from './components/WorkoutHistory';
import { MesocyclePlan } from './types';
import { StorageService } from './lib/storage';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [editingMesocycle, setEditingMesocycle] = useState<MesocyclePlan | null>(null);

  useEffect(() => {
    // Initialize with some default exercises if none exist
    initializeDefaultData();
  }, []);

  const initializeDefaultData = () => {
    const existingExercises = StorageService.getAllExercises();
    
    if (existingExercises.length === 0) {
      // Add some default exercises
      const defaultExercises = [
        {
          id: 'bench-press',
          name: 'Barbell Bench Press',
          primary: 'CHEST' as const,
          secondary: ['TRICEPS' as const, 'SHOULDERS' as const],
          equipment: 'Barbell',
          notes: 'Keep shoulder blades retracted and feet planted',
          useRIRRPE: true
        },
        {
          id: 'squat',
          name: 'Barbell Back Squat',
          primary: 'QUADS' as const,
          secondary: ['GLUTES' as const, 'HAMSTRINGS' as const],
          equipment: 'Barbell',
          notes: 'Maintain neutral spine and drive through heels',
          useRIRRPE: true
        },
        {
          id: 'deadlift',
          name: 'Conventional Deadlift',
          primary: 'BACK' as const,
          secondary: ['HAMSTRINGS' as const, 'GLUTES' as const],
          equipment: 'Barbell',
          notes: 'Keep bar close to body throughout the movement',
          useRIRRPE: true
        },
        {
          id: 'overhead-press',
          name: 'Overhead Press',
          primary: 'SHOULDERS' as const,
          secondary: ['TRICEPS' as const],
          equipment: 'Barbell',
          notes: 'Press in straight line, engage core',
          useRIRRPE: true
        },
        {
          id: 'bent-over-row',
          name: 'Bent Over Barbell Row',
          primary: 'BACK' as const,
          secondary: ['BICEPS' as const],
          equipment: 'Barbell',
          notes: 'Pull to lower chest, squeeze shoulder blades',
          useRIRRPE: true
        }
      ];

      defaultExercises.forEach(exercise => {
        StorageService.saveExercise(exercise);
      });
    }
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    setEditingMesocycle(null);
  };

  const handleMesocycleSave = (mesocycle: MesocyclePlan) => {
    // Mesocycle is already saved in the component
    setCurrentView('home');
    setEditingMesocycle(null);
  };

  const handleTemplateSelect = (template: MesocyclePlan) => {
    setEditingMesocycle(template);
    setCurrentView('planner');
  };

  const handleCreateNewMesocycle = () => {
    setEditingMesocycle(null);
    setCurrentView('planner');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'home':
        return <Dashboard onNavigate={handleViewChange} />;
      
      case 'planner':
        return (
          <MesocyclePlanner
            onSave={handleMesocycleSave}
            editingMesocycle={editingMesocycle}
          />
        );
      
      case 'workout':
        return <WorkoutLogger />;
      
      case 'templates':
        return (
          <TemplateManager
            onSelectTemplate={handleTemplateSelect}
            onCreateNew={handleCreateNewMesocycle}
          />
        );
      
      case 'history':
        return <WorkoutHistory />;
      
      default:
        return <Dashboard onNavigate={handleViewChange} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation currentView={currentView} onViewChange={handleViewChange} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {renderCurrentView()}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600">
            <p>© 2024 Synthetivolve. Built for serious lifters who value structured training.</p>
            <p className="mt-1">
              Track your progress, optimize your gains, and evolve your training.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;

