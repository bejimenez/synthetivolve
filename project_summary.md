# Synthetivolve: Complete Project Knowledge

## **Project Overview**

A highly personalized health and wellness application that provides data-driven insights and actionable recommendations through intelligent analysis of nutrition, fitness, and biometric data. The app focuses on dynamic adjustments based on actual user results rather than generic recommendations.

**Core Philosophy**: Track adherence vs effectiveness - if recommendations aren't being followed, don't adjust the targets; instead, encourage adherence before making changes.

## **Technical Stack**

- **Frontend**: Next.js 14+ with TypeScript and App Router
- **UI Components**: shadcn/ui
- **Backend**: Next.js API routes + Supabase
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Deployment**: Vercel
- **Monorepo**: Turborepo or Nx
- **Data Visualization**: Recharts
- **Additional Libraries**: date-fns, QuaggaJS (barcode scanning), Zod (validation)

## **Development Standards & Conventions**

```typescript
// Code style preferences
- Use TypeScript strict mode
- Prefer functional components and hooks
- Use Zod for schema validation
- Implement proper error boundaries
- Follow Next.js 14 App Router patterns
- Use server actions for form submissions
- Always include created_at and updated_at timestamps
- Use UUIDs for primary keys
- Implement soft deletes where appropriate (add deleted_at column)
- Add proper indexes for query performance
- Use RLS (Row Level Security) policies in Supabase
```

## **Key Business Rules**

### **Weight Loss Safety Rules**
- Minimum 1100 calories per day (non-negotiable safety floor)
- Maximum 2 lbs/week or 1.5% body weight/week loss rate
- Require 2+ weeks of data before making any adjustments
- Warning thresholds at >2 lbs/week or >1.5% body weight/week

### **Weight Gain Guidelines**
- 300-calorie surplus baseline recommendation
- Maximum recommended gain: 1 lb/week or 0.75% body weight/week
- Warning for faster gains (higher fat vs muscle ratio risk)
- No upper calorie limit but include warnings for excessive surplus

### **Macro Calculation Rules**
- **Protein**: 1g per lb body weight (non-negotiable for muscle maintenance)
- **Fat**: Minimum 50g per day (hormonal and organ function)
- **Carbs**: Fill remaining calories (fat can go higher as preferred)
- All macros must be dynamically adjusted based on changing body weight

### **Dynamic Adjustment Logic**
- Only adjust recommendations if adherence >85% for 2+ consecutive weeks
- Maximum 150 calorie adjustment per week (gradual changes)
- Never adjust if user isn't following current recommendations
- If adherence <75% and results are poor: maintain targets, encourage consistency
- If adherence >85% but results are slow: reduce calories by 50-150
- If results are too fast (>target rate): increase calories by 50-100

## **API Integration Details**

### **USDA FoodData Central API**
- API Key required: https://fdc.nal.usda.gov/api-guide.html
- Rate limits: 1000 requests/hour
- Prefer branded foods over generic when available
- Cache frequently used foods locally in Supabase
- Focus on foods with complete macro and micronutrient data

### **Garmin Integration**
- Uses GarminDB CLI for local data extraction
- ETL pipeline: GarminDB SQLite → Processing → Supabase
- Sync frequency: Daily minimum, hourly preferred for active data
- Key metrics: HR, HRV, sleep, stress, VO2 max, training load
- Handle data gaps gracefully (device not worn, sync failures)
- Store both raw data points and hourly aggregations

## **UX/UI Design Guidelines**

### **Dashboard Design Principles**
- Most important info "above the fold" (weight entry, today's targets, goal progress)
- Quick actions accessible without scrolling
- Use progressive disclosure for complex features
- Prioritize mobile-first design
- Loading states for all async operations
- Maximum 3-second load time for dashboard

### **Color Coding Standards**
- **Green**: On track/good progress/healthy ranges
- **Yellow**: Warning/attention needed/approaching limits
- **Red**: Problem/intervention required/safety concerns
- **Blue**: Information/neutral/reference data

### **Form Design Standards**
- Minimize required fields (only essential data)
- Use smart defaults where possible
- Provide immediate validation feedback
- Auto-save functionality for longer forms
- Clear error messages with actionable guidance

## **Database Schema Principles**

### **Core Tables Structure**
```sql
-- Always include these fields
id uuid primary key default gen_random_uuid(),
user_id uuid references profiles(id) on delete cascade,
created_at timestamp default now(),
updated_at timestamp default now()

-- Add soft delete capability where appropriate
deleted_at timestamp null
```

### **Key Relationships**
- All user data must be properly associated with profiles table
- Use cascading deletes appropriately
- Implement proper foreign key constraints
- Add indexes for frequently queried columns (user_id, dates, status fields)

## **Complete Implementation Plan**

### **Phase 1: Foundation & Core Features (6-8 weeks)**

#### **Week 1-2: Infrastructure Setup**
**Deliverables:**
- Monorepo structure with Next.js + TypeScript
- Supabase project configuration
- Authentication system (sign up, sign in, password reset)
- Basic dashboard layout with shadcn/ui
- User settings management system

**Database Schema (Initial):**
```sql
-- Users table (extended from Supabase auth)
profiles (
  id uuid references auth.users,
  height_inches integer,
  biological_sex text check (biological_sex in ('male', 'female')),
  birth_date date,
  activity_level text check (activity_level in ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
  created_at timestamp,
  updated_at timestamp
)

-- Weight tracking
weight_entries (
  id uuid primary key,
  user_id uuid references profiles(id),
  weight_lbs decimal(5,2),
  entry_date date,
  notes text,
  created_at timestamp
)
```

**Features:**
- User registration and authentication
- Settings widget for profile information (height, biological sex, birth date, activity level)
- Basic dashboard shell with responsive design

#### **Week 3-4: Daily Weight Logging**
**Deliverables:**
- Weight entry widget on dashboard
- Weight history visualization with 7-day rolling average
- Data validation and error handling

**Features:**
- Quick weight entry (today's date auto-selected)
- Historical weight chart with trendline
- 7-day rolling average calculation and display
- Edit/delete previous entries
- Basic analytics (total change, rate of change)

#### **Week 5-6: Calorie Calculator**
**Database Schema Update:**
```sql
-- Calorie calculations
calorie_calculations (
  id uuid primary key,
  user_id uuid references profiles(id),
  bmr decimal(7,2),
  tdee decimal(7,2),
  activity_multiplier decimal(3,2),
  calculation_date date,
  created_at timestamp
)
```

**Features:**
- TDEE calculation using Mifflin-St Jeor equation
- Activity level multipliers
- Macro calculation based on specified formula:
  - Protein: 1g per lb body weight
  - Fat: minimum 50g per day
  - Carbs: remaining calories after protein and fat
- Display recommended daily calories and macro breakdown
- Calculator widget on dashboard

#### **Week 7-8: Goals & Progress Tracking**
**Database Schema Update:**
```sql
-- Goals system
goals (
  id uuid primary key,
  user_id uuid references profiles(id),
  goal_type text check (goal_type in ('lose', 'gain', 'maintain')),
  start_weight decimal(5,2),
  target_rate_lbs decimal(4,2), -- pounds per week
  target_rate_percent decimal(5,2), -- percentage of body weight per week
  rate_type text check (rate_type in ('absolute', 'percentage')),
  duration_weeks integer check (duration_weeks between 4 and 12),
  start_date date,
  end_date date,
  is_active boolean default true,
  created_at timestamp,
  updated_at timestamp
)
```

**Features:**
- Goal creation interface with validation
- Progress tracking dashboard widget
- Visual progress indicators (progress bars, trajectory charts)
- Safety validations (1100 calorie floor, maximum deficit warnings)
- Goal timeline and remaining days display
- Expected vs actual progress comparison

### **Phase 2: Dynamic Calorie Adjustment (3-4 weeks)**

#### **Week 1-2: Adherence Tracking Foundation**
**Database Schema Update:**
```sql
-- Daily targets and adherence
daily_targets (
  id uuid primary key,
  user_id uuid references profiles(id),
  target_date date,
  goal_id uuid references goals(id),
  recommended_calories decimal(7,2),
  recommended_protein decimal(6,2),
  recommended_fat decimal(6,2),
  recommended_carbs decimal(6,2),
  created_at timestamp
)

-- Progress analysis
progress_analysis (
  id uuid primary key,
  user_id uuid references profiles(id),
  analysis_date date,
  weeks_analyzed integer,
  average_weight_change decimal(5,2),
  expected_weight_change decimal(5,2),
  adherence_score decimal(4,2), -- percentage (placeholder for future nutrition logging)
  recommendation_adjustment decimal(6,2),
  adjustment_reason text,
  created_at timestamp
)
```

**Features:**
- Daily calorie target generation based on goals
- Weekly progress analysis automation
- Expected vs actual weight change calculations

#### **Week 3-4: Intelligent Adjustment Logic**
**Features:**
- Dynamic calorie adjustment algorithm:
  - If adherence is good (>85%) and results are slow: reduce calories
  - If adherence is poor (<75%) and results are slow: maintain calories, encourage adherence
  - If results are too fast: increase calories gradually
- Adjustment history tracking and reasoning
- Safety bounds enforcement (1100 calorie floor, maximum adjustments per week)
- Progress velocity calculations and warnings
- Dashboard notifications for recommended adjustments

**Algorithm Logic:**
```typescript
// Pseudocode for adjustment logic
if (adherence >= 85%) {
  if (actualRate < targetRate * 0.7) {
    // Results too slow, reduce calories
    adjustment = -50 to -150 calories
  } else if (actualRate > targetRate * 1.3) {
    // Results too fast, increase calories
    adjustment = +50 to +100 calories
  }
} else {
  // Poor adherence, encourage consistency first
  adjustment = 0
  message = "Focus on adherence before adjusting targets"
}
```

### **Phase 3: Enhanced Nutrition System (5-6 weeks)**

#### **Week 1-2: Food Database & Basic Logging**
**Database Schema Update:**
```sql
-- Food database
foods (
  id uuid primary key,
  fdc_id integer unique, -- USDA FoodData Central ID
  description text,
  brand_name text,
  serving_size decimal(8,2),
  serving_unit text,
  calories_per_100g decimal(7,2),
  protein_per_100g decimal(6,2),
  fat_per_100g decimal(6,2),
  carbs_per_100g decimal(6,2),
  fiber_per_100g decimal(6,2),
  sugar_per_100g decimal(6,2),
  sodium_per_100g decimal(8,2),
  created_at timestamp
)

-- Food logging
food_logs (
  id uuid primary key,
  user_id uuid references profiles(id),
  food_id uuid references foods(id),
  quantity decimal(8,2),
  unit text,
  meal_type text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  logged_date date,
  logged_at timestamp,
  created_at timestamp
)
```

**Features:**
- USDA FoodData Central API integration
- Food search and selection interface
- Manual food entry and logging
- Basic nutrition dashboard (daily totals vs targets)
- Meal categorization

#### **Week 3-4: Barcode Scanning & Enhanced Logging**
**Features:**
- Barcode scanning with QuaggaJS
- Quick-add favorite foods
- Copy meals from previous days
- Nutrition timeline visualization
- Macro ratio tracking and visualization

#### **Week 5-6: Adherence Calculation Integration**
**Features:**
- Actual adherence calculation based on logged nutrition
- Integration with dynamic calorie adjustment system
- Nutrition-based progress analysis
- Enhanced dashboard with adherence metrics

### **Phase 4: Smart Nutrition Features (3-4 weeks)**

#### **Week 1-2: Pantry System**
**Database Schema Update:**
```sql
-- Pantry management
pantry_items (
  id uuid primary key,
  user_id uuid references profiles(id),
  food_id uuid references foods(id),
  quantity decimal(8,2),
  unit text,
  expiration_date date,
  location text check (location in ('pantry', 'fridge', 'freezer')),
  added_date date,
  updated_at timestamp
)
```

**Features:**
- Pantry inventory management
- Expiration date tracking
- Quick pantry updates after meal logging

#### **Week 3-4: Meal Recommendation Engine**
**Features:**
- Smart meal suggestions based on:
  - Remaining daily macros
  - Pantry availability
  - Micronutrient optimization
  - Realistic portion sizes
- "Already used this" feedback system
- Meal combination suggestions for optimal nutrition
- Integration with pantry depletion tracking

### **Phase 5: Fitness Foundation (4-5 weeks)**

#### **Week 1-2: Exercise Database & 1RM Tracking**
**Database Schema Update:**
```sql
-- Exercise database
exercises (
  id uuid primary key,
  name text unique,
  category text, -- compound, isolation
  primary_muscles text[],
  secondary_muscles text[],
  equipment text[],
  instructions text,
  created_at timestamp
)

-- One rep max tracking
one_rep_maxes (
  id uuid primary key,
  user_id uuid references profiles(id),
  exercise_id uuid references exercises(id),
  weight_lbs decimal(6,2),
  test_date date,
  estimation_method text, -- actual, calculated
  formula_used text, -- epley, brzycki, etc
  created_at timestamp
)
```

**Features:**
- Curated exercise database (focus on compound movements + common accessories)
- 1RM tracking and estimation using multiple formulas
- Exercise categorization (compound vs isolation)
- Percentage calculator for programming

#### **Week 3-4: Mesocycle Planning Interface**
**Database Schema Update:**
```sql
-- Mesocycle plans
mesocycles (
  id uuid primary key,
  user_id uuid references profiles(id),
  name text,
  duration_weeks integer,
  start_date date,
  is_active boolean default false,
  created_at timestamp
)

-- Training days
training_days (
  id uuid primary key,
  mesocycle_id uuid references mesocycles(id),
  day_number integer,
  day_name text, -- optional custom name
  notes text
)

-- Planned exercises
planned_exercises (
  id uuid primary key,
  training_day_id uuid references training_days(id),
  exercise_id uuid references exercises(id),
  sets integer,
  reps text, -- can be range like "8-12"
  weight_type text check (weight_type in ('percentage', 'rpe', 'absolute')),
  weight_value decimal(6,2),
  rpe_target decimal(3,1), -- 1.0 to 10.0
  rir_target integer, -- 0 to 5+
  session_type text check (session_type in ('morning', 'evening', 'single')),
  exercise_order integer,
  notes text
)
```

**Features:**
- Drag-and-drop mesocycle planning interface
- Support for both morning/evening sessions
- Volume tracking per muscle group
- RPE/RIR and percentage-based programming
- Flexible day numbering system

#### **Week 5: Volume Analysis & Auto-Regulation**
**Features:**
- Weekly volume calculations per muscle group
- Volume progression tracking
- Basic auto-regulation suggestions
- Training load calculations

### **Phase 6: Advanced Fitness & Subjective Metrics (3-4 weeks)**

#### **Week 1-2: Workout Logging System**
**Database Schema Update:**
```sql
-- Completed workouts
completed_workouts (
  id uuid primary key,
  user_id uuid references profiles(id),
  training_day_id uuid references training_days(id),
  workout_date date,
  session_type text,
  duration_minutes integer,
  overall_rpe decimal(3,1),
  notes text,
  created_at timestamp
)

-- Exercise performance
exercise_performance (
  id uuid primary key,
  completed_workout_id uuid references completed_workouts(id),
  exercise_id uuid references exercises(id),
  set_number integer,
  reps integer,
  weight_lbs decimal(6,2),
  rpe decimal(3,1),
  rir integer,
  notes text
)

-- Subjective metrics
subjective_metrics (
  id uuid primary key,
  user_id uuid references profiles(id),
  metric_date date,
  energy_level integer check (energy_level between 1 and 10),
  motivation integer check (motivation between 1 and 10),
  soreness_level integer check (soreness_level between 1 and 10),
  sleep_quality integer check (sleep_quality between 1 and 10),
  stress_level integer check (stress_level between 1 and 10),
  mood integer check (mood between 1 and 10),
  created_at timestamp
)
```

**Features:**
- Workout execution interface with timer
- Set-by-set logging with RPE/RIR tracking
- Subjective metrics collection (quick slider interface)
- Performance vs planned comparison

#### **Week 3-4: Advanced Analytics**
**Features:**
- Correlation analysis between subjective metrics and performance
- Training load progression tracking
- Recovery recommendations based on patterns
- Auto-regulation suggestions based on RPE trends

### **Phase 7: Biometrics Integration & Advanced Analytics (4-5 weeks)**

#### **Week 1-2: Garmin Data Pipeline**
**Database Schema Update:**
```sql
-- Biometric data
biometric_data (
  id uuid primary key,
  user_id uuid references profiles(id),
  metric_type text, -- hr, hrv, sleep_score, stress, etc
  value decimal(10,2),
  unit text,
  timestamp timestamp,
  date date,
  source text default 'garmin',
  created_at timestamp
)

-- Sleep data
sleep_data (
  id uuid primary key,
  user_id uuid references profiles(id),
  sleep_date date,
  bedtime timestamp,
  wake_time timestamp,
  total_sleep_minutes integer,
  deep_sleep_minutes integer,
  light_sleep_minutes integer,
  rem_sleep_minutes integer,
  awake_minutes integer,
  sleep_score integer,
  created_at timestamp
)
```

**Features:**
- ETL pipeline for GarminDB → Supabase
- Automated data sync scheduling
- Biometric data visualization
- Sleep quality tracking and analysis

#### **Week 3-4: Correlation Analysis Engine**
**Features:**
- Complex query support for research questions:
  - Training style vs weight loss correlation
  - Menstrual cycle vs performance patterns
  - Meal timing vs sleep quality analysis
- Statistical analysis and confidence intervals
- Automated insight generation
- Pattern recognition for personalized recommendations

#### **Week 5: Advanced Reporting**
**Features:**
- Comprehensive progress reports
- Export capabilities
- Long-term trend analysis
- Goal achievement analytics

### **Phase 8: Periodization Templates & Polish (2-3 weeks)**

#### **Optional: Periodization Templates**
**Database Schema Update:**
```sql
-- Program templates
program_templates (
  id uuid primary key,
  name text,
  description text,
  periodization_type text, -- linear, block, undulating
  duration_weeks integer,
  experience_level text,
  goal_focus text, -- strength, hypertrophy, power
  is_public boolean default false,
  created_by uuid references profiles(id),
  created_at timestamp
)
```

**Features:**
- Pre-built periodization templates
- Template customization and adaptation
- Community template sharing (if desired)

#### **Final Polish**
- Performance optimization
- Mobile responsiveness refinement
- Advanced error handling and user feedback
- Documentation and testing
- Data export/backup capabilities

## **Testing Strategy**

### **Priority Testing Areas**
1. **Calorie calculation accuracy** - Verify TDEE formulas and macro distributions
2. **Dynamic adjustment logic** - Test all adherence/results scenarios
3. **Goal progress calculations** - Ensure accurate tracking and projections
4. **Data integrity** - Especially weight trends and rolling averages
5. **API integration error handling** - USDA API failures, rate limits

### **Test Data Scenarios**
- Consistent weight loss following recommendations
- Weight plateaus with good adherence
- Inconsistent logging patterns
- Edge cases (very low/high weights, rapid changes)
- API failures and network issues

## **Performance Optimization Guidelines**

### **Critical Performance Areas**
- **Dashboard load time**: <2 seconds target
- **Chart rendering**: Optimize for datasets with 365+ data points
- **Mobile responsiveness**: Smooth interactions on slower devices
- **Database queries**: Use proper indexing and query optimization
- **Image optimization**: Food photos and profile pictures

### **Optimization Strategies**
- Implement proper caching for frequently accessed data
- Use React.memo for expensive components
- Lazy load non-critical dashboard widgets
- Optimize database queries with proper indexes
- Use Vercel's image optimization features

## **Security Considerations**

### **Data Privacy Requirements**
- All health data stays within user's Supabase instance
- No sharing of personal metrics without explicit consent
- Implement proper session management
- Use HTTPS everywhere
- Regular security updates for dependencies
- Proper input validation and sanitization

### **Authentication & Authorization**
- Implement Row Level Security (RLS) in Supabase
- Secure API endpoints with proper authorization
- Handle password resets securely
- Implement proper session timeout

## **Common Pitfalls to Avoid**

### **Development Pitfalls**
- Don't over-engineer early phases - start simple and iterate
- Avoid premature optimization - focus on functionality first
- Keep mobile experience in mind from day 1
- Plan for data migration between schema changes
- Don't assume linear progress in weight/fitness data
- Handle edge cases gracefully (missing data, API failures)

### **UX Pitfalls**
- Too many required fields in forms (minimize friction)
- Complex navigation structures (keep it simple)
- Overwhelming users with too much data at once
- Not handling offline scenarios gracefully
- Poor error messages that don't guide user action

### **Business Logic Pitfalls**
- Making adjustments too quickly (need 2+ weeks of data)
- Ignoring adherence when making recommendations
- Not accounting for natural weight fluctuations
- Over-complicating the meal recommendation algorithm

## **Future Expansion Considerations**

### **Potential Integrations**
- **MyFitnessPal API** for expanded food database
- **Fitbit/Apple Health** for additional biometrics
- **Cronometer API** for micronutrient data
- **Whoop/Oura** for recovery metrics
- **Strava** for additional activity data

### **Advanced Features**
- **AI-powered meal planning** based on preferences and goals
- **Custom coaching integration** for premium users
- **Social features** for accountability and motivation
- **Advanced biomarker tracking** (blood work integration)

### **Monetization Possibilities**
- Premium features (advanced analytics, unlimited goals)
- Coaching integration and referral programs
- Meal planning and grocery delivery services
- Custom program templates and expert content

## **Success Metrics & Validation**

### **Phase 1-2 Validation**
- Successfully track weight and see meaningful trends
- Accurate calorie calculations and goal progress
- Dynamic adjustments working as intended
- User can complete full goal setup and tracking cycle

### **Phase 3-4 Validation**
- Nutrition logging improves adherence calculations significantly
- Meal recommendations are practical and helpful
- Pantry system reduces food waste and planning friction
- Users consistently log meals with minimal friction

### **Phase 5-6 Validation**
- Mesocycle planning is intuitive and comprehensive
- Workout logging captures necessary data efficiently
- Subjective metrics reveal meaningful patterns
- Users can plan and execute complete training programs

### **Phase 7+ Validation**
- Biometric integration provides actionable insights
- Complex queries yield useful personal discoveries
- Overall system helps achieve health and fitness goals
- Data correlations lead to meaningful behavior changes

## **Example Complex Queries the System Should Support**

1. **Training Style Analysis**: "Do I have better weight loss results with high rep/low weight or low rep/high weight training styles?"

2. **Hormonal Cycle Correlation**: "Is there a point in my menstrual cycle where I perform better in the gym? Or have weight stagnation due to water retention?"

3. **Meal Timing Impact**: "How close to bedtime can I eat before my sleep quality starts being negatively affected?"

4. **Recovery Pattern Analysis**: "What combination of sleep quality, HRV, and subjective energy best predicts my workout performance?"

5. **Macro Sensitivity**: "At what carbohydrate intake level do I start experiencing significant water retention?"

This comprehensive project knowledge document should provide complete guidance for developing the Health & Wellness Engine application from foundation through advanced features.
