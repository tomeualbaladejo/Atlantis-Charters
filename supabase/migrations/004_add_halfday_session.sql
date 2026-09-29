-- Allow the 'halfday' session (10:00 - 16:00)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/editor

-- 1. Drop the old CHECK constraint
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_session_check;

-- 2. Add new CHECK constraint including halfday (keys must match SESSIONS in api/_pricing.js)
ALTER TABLE reservations ADD CONSTRAINT reservations_session_check
  CHECK (session IN ('morning', 'afternoon', 'halfday', 'fullday', 'sunset'));
