-- Migration to rename muscle columns to match application code
-- Run this in your Supabase SQL editor

-- 1. Rename primary_muscle to primary_muscle_group
ALTER TABLE exercises 
RENAME COLUMN primary_muscle TO primary_muscle_group;

-- 2. Rename secondary_muscles to secondary_muscle_groups
ALTER TABLE exercises 
RENAME COLUMN secondary_muscles TO secondary_muscle_groups;

-- 3. Update the check constraint for primary_muscle_group
ALTER TABLE exercises 
DROP CONSTRAINT IF EXISTS exercises_primary_muscle_check;

ALTER TABLE exercises 
ADD CONSTRAINT exercises_primary_muscle_group_check 
CHECK (primary_muscle_group IN (
    'CHEST', 'BACK', 'SHOULDERS', 'TRICEPS', 'BICEPS', 
    'QUADS', 'HAMSTRINGS', 'GLUTES', 'CALVES', 'ABS', 'FOREARMS'
));

-- 4. Verify the changes (optional - to see the new structure)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'exercises' 
AND column_name LIKE '%muscle%';