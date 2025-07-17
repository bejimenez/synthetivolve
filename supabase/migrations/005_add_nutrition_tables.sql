-- Nutrition Module Tables for Supabase
-- This migration includes tables for foods, food logs, nutrition settings, and recent foods.

-- 1. Foods table (for USDA food database caching)
CREATE TABLE IF NOT EXISTS foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fdc_id INTEGER UNIQUE, -- USDA FoodData Central ID
  description TEXT NOT NULL,
  brand_name TEXT,
  serving_size DECIMAL(8,2),
  serving_unit TEXT,
  calories_per_100g DECIMAL(7,2),
  protein_per_100g DECIMAL(6,2),
  fat_per_100g DECIMAL(6,2),
  carbs_per_100g DECIMAL(6,2),
  fiber_per_100g DECIMAL(6,2),
  sugar_per_100g DECIMAL(6,2),
  sodium_per_100g DECIMAL(8,2), -- in mg
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Food logs table (for tracking what users eat)
CREATE TABLE IF NOT EXISTS food_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id) ON DELETE CASCADE,
  quantity DECIMAL(8,2) NOT NULL,
  unit TEXT NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL, -- specific time of consumption
  logged_date DATE NOT NULL, -- date for easier querying
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE -- Soft delete
);

-- 3. User settings for nutrition logging
CREATE TABLE IF NOT EXISTS nutrition_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  logging_start_hour INTEGER DEFAULT 3, -- 3 AM start
  logging_end_hour INTEGER DEFAULT 20, -- 8 PM end (20:00)
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Recent foods cache for quick access
CREATE TABLE IF NOT EXISTS recent_foods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id) ON DELETE CASCADE,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  use_count INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, food_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_food_logs_user_date ON food_logs(user_id, logged_date) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_food_logs_user_timestamp ON food_logs(user_id, logged_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_foods_fdc_id ON foods(fdc_id);
CREATE INDEX IF NOT EXISTS idx_foods_description ON foods(description);
CREATE INDEX IF NOT EXISTS idx_recent_foods_user_last_used ON recent_foods(user_id, last_used DESC);

-- Enable Row Level Security
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recent_foods ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Foods are viewable by everyone" ON foods FOR SELECT USING (true);
CREATE POLICY "Users can create foods" ON foods FOR INSERT WITH CHECK (true); -- Anyone can add new foods to the cache
CREATE POLICY "Users can update foods" ON foods FOR UPDATE USING (true); -- Anyone can update cached food data

CREATE POLICY "Food logs are viewable by owner" ON food_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Food logs are creatable by owner" ON food_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Food logs are updateable by owner" ON food_logs
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Food logs are deleteable by owner" ON food_logs
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Nutrition settings are viewable by owner" ON nutrition_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Nutrition settings are creatable by owner" ON nutrition_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Nutrition settings are updateable by owner" ON nutrition_settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Nutrition settings are deleteable by owner" ON nutrition_settings
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Recent foods are viewable by owner" ON recent_foods
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Recent foods are creatable by owner" ON recent_foods
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Recent foods are updateable by owner" ON recent_foods
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Recent foods are deleteable by owner" ON recent_foods
  FOR DELETE USING (auth.uid() = user_id);

-- Function to increment recent food use count
CREATE OR REPLACE FUNCTION increment_recent_food_use_count(
  p_user_id uuid,
  p_food_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO recent_foods (user_id, food_id, use_count, last_used)
  VALUES (p_user_id, p_food_id, 1, now())
  ON CONFLICT (user_id, food_id) DO UPDATE SET 
    use_count = recent_foods.use_count + 1,
    last_used = now(),
    updated_at = now();
END;
$$;

-- Trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Add triggers for updated_at
CREATE TRIGGER update_foods_updated_at
  BEFORE UPDATE ON foods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_logs_updated_at
  BEFORE UPDATE ON food_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_settings_updated_at
  BEFORE UPDATE ON nutrition_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_recent_foods_updated_at
  BEFORE UPDATE ON recent_foods
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
