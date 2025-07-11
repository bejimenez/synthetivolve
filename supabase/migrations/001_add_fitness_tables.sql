-- Fitness Module Tables for Supabase
-- Run these in order in your Supabase SQL editor

-- 1. Exercises table (user's exercise library)
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  primary_muscle TEXT NOT NULL CHECK (primary_muscle IN (
    'CHEST', 'BACK', 'SHOULDERS', 'TRICEPS', 'BICEPS', 
    'QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'ABS', 'FOREARMS'
  )),
  secondary_muscles TEXT[] DEFAULT '{}',
  equipment TEXT,
  notes TEXT,
  use_rir_rpe BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, name)
);

-- 2. Mesocycles table
CREATE TABLE IF NOT EXISTS mesocycles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  weeks INTEGER NOT NULL CHECK (weeks >= 2 AND weeks <= 16),
  days_per_week INTEGER NOT NULL CHECK (days_per_week >= 1 AND days_per_week <= 7),
  specialization TEXT[] DEFAULT '{}',
  goal_statement TEXT,
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE
);

-- 3. Mesocycle days table
CREATE TABLE IF NOT EXISTS mesocycle_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mesocycle_id UUID REFERENCES mesocycles(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 7),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(mesocycle_id, day_number)
);

-- 4. Day exercises table (exercises planned for each day)
CREATE TABLE IF NOT EXISTS day_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID REFERENCES mesocycle_days(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(day_id, order_index)
);

-- 5. Workout logs table
CREATE TABLE IF NOT EXISTS workout_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  mesocycle_id UUID REFERENCES mesocycles(id) ON DELETE SET NULL,
  week_number INTEGER,
  day_number INTEGER,
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  custom_goal_entry TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Exercise logs table (actual exercises performed)
CREATE TABLE IF NOT EXISTS exercise_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercises(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  replaced_original BOOLEAN DEFAULT false,
  was_accessory BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Set logs table
CREATE TABLE IF NOT EXISTS set_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_log_id UUID REFERENCES exercise_logs(id) ON DELETE CASCADE,
  set_number INTEGER NOT NULL,
  weight DECIMAL(10,2) NOT NULL,
  reps INTEGER NOT NULL,
  rir INTEGER,
  rpe DECIMAL(3,1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exercise_log_id, set_number)
);

-- Create indexes for better performance
CREATE INDEX idx_exercises_user_id ON exercises(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_mesocycles_user_id ON mesocycles(user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_workout_logs_user_id ON workout_logs(user_id);
CREATE INDEX idx_workout_logs_date ON workout_logs(workout_date);
CREATE INDEX idx_workout_logs_mesocycle ON workout_logs(mesocycle_id);

-- Enable RLS
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesocycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesocycle_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE day_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE set_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Exercises: Users can only see/modify their own
CREATE POLICY "Users can view own exercises" ON exercises
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own exercises" ON exercises
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own exercises" ON exercises
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own exercises" ON exercises
  FOR DELETE USING (auth.uid() = user_id);

-- Mesocycles: Users can only see/modify their own
CREATE POLICY "Users can view own mesocycles" ON mesocycles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own mesocycles" ON mesocycles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mesocycles" ON mesocycles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own mesocycles" ON mesocycles
  FOR DELETE USING (auth.uid() = user_id);

-- Mesocycle days: Users can view/modify if they own the mesocycle
CREATE POLICY "Users can view own mesocycle days" ON mesocycle_days
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM mesocycles 
      WHERE mesocycles.id = mesocycle_days.mesocycle_id 
      AND mesocycles.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create own mesocycle days" ON mesocycle_days
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM mesocycles 
      WHERE mesocycles.id = mesocycle_days.mesocycle_id 
      AND mesocycles.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own mesocycle days" ON mesocycle_days
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM mesocycles 
      WHERE mesocycles.id = mesocycle_days.mesocycle_id 
      AND mesocycles.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete own mesocycle days" ON mesocycle_days
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM mesocycles 
      WHERE mesocycles.id = mesocycle_days.mesocycle_id 
      AND mesocycles.user_id = auth.uid()
    )
  );

-- Similar policies for day_exercises (through mesocycle ownership)
CREATE POLICY "Users can view own day exercises" ON day_exercises
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM mesocycle_days 
      JOIN mesocycles ON mesocycles.id = mesocycle_days.mesocycle_id
      WHERE mesocycle_days.id = day_exercises.day_id 
      AND mesocycles.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create own day exercises" ON day_exercises
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM mesocycle_days 
      JOIN mesocycles ON mesocycles.id = mesocycle_days.mesocycle_id
      WHERE mesocycle_days.id = day_exercises.day_id 
      AND mesocycles.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own day exercises" ON day_exercises
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM mesocycle_days 
      JOIN mesocycles ON mesocycles.id = mesocycle_days.mesocycle_id
      WHERE mesocycle_days.id = day_exercises.day_id 
      AND mesocycles.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete own day exercises" ON day_exercises
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM mesocycle_days 
      JOIN mesocycles ON mesocycles.id = mesocycle_days.mesocycle_id
      WHERE mesocycle_days.id = day_exercises.day_id 
      AND mesocycles.user_id = auth.uid()
    )
  );

-- Workout logs: Users can only see/modify their own
CREATE POLICY "Users can view own workout logs" ON workout_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own workout logs" ON workout_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own workout logs" ON workout_logs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own workout logs" ON workout_logs
  FOR DELETE USING (auth.uid() = user_id);

-- Exercise logs: Users can view/modify if they own the workout
CREATE POLICY "Users can view own exercise logs" ON exercise_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM workout_logs 
      WHERE workout_logs.id = exercise_logs.workout_log_id 
      AND workout_logs.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create own exercise logs" ON exercise_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_logs 
      WHERE workout_logs.id = exercise_logs.workout_log_id 
      AND workout_logs.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own exercise logs" ON exercise_logs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM workout_logs 
      WHERE workout_logs.id = exercise_logs.workout_log_id 
      AND workout_logs.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete own exercise logs" ON exercise_logs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM workout_logs 
      WHERE workout_logs.id = exercise_logs.workout_log_id 
      AND workout_logs.user_id = auth.uid()
    )
  );

-- Set logs: Users can view/modify if they own the workout
CREATE POLICY "Users can view own set logs" ON set_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM exercise_logs 
      JOIN workout_logs ON workout_logs.id = exercise_logs.workout_log_id
      WHERE exercise_logs.id = set_logs.exercise_log_id 
      AND workout_logs.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can create own set logs" ON set_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM exercise_logs 
      JOIN workout_logs ON workout_logs.id = exercise_logs.workout_log_id
      WHERE exercise_logs.id = set_logs.exercise_log_id 
      AND workout_logs.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own set logs" ON set_logs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM exercise_logs 
      JOIN workout_logs ON workout_logs.id = exercise_logs.workout_log_id
      WHERE exercise_logs.id = set_logs.exercise_log_id 
      AND workout_logs.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can delete own set logs" ON set_logs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM exercise_logs 
      JOIN workout_logs ON workout_logs.id = exercise_logs.workout_log_id
      WHERE exercise_logs.id = set_logs.exercise_log_id 
      AND workout_logs.user_id = auth.uid()
    )
  );