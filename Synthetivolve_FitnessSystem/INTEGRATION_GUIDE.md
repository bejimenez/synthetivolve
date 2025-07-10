# Synthetivolve Fitness Module - Integration Guide

## Overview
This fitness module provides comprehensive mesocycle planning and workout logging functionality for the Synthetivolve platform. The components are designed to be modular and easily integrated into existing React applications.

## Architecture

### Core Components
- **Dashboard** - Overview and quick actions
- **MesocyclePlanner** - Create and edit training mesocycles
- **WorkoutLogger** - Log workout sessions
- **ExerciseLibrary** - Manage exercise database
- **TemplateManager** - Save/load mesocycle templates
- **WorkoutHistory** - View past workouts

### Data Layer
- **StorageService** - Local storage management (easily replaceable with API calls)
- **Types** - TypeScript interfaces for all data models
- **Utils** - Helper functions for calculations and formatting

## Integration Steps

### 1. Install Dependencies
```bash
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities zod uuid
npm install -D @types/uuid
```

### 2. Copy Source Files
Copy the entire `src` directory structure to your project:
```
src/
├── components/
│   ├── ui/           # Shadcn/ui components
│   ├── Dashboard.tsx
│   ├── MesocyclePlanner.tsx
│   ├── WorkoutLogger.tsx
│   ├── ExerciseLibrary.tsx
│   ├── TemplateManager.tsx
│   ├── WorkoutHistory.tsx
│   ├── ExerciseLogger.tsx
│   ├── WorkoutSummary.tsx
│   ├── DayBuilder.tsx
│   └── Navigation.tsx
├── types/
│   └── index.ts      # All TypeScript interfaces
├── lib/
│   ├── utils.ts      # Helper functions
│   └── storage.ts    # Data persistence layer
```

### 3. Replace Storage Layer
The `StorageService` class uses localStorage. Replace it with your API calls:

```typescript
// Example: Replace localStorage with API calls
export class StorageService {
  static async saveMesocycle(mesocycle: MesocyclePlan): Promise<void> {
    await fetch('/api/mesocycles', {
      method: 'POST',
      body: JSON.stringify(mesocycle)
    });
  }
  
  static async getAllMesocycles(): Promise<MesocyclePlan[]> {
    const response = await fetch('/api/mesocycles');
    return response.json();
  }
  // ... other methods
}
```

### 4. Integrate with Existing Auth
Update components to use your existing user authentication:

```typescript
// Add user context to components
interface ComponentProps {
  userId?: string;
  // ... other props
}
```

### 5. Customize UI Components
The UI components use Shadcn/ui. You can:
- Replace with your existing design system
- Customize the Tailwind classes
- Modify the component structure

### 6. Navigation Integration
Replace the `Navigation` component with your existing navigation system and use individual components as needed:

```typescript
// Example: Use individual components
import { MesocyclePlanner } from './components/MesocyclePlanner';
import { WorkoutLogger } from './components/WorkoutLogger';

// In your existing route structure
<Route path="/fitness/planner" component={MesocyclePlanner} />
<Route path="/fitness/workout" component={WorkoutLogger} />
```

## Key Features

### Mesocycle Planning
- 2-16 week programs
- 1-7 training days per week
- Muscle group specialization (up to 2 groups)
- Real-time volume tracking
- Drag-and-drop exercise arrangement

### Workout Logging
- Set-by-set logging
- RIR/RPE or %1RM support
- Previous workout data display
- Session summaries
- Freestyle and planned workouts

### Data Models
All data models are fully typed with TypeScript interfaces:
- `MesocyclePlan` - Complete training program
- `Exercise` - Exercise definitions
- `WorkoutLog` - Completed workout sessions
- `SetLog` - Individual set data

### Exercise Management
- Custom exercise creation
- Equipment and muscle group tagging
- Notes and instructions
- RIR/RPE vs %1RM preference per exercise

## Customization Points

### 1. Styling
- All components use Tailwind CSS classes
- Easy to replace with your design tokens
- Responsive design included

### 2. Data Persistence
- `StorageService` is the only data layer
- Replace with your API endpoints
- Maintain the same interface for seamless integration

### 3. User Management
- Currently uses localStorage for session tracking
- Integrate with your user authentication system
- Add user-specific data filtering

### 4. Validation
- Uses Zod for runtime validation
- Extend validation rules as needed
- Add server-side validation

## Dependencies Used
- `@dnd-kit/*` - Drag and drop functionality
- `zod` - Runtime type validation
- `uuid` - Unique ID generation
- `lucide-react` - Icons (already in Shadcn/ui)
- `tailwindcss` - Styling
- `clsx` & `tailwind-merge` - Conditional classes

## Component Props
Each component is designed to accept minimal props and handle its own state:

```typescript
// Example component usage
<MesocyclePlanner 
  onSave={(mesocycle) => handleSave(mesocycle)}
  editingMesocycle={selectedMesocycle}
/>

<WorkoutLogger 
  onWorkoutComplete={(log) => handleWorkoutComplete(log)}
/>
```

## Testing
The application has been tested with:
- Mesocycle creation and editing
- Exercise library management
- Workout logging workflows
- Data persistence
- Responsive design
- TypeScript compilation

## Next Steps
1. Review the code structure
2. Adapt the storage layer to your API
3. Integrate with your authentication system
4. Customize styling to match your design system
5. Add any additional features specific to your platform

The module is designed to be a complete fitness tracking solution that can grow with your platform's needs.

