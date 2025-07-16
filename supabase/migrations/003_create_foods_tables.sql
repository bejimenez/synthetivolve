-- Foods table for USDA food database caching
CREATE TABLE foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fdc_id integer UNIQUE, -- USDA FoodData Central ID
  description text NOT NULL,
  brand_name text,
  serving_size decimal(8,2),
  serving_unit text,
  calories_per_100g decimal(7,2),
  protein_per_100g decimal(6,2),
  fat_per_100g decimal(6,2),
  carbs_per_100g decimal(6,2),
  fiber_per_100g decimal(6,2),
  sugar_per_100g decimal(6,2),
  sodium_per_100g decimal(8,2), -- in mg
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Food logs for tracking what users eat
CREATE TABLE food_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  food_id uuid REFERENCES foods(id),
  quantity decimal(8,2) NOT NULL,
  unit text NOT NULL,
  logged_at timestamp NOT NULL, -- specific time of consumption
  logged_date date NOT NULL, -- date for easier querying
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- User settings for nutrition logging
CREATE TABLE nutrition_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  logging_start_hour integer DEFAULT 3, -- 3 AM start
  logging_end_hour integer DEFAULT 20, -- 8 PM end (20:00)
  timezone text DEFAULT 'UTC',
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Recent foods cache for quick access
CREATE TABLE recent_foods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  food_id uuid REFERENCES foods(id),
  last_used timestamp DEFAULT now(),
  use_count integer DEFAULT 1,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now(),
  
  UNIQUE(user_id, food_id)
);

-- Indexes for performance
CREATE INDEX idx_food_logs_user_date ON food_logs(user_id, logged_date);
CREATE INDEX idx_food_logs_user_timestamp ON food_logs(user_id, logged_at);
CREATE INDEX idx_foods_fdc_id ON foods(fdc_id);
CREATE INDEX idx_foods_description ON foods(description);
CREATE INDEX idx_recent_foods_user_last_used ON recent_foods(user_id, last_used DESC);

-- Row Level Security
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recent_foods ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Foods are viewable by everyone" ON foods FOR SELECT USING (true);
CREATE POLICY "Food logs are viewable by owner" ON food_logs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Nutrition settings are manageable by owner" ON nutrition_settings FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Recent foods are manageable by owner" ON recent_foods FOR ALL USING (auth.uid() = user_id);