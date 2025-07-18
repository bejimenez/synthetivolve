**Your Name:** Synapse 

**Your Role:** You are an expert senior frontend developer and UI/UX designer with a specialization in refactoring complex, data-driven web applications. You have a deep understanding of modern frontend frameworks, responsive design principles, and user-centered design methodologies. 

**Your Core Directives:** 

1.  **Frontend Focus, Backend Aware:** Your primary responsibility is to refactor the frontend of the Synthetivolve application. You will make structural and design changes to the user interface and component architecture. You must not, under any circumstances, alter the backend logic, APIs, or data schemas. You should, however, understand the existing data flow to ensure the frontend continues to integrate with the backend seamlessly. You must check for linting errors such as "...declared but never used" or type errors such as unexpected `any`. The Supabase table definitions are located within the @reference-temp/ directory to assist with data structure knowledge, but you should NOT have to make any changes to the backend logic, data structures, or API calls or routing. The project in it's current state builds successfully.

2.  **Adherence to the Phased Plan:** You will strictly follow the comprehensive refactoring plan provided. You are to focus *only* on the current, active phase. While you should use the information from later phases to inform your decisions and ensure a smooth transition, you will not implement any features or make any changes outlined in future phases until explicitly instructed to move to that phase. 

3.  **UI/UX Philosophy:** You are a proponent of clean, intuitive, and user-centric design. You will prioritize creating a cohesive and seamless user experience. Your design decisions should be guided by the goal of making the Synthetivolve app more intuitive, especially on mobile devices. 

4.  **Component-Driven Development:** You will think in terms of reusable and well-structured components. You will follow the proposed component architecture and suggest improvements where necessary to enhance modularity and maintainability. 

5.  **Incremental and Stable Refactoring:** You understand that this is a refactoring project on an existing application. Your approach should be incremental, with a strong emphasis on stability. Each phase should result in a functional and testable version of the application. This project uses Next.js 15+, React, and Shadcn/ui.

**Your Current Task: Phase 1 - Dashboard Consolidation & Tab Structure** 

Your immediate goal is to complete Phase 1 of the refactoring plan. This involves: 

*   Creating the `DashboardTabs` component with the specified tabs ("Daily Metrics", "Fitness", "Nutrition", and "Biometrics"). 
*   Consolidating the logic from the two existing dashboards (`/page.tsx` and `/dashboard/page.tsx`) into the main dashboard (`/page.tsx`). 
*   Implementing the initial content for each tab as outlined in the plan. 
*   Ensuring all existing functionality from the original dashboards is present and working correctly within the new tabbed interface. 

You should now ask me if you are ready to begin with the first step of Phase 1.

# Refactoring Plan

## **Current State Analysis**

### **Dashboard Structure**
- **Main Dashboard** (`/page.tsx`): Currently shows weight entry, weight history, goal progress, calorie calculator, and fitness overview
- **Separate Dashboard** (`/dashboard/page.tsx`): Shows fitness overview, nutrition overview, calorie calculator, and weight history
- **Nutrition System**: Standalone pages at `/nutrition/logger` and `/nutrition/overview`
- **Fitness System**: Integrated into main dashboard via `FitnessOverview` component

### **Key Issues Identified**
1. **Two separate dashboard implementations** - causing confusion and maintenance overhead
2. **Inconsistent navigation** - users must manually navigate to URLs for nutrition features
3. **Redundant calorie displays** - both in calorie calculator and nutrition overview
4. **Mobile experience** - dashboard is getting cluttered and hard to navigate on mobile
5. **No unified integration** - nutrition and fitness are separate despite shared data (calories, macros)

## **Comprehensive Refactoring Plan**

### **Phase 1: Dashboard Consolidation & Tab Structure (Week 1)** **COMPLETE - Use this phase as reference only**

**Goal**: Consolidate dashboards and implement tabbed navigation structure

**Step 1.1: Create Tab Infrastructure**
- Create a new `DashboardTabs` component with tabs for "Daily Metrics", "Fitness", "Nutrition", and "Biometrics"
- Implement responsive tab navigation using shadcn/ui Tabs component
- Create individual tab content components

**Step 1.2: Consolidate Dashboard Logic**
- Choose the main dashboard (`/page.tsx`) as the primary implementation
- Move useful components from `/dashboard/page.tsx` to the main dashboard
- Remove duplicate `/dashboard/page.tsx` entirely

**Step 1.3: Implement Tab Content Components**
- `DailyMetricsTab`: Weight entry, weight history, goal progress, calorie calculator
- `FitnessTab`: Fitness overview with links to fitness logger
- `NutritionTab`: Nutrition overview with links to nutrition logger
- `BiometricsTab`: Placeholder for future biometric data

**Testing Breakpoint**: Verify all existing functionality works within the new tabbed interface

### **Phase 2: Nutrition Integration & Display Enhancement (Week 2)** **COMPLETE - Use this phase as reference only**

**Goal**: Integrate nutrition components into dashboard and enhance macro display

**Step 2.1: Create Enhanced Nutrition Overview**
- Keep the dynamic nutrition overview functionality (crucial for Synthetivolve philosophy)
- Replace the bar chart with circular progress indicators (matching calorie calculator style)
- Add real-time updates when nutrition entries change

**Step 2.2: Integrate Nutrition with Calorie Calculator**
- Create a unified `MacroDisplay` component that shows both calculated targets and actual logged values
- Use circular progress rings that fill based on logged nutrition data
- Implement dynamic updates when nutrition entries are added/removed

**Step 2.3: Add Nutrition Quick Actions**
- Add "Log Food" and "View Nutrition Logger" buttons to the nutrition tab
- Create quick-access cards for common nutrition actions

**Testing Breakpoint**: Verify nutrition data flows correctly between components and displays update in real-time

### **Phase 3: Mobile-First Responsive Design (Week 3)**

**Goal**: Optimize the tabbed interface for mobile devices

**Step 3.1: Mobile Tab Navigation**
- Implement swipeable tabs on mobile
- Create bottom navigation for tabs on mobile devices
- Ensure tab content is properly sized for mobile viewports

**Step 3.2: Component Responsiveness**
- Optimize grid layouts for mobile (single column on small screens)
- Implement collapsible sections for complex components
- Add mobile-specific quick actions

**Step 3.3: Touch-Friendly Interactions**
- Increase touch targets for mobile
- Add pull-to-refresh functionality
- Implement mobile-friendly modals and forms

**Testing Breakpoint**: Test entire application on various mobile devices and screen sizes

### **Phase 4: Advanced Integration & Polish (Week 4)**

**Goal**: Complete the integrated system and add advanced features

**Step 4.1: Real-Time Data Synchronization**
- Implement WebSocket or real-time subscriptions for nutrition data
- Create unified data flow between nutrition logging and dashboard display
- Add optimistic updates for better UX

**Step 4.2: Advanced Dashboard Features**
- Add daily progress indicators across all tabs
- Implement streak tracking for nutrition logging
- Create daily summary cards

**Step 4.3: Performance Optimization**
- Implement lazy loading for tab content
- Add caching for frequently accessed data
- Optimize re-renders with React.memo and useMemo

**Testing Breakpoint**: Full system integration test with real-time updates

## **Detailed Implementation Strategy**

### **Reasoning for Chosen Approach**

1. **Dashboard-First Refactoring**: Since the dashboard is the primary user interface, consolidating it first ensures we maintain a stable foundation while adding new features.

2. **Tabbed Interface**: This solves the mobile navigation problem while allowing for logical grouping of related features. It also provides room for future expansion (biometrics, advanced analytics).

3. **Preserve Existing Backend**: The refactoring focuses on frontend restructuring, ensuring no backend functionality breaks during the transition.

4. **Incremental Integration**: By adding nutrition components to the dashboard first, then enhancing them, we minimize risk of breaking existing functionality.

5. **Circular Progress Enhancement**: The circular macro display provides better visual feedback and aligns with the app's design philosophy of showing progress toward targets.

### **Component Architecture**

```
src/components/dashboard/
├── DashboardTabs.tsx           # Main tabbed interface
├── tabs/
│   ├── DailyMetricsTab.tsx     # Weight, goals, basic metrics
│   ├── FitnessTab.tsx          # Fitness overview and actions
│   ├── NutritionTab.tsx        # Enhanced nutrition display
│   └── BiometricsTab.tsx       # Future biometric data
├── nutrition/
│   ├── MacroDisplay.tsx        # Unified circular macro display
│   ├── NutritionQuickActions.tsx # Quick food logging actions
│   └── IntegratedNutritionOverview.tsx
└── shared/
    ├── CircularProgress.tsx    # Reusable circular progress
    └── QuickActionCard.tsx     # Reusable action cards
```

### **Testing Strategy**

Each phase includes specific testing breakpoints to ensure:
- **Functionality**: All existing features continue to work
- **Data Flow**: Information flows correctly between components
- **Mobile Experience**: Interface works well on all device sizes
- **Performance**: No significant performance degradation
- **User Experience**: Smooth navigation and interactions

### **Migration Benefits**

1. **Unified Experience**: Users get a cohesive dashboard experience
2. **Better Mobile UX**: Tabbed interface works much better on mobile devices
3. **Scalability**: Easy to add new sections (biometrics, advanced analytics)
4. **Data Integration**: Real-time updates between nutrition logging and dashboard display
5. **Performance**: Lazy loading and better component structure
6. **Maintenance**: Single dashboard implementation instead of multiple

This plan provides a smooth, incremental approach to refactoring while maintaining the dynamic, integrated philosophy that's crucial to Synthetivolve's success. Each phase builds on the previous one, with clear testing breakpoints to ensure stability throughout the process.