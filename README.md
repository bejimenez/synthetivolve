# Synthetivolve

> **Your Personal Health & Wellness Engine**

A highly personalized health and wellness application that provides data-driven insights and actionable recommendations through intelligent analysis of nutrition, fitness, and biometric data. Unlike generic fitness apps, Synthetivolve focuses on dynamic adjustments based on actual user results rather than one-size-fits-all recommendations.

## 🎯 Core Philosophy

**Track adherence vs effectiveness** - If recommendations aren't being followed, don't adjust the targets; instead, encourage adherence before making changes. This approach ensures sustainable progress and prevents frustration from unrealistic expectations.

## 🚀 Features

### Phase 1: Foundation & Core Features ✅
- **User Authentication & Profiles** - Secure authentication with Supabase Auth
- **Daily Weight Tracking** - Smart weight logging with 7-day rolling averages
- **Intelligent Calorie Calculator** - TDEE calculations using Mifflin-St Jeor equation
- **Dynamic Goals System** - Personalized weight loss/gain targets with safety guidelines
- **Progress Analytics** - Visual progress tracking with trend analysis

### Phase 2: Advanced Weight Management ✅
- **Safety-First Approach** - Built-in safety rules (minimum 1100 calories, maximum 2 lbs/week loss)
- **Dynamic Adjustments** - Automatic calorie adjustments based on adherence and results
- **Macro Calculations** - Personalized protein (1g/lb), fat (50g minimum), and carb targets
- **Progress Predictions** - Goal timeline estimates based on current trends

### Phase 3: Nutrition System 🚧
- **USDA Food Database Integration** - Comprehensive nutrition data
- **Barcode Scanning** - Quick food logging with QuaggaJS
- **Meal Planning** - Smart meal recommendations based on targets
- **Pantry Management** - Track ingredients and reduce food waste

### Phase 4: Advanced Fitness Tracking 🔄
- **Mesocycle Planning** - Structured training program design
- **Workout Logging** - Set-by-set tracking with RPE/RIR
- **Volume Analytics** - Training load and recovery metrics
- **Subjective Metrics** - Energy, motivation, and recovery tracking

### Phase 5: Biometric Integration 📋
- **Garmin Integration** - Heart rate, HRV, sleep, and stress data
- **Correlation Analysis** - Discover personal patterns and insights
- **Advanced Reporting** - Comprehensive health and fitness reports

## 🛠️ Technical Stack

### Frontend
- **Next.js 15.3.4** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS 4** - Utility-first CSS framework
- **shadcn/ui** - Modern, accessible UI components
- **Recharts** - Data visualization library

### Backend
- **Next.js API Routes** - Server-side API endpoints
- **Supabase** - PostgreSQL database with real-time capabilities
- **Supabase Auth** - Authentication and authorization
- **Row Level Security (RLS)** - Database-level security policies

### Key Libraries
- **React Hook Form** - Form management with validation
- **Zod** - Schema validation
- **date-fns** - Date manipulation utilities
- **Lucide React** - Icon library
- **QuaggaJS** - Barcode scanning (planned)

## 🏗️ Architecture

### Database Design Principles
- **UUIDs** for primary keys
- **Soft deletes** where appropriate (deleted_at column)
- **Proper indexing** for query performance
- **Cascading relationships** for data integrity
- **Timestamps** (created_at, updated_at) on all tables

### Development Standards
```typescript
// Type-safe development
- TypeScript strict mode enabled
- Zod schema validation
- Proper error boundaries
- Server actions for form submissions
- Functional components with hooks
```

## 🎨 Design Guidelines

### Color Coding Standards
- **🟢 Green**: On track / Good progress / Healthy ranges
- **🟡 Yellow**: Warning / Attention needed / Approaching limits
- **🔴 Red**: Problem / Intervention required / Safety concerns
- **🔵 Blue**: Information / Neutral / Reference data

### Mobile-First Design
- Progressive disclosure for complex features
- Touch-friendly interfaces
- Responsive layouts
- Quick actions above the fold

## 📊 Key Business Rules

### Weight Loss Safety
- **Minimum 1100 calories/day** (non-negotiable safety floor)
- **Maximum 2 lbs/week** or 1.5% body weight/week loss rate
- **2+ weeks of data** required before adjustments
- Warning thresholds for rapid weight loss

### Weight Gain Guidelines
- **300-calorie surplus** baseline recommendation
- **Maximum 1 lb/week** or 0.75% body weight/week gain
- Warnings for excessive surplus (higher fat vs muscle ratio risk)

### Dynamic Adjustment Logic
```typescript
// Adjustment criteria
if (adherence >= 85% && dataPoints >= 14) {
  if (actualRate < targetRate * 0.7) {
    // Results too slow, reduce calories by 50-150
  } else if (actualRate > targetRate * 1.3) {
    // Results too fast, increase calories by 50-100
  }
} else {
  // Poor adherence: maintain targets, encourage consistency
}
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18.18.0 or later
- npm, yarn, or pnpm
- Supabase account (for database)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/synthetivolve.git
   cd synthetivolve
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Configure your `.env.local` with:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Database Setup

1. **Create a new Supabase project**
2. **Run the database migrations** (SQL files in `/database` directory)
3. **Enable Row Level Security** policies
4. **Configure authentication** settings

## 🧪 Testing Strategy

### Priority Testing Areas
1. **Calorie calculation accuracy** - Verify TDEE formulas and macro distributions
2. **Dynamic adjustment logic** - Test adherence/results scenarios
3. **Goal progress calculations** - Ensure accurate tracking and projections
4. **Data integrity** - Weight trends and rolling averages
5. **Mobile responsiveness** - Cross-device compatibility

### Test Breakpoints
- ✅ User can register and set up profile
- ✅ Weight entry and visualization works correctly
- ✅ Calorie calculations are accurate
- ✅ Goal progress tracking functions properly
- 🔄 Food logging integrates with targets
- 📋 Workout tracking captures necessary data

## 🔮 Future Integrations

### Planned APIs
- **USDA FoodData Central** - Comprehensive nutrition database
- **MyFitnessPal API** - Expanded food database
- **Garmin Connect IQ** - Biometric and activity data
- **Apple Health / Google Fit** - Cross-platform health data

### Advanced Features
- **AI-powered meal planning** based on preferences and goals
- **Pantry** to add your current food items for optimized meal recommendations - no extraneous trips to the store!
- **Custom coaching integration** for premium users
- **Social features** for accountability and motivation
- **Advanced biomarker tracking** (HR and sleep tracking integration)

## 📈 Success Metrics

### Phase 1-2 Validation
- ✅ Users can track weight and see meaningful trends
- ✅ Accurate calorie calculations and goal progress
- ✅ Dynamic adjustments working as intended
- ✅ Complete goal setup and tracking cycle

### Phase 3-4 Validation
- 🔄 Nutrition logging improves adherence calculations
- 📋 Meal recommendations are practical and helpful
- 📋 Users consistently log meals with minimal friction

## 🛡️ Security & Privacy

- **Row Level Security** - Database-level data protection
- **Secure Authentication** - Supabase Auth with proper session management
- **Data Encryption** - All sensitive data encrypted at rest
- **Privacy First** - No data sharing without explicit consent

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Follow the development standards** (TypeScript, ESLint, Prettier)
4. **Write tests** for new functionality
5. **Commit your changes** (`git commit -m 'Add amazing feature'`)
6. **Push to the branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Development Guidelines
- Keep functions to ~60 lines maximum
- Prefer modularity over monolithic scripts
- Include proper error handling
- Write self-documenting code
- Test features at each breakpoint

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

**Built with ❤️ for health and wellness enthusiasts**
