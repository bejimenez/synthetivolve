-- Add plan_data column to mesocycles table
ALTER TABLE mesocycles
ADD COLUMN plan_data JSONB;