# Component Overview - Synthetivolve Fitness Module

## Component Hierarchy and Dependencies

### Core Components (Independent)

#### 1. **Dashboard.tsx**
- **Purpose**: Main overview screen with stats and quick actions
- **Dependencies**: StorageService, utils
- **Props**: `onNavigate: (view: string) => void`
- **Features**: 
  - Current mesocycle display
  - Recent workouts
  - Quick action buttons
  - Training statistics

#### 2. **MesocyclePlanner.tsx**
- **Purpose**: Create and edit training mesocycles
- **Dependencies**: ExerciseLibrary, DayBuilder, StorageService
- **Props**: 
  - `onSave?: (mesocycle: MesocyclePlan) => void`
  - `editingMesocycle?: MesocyclePlan | null`
- **Features**:
  - Mesocycle configuration (weeks, days, goals)
  - Muscle group specialization
  - Real-time volume tracking
  - Exercise library integration

#### 3. **WorkoutLogger.tsx**
- **Purpose**: Log workout sessions
- **Dependencies**: ExerciseLogger, WorkoutSummary, StorageService
- **Props**: `onWorkoutComplete?: (log: WorkoutLog) => void`
- **Features**:
  - Planned vs freestyle workouts
  - Session goal setting
  - Exercise logging
  - Workout completion

#### 4. **TemplateManager.tsx**
- **Purpose**: Manage mesocycle templates
- **Dependencies**: StorageService, utils
- **Props**:
  - `onSelectTemplate?: (template: MesocyclePlan) => void`
  - `onCreateNew?: () => void`
- **Features**:
  - Template browsing
  - Search and filter
  - Template duplication
  - Template deletion

#### 5. **WorkoutHistory.tsx**
- **Purpose**: View and analyze past workouts
- **Dependencies**: StorageService, utils
- **Props**: `selectedMesocycle?: string`
- **Features**:
  - Workout filtering
  - Exercise search
  - Volume statistics
  - Expandable workout details

### Sub-Components

#### 6. **ExerciseLibrary.tsx**
- **Purpose**: Manage exercise database
- **Dependencies**: StorageService, utils
- **Props**:
  - `onClose: () => void`
  - `onExerciseAdd: (exercise: Exercise) => void`
  - `existingExercises: Exercise[]`
- **Features**:
  - Exercise creation/editing
  - Search and filter
  - Muscle group tagging
  - Equipment specification

#### 7. **DayBuilder.tsx**
- **Purpose**: Build individual workout days with drag-and-drop
- **Dependencies**: @dnd-kit, utils
- **Props**:
  - `day: DayPlan`
  - `exercises: Exercise[]`
  - `onUpdate: (exerciseIds: string[]) => void`
  - `onExerciseLibraryOpen: () => void`
- **Features**:
  - Drag-and-drop exercise ordering
  - Exercise removal
  - Visual exercise cards

#### 8. **ExerciseLogger.tsx**
- **Purpose**: Log individual exercises during workouts
- **Dependencies**: StorageService, utils
- **Props**:
  - `exercise: Exercise`
  - `onUpdate: (sets: SetLog[]) => void`
  - `existingSets: SetLog[]`
  - `showPreviousData?: boolean`
  - `isAccessory?: boolean`
- **Features**:
  - Set-by-set logging
  - Previous workout data display
  - RIR/RPE or %1RM input
  - Volume calculation

#### 9. **WorkoutSummary.tsx**
- **Purpose**: Display workout completion summary
- **Dependencies**: utils
- **Props**:
  - `workout: WorkoutLog`
  - `exercises: Record<string, Exercise>`
  - `duration: string`
  - `onClose: () => void`
- **Features**:
  - Workout statistics
  - Muscle group volume breakdown
  - Personal records
  - Share functionality

#### 10. **Navigation.tsx**
- **Purpose**: Main navigation component
- **Dependencies**: None (UI only)
- **Props**:
  - `currentView: string`
  - `onViewChange: (view: string) => void`
- **Features**:
  - Responsive navigation
  - Mobile-friendly design
  - Active state management

## Data Layer

### StorageService.ts
- **Purpose**: Data persistence and retrieval
- **Methods**:
  - Mesocycle CRUD operations
  - Exercise CRUD operations
  - Workout log management
  - Session tracking
  - Data export/import
- **Easily replaceable**: All methods return Promises, ready for API integration

### Types/index.ts
- **Purpose**: TypeScript type definitions
- **Exports**:
  - `MuscleGroup` - Enum of muscle groups
  - `Exercise` - Exercise definition interface
  - `DayPlan` - Single day workout plan
  - `MesocyclePlan` - Complete mesocycle structure
  - `SetLog` - Individual set data
  - `LoggedExercise` - Exercise with logged sets
  - `WorkoutLog` - Complete workout session
  - `MuscleGroupVolume` - Volume tracking
  - `SessionSummary` - Workout summary data

### Utils.ts
- **Purpose**: Helper functions and calculations
- **Functions**:
  - `calculateMuscleGroupVolume()` - Volume calculations
  - `calculateWeeklyMuscleVolume()` - Weekly volume totals
  - `getMuscleGroupWarning()` - Volume warning logic
  - `getWarningColor()` - UI color helpers
  - `generateId()` - Unique ID generation
  - `formatMuscleGroupName()` - Display formatting
  - `validateMesocyclePlan()` - Form validation

## Integration Patterns

### 1. Standalone Usage
```typescript
// Use individual components independently
import { MesocyclePlanner } from './components/MesocyclePlanner';

function MyFitnessPage() {
  return (
    <MesocyclePlanner 
      onSave={(mesocycle) => saveMesocycle(mesocycle)}
    />
  );
}
```

### 2. Router Integration
```typescript
// Integrate with existing routing
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function FitnessRoutes() {
  return (
    <Routes>
      <Route path="/fitness" element={<Dashboard />} />
      <Route path="/fitness/planner" element={<MesocyclePlanner />} />
      <Route path="/fitness/workout" element={<WorkoutLogger />} />
      <Route path="/fitness/history" element={<WorkoutHistory />} />
    </Routes>
  );
}
```

### 3. State Management Integration
```typescript
// Integrate with Redux/Zustand/Context
function MesocyclePlannerContainer() {
  const { mesocycles, saveMesocycle } = useAppStore();
  
  return (
    <MesocyclePlanner 
      onSave={saveMesocycle}
      editingMesocycle={mesocycles.current}
    />
  );
}
```

### 4. API Integration
```typescript
// Replace StorageService with API calls
class ApiStorageService {
  static async saveMesocycle(mesocycle: MesocyclePlan) {
    return fetch('/api/mesocycles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mesocycle)
    });
  }
  // ... implement other methods
}
```

## Customization Points

### Styling
- All components use Tailwind CSS
- Easy to replace with CSS modules or styled-components
- Design tokens can be customized via Tailwind config

### Data Flow
- Components communicate via props and callbacks
- No global state dependencies
- Easy to integrate with existing state management

### Validation
- Form validation using Zod schemas
- Runtime type checking
- Extensible validation rules

### UI Components
- Built on Shadcn/ui foundation
- Accessible by default
- Customizable component library

This modular architecture ensures each component can be used independently or as part of the complete fitness tracking system.

