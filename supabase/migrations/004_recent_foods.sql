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
  UPDATE recent_foods
  SET 
    use_count = use_count + 1,
    last_used = now(),
    updated_at = now()
  WHERE user_id = p_user_id AND food_id = p_food_id;
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