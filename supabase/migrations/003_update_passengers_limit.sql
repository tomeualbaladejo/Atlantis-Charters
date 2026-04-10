-- Update passengers limit from 12 to 6
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/editor

-- 1. Drop the old CHECK constraint
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_passengers_check;

-- 2. Add new CHECK constraint with updated limit (1-6 passengers)
ALTER TABLE reservations ADD CONSTRAINT reservations_passengers_check
  CHECK (passengers BETWEEN 1 AND 6);
