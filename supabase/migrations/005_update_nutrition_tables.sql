-- Add deleted_at for soft deletes and update timestamp types
ALTER TABLE foods
ALTER COLUMN updated_at TYPE timestamptz,
ADD COLUMN deleted_at timestamptz;

ALTER TABLE food_logs
ALTER COLUMN updated_at TYPE timestamptz,
ALTER COLUMN user_id TYPE uuid USING user_id::uuid,
ADD COLUMN deleted_at timestamptz;

-- Drop existing foreign key constraint on food_logs to profiles(id)
ALTER TABLE food_logs
DROP CONSTRAINT food_logs_user_id_fkey;

-- Add new foreign key constraint on food_logs to auth.users(id)
ALTER TABLE food_logs
ADD CONSTRAINT food_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


ALTER TABLE nutrition_settings
ALTER COLUMN updated_at TYPE timestamptz,
ALTER COLUMN user_id TYPE uuid USING user_id::uuid,
ADD COLUMN deleted_at timestamptz;

-- Drop existing foreign key constraint on nutrition_settings to profiles(id)
ALTER TABLE nutrition_settings
DROP CONSTRAINT nutrition_settings_user_id_fkey;

-- Add new foreign key constraint on nutrition_settings to auth.users(id)
ALTER TABLE nutrition_settings
ADD CONSTRAINT nutrition_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


ALTER TABLE recent_foods
ALTER COLUMN updated_at TYPE timestamptz,
ALTER COLUMN last_used TYPE timestamptz,
ALTER COLUMN user_id TYPE uuid USING user_id::uuid,
ADD COLUMN deleted_at timestamptz;

-- Drop existing foreign key constraint on recent_foods to profiles(id)
ALTER TABLE recent_foods
DROP CONSTRAINT recent_foods_user_id_fkey;

-- Add new foreign key constraint on recent_foods to auth.users(id)
ALTER TABLE recent_foods
ADD CONSTRAINT recent_foods_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


-- Update RLS policies to include deleted_at and reference auth.uid()
-- For foods, no change to RLS as it's globally viewable.

-- Update food_logs RLS
DROP POLICY IF EXISTS "Food logs are viewable by owner" ON food_logs;
CREATE POLICY "Food logs are viewable by owner" ON food_logs FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "Food logs are insertable by owner" ON food_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Food logs are updatable by owner" ON food_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Food logs are deletable by owner" ON food_logs FOR DELETE USING (auth.uid() = user_id);

-- Update nutrition_settings RLS
DROP POLICY IF EXISTS "Nutrition settings are manageable by owner" ON nutrition_settings;
CREATE POLICY "Nutrition settings are viewable by owner" ON nutrition_settings FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "Nutrition settings are insertable by owner" ON nutrition_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Nutrition settings are updatable by owner" ON nutrition_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Nutrition settings are deletable by owner" ON nutrition_settings FOR DELETE USING (auth.uid() = user_id);

-- Update recent_foods RLS
DROP POLICY IF EXISTS "Recent foods are manageable by owner" ON recent_foods;
CREATE POLICY "Recent foods are viewable by owner" ON recent_foods FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);
CREATE POLICY "Recent foods are insertable by owner" ON recent_foods FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Recent foods are updatable by owner" ON recent_foods FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Recent foods are deletable by owner" ON recent_foods FOR DELETE USING (auth.uid() = user_id);
