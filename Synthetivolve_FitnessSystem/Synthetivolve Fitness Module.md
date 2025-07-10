# Synthetivolve Fitness Module

A comprehensive fitness tracking module for mesocycle planning and workout logging, designed for integration into the Synthetivolve platform.

## 🏋️ Features

### Mesocycle Planning
- **Flexible Programming**: 2-16 week mesocycles with 1-7 training days per week
- **Muscle Group Specialization**: Focus on up to 2 muscle groups with volume tracking
- **Real-time Volume Calculation**: Automatic tracking of weekly muscle group volume
- **Drag & Drop Interface**: Intuitive exercise arrangement with visual feedback
- **Template System**: Save, load, and share mesocycle templates

### Workout Logging
- **Dual Tracking Systems**: Support for both RIR/RPE and %1RM methodologies
- **Previous Data Display**: View past performance for each exercise
- **Flexible Logging**: Planned workouts or freestyle sessions
- **Session Summaries**: Comprehensive post-workout analysis
- **Progress Tracking**: Historical data with filtering and search

### Exercise Management
- **Custom Exercise Library**: Create and manage your own exercise database
- **Muscle Group Tagging**: Primary and secondary muscle group assignments
- **Equipment Tracking**: Organize exercises by equipment type
- **Notes & Instructions**: Add custom notes for proper form and technique

## 🛠️ Technical Stack

- **TypeScript** - Full type safety and IntelliSense support
- **React** - Modern functional components with hooks
- **Shadcn/ui** - Accessible, customizable UI components
- **dnd-kit** - Smooth drag-and-drop functionality
- **Tailwind CSS** - Utility-first styling with responsive design
- **Zod** - Runtime type validation and schema validation

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                    # Shadcn/ui base components
│   ├── Dashboard.tsx          # Main overview dashboard
│   ├── MesocyclePlanner.tsx   # Mesocycle creation/editing
│   ├── WorkoutLogger.tsx      # Workout session logging
│   ├── ExerciseLibrary.tsx    # Exercise management
│   ├── TemplateManager.tsx    # Template management
│   ├── WorkoutHistory.tsx     # Historical workout data
│   ├── ExerciseLogger.tsx     # Individual exercise logging
│   ├── WorkoutSummary.tsx     # Post-workout summary
│   ├── DayBuilder.tsx         # Drag-and-drop day builder
│   └── Navigation.tsx         # Main navigation component
├── types/
│   └── index.ts               # TypeScript type definitions
├── lib/
│   ├── utils.ts               # Helper functions and calculations
│   └── storage.ts             # Data persistence layer
└── App.tsx                    # Main application component
```

## 🚀 Quick Start

### Installation
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities zod uuid
npm install -D @types/uuid typescript
```

### Basic Usage
```typescript
import { MesocyclePlanner, WorkoutLogger } from './components';

function FitnessApp() {
  return (
    <div>
      <MesocyclePlanner onSave={(mesocycle) => console.log(mesocycle)} />
      <WorkoutLogger onWorkoutComplete={(log) => console.log(log)} />
    </div>
  );
}
```

## 🔧 Integration

### Replace Storage Layer
The module uses localStorage by default. Replace `StorageService` with your API:

```typescript
// lib/storage.ts
export class StorageService {
  static async saveMesocycle(mesocycle: MesocyclePlan): Promise<void> {
    await fetch('/api/mesocycles', {
      method: 'POST',
      body: JSON.stringify(mesocycle)
    });
  }
  // ... other methods
}
```

### Customize Styling
All components use Tailwind CSS classes. Customize via:
- Tailwind configuration
- CSS variable overrides
- Component prop modifications

### Add Authentication
Integrate with your existing auth system:

```typescript
// Add user context to components
<MesocyclePlanner 
  userId={currentUser.id}
  onSave={(mesocycle) => saveMesocycle(currentUser.id, mesocycle)}
/>
```

## 📊 Data Models

### Core Types
- `MesocyclePlan` - Complete training program structure
- `Exercise` - Exercise definition with muscle groups and equipment
- `WorkoutLog` - Completed workout session with all exercise data
- `SetLog` - Individual set with weight, reps, and intensity

### Muscle Groups
Supports 11 muscle groups: Chest, Back, Shoulders, Triceps, Biceps, Quads, Hamstrings, Glutes, Calves, Abs, Forearms

## 🎯 Key Features for Integration

### Modular Design
- Each component is self-contained
- Minimal prop requirements
- No global state dependencies
- Easy to integrate piece by piece

### Type Safety
- Full TypeScript coverage
- Runtime validation with Zod
- IntelliSense support for all APIs

### Responsive Design
- Mobile-first approach
- Touch-friendly interactions
- Adaptive layouts for all screen sizes

### Accessibility
- WCAG compliant components
- Keyboard navigation support
- Screen reader friendly

## 📖 Documentation

- **INTEGRATION_GUIDE.md** - Detailed integration instructions
- **COMPONENT_OVERVIEW.md** - Component architecture and dependencies

## 🔄 Data Flow

1. **Mesocycle Creation** → Template Storage → Workout Planning
2. **Workout Logging** → Exercise Tracking → Progress Analysis
3. **Historical Data** → Performance Insights → Program Optimization

## 🎨 Customization

The module is designed for easy customization:
- **UI Components**: Replace Shadcn/ui with your design system
- **Data Layer**: Swap localStorage for your API
- **Styling**: Customize Tailwind classes or use CSS modules
- **Validation**: Extend Zod schemas for additional rules

## 🚀 Production Ready

- Comprehensive error handling
- Form validation and user feedback
- Performance optimized with React best practices
- Mobile-responsive design
- TypeScript for maintainability

## 📝 License

This module is designed for integration into the Synthetivolve platform. All components are modular and can be adapted for your specific needs.

---

**Ready for Integration** - This fitness module provides a complete foundation for advanced workout tracking and mesocycle planning within your existing application.

