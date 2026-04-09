-- Add Stripe payment support to reservations table
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/editor

-- 1. Drop the old CHECK constraints
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_session_check;
ALTER TABLE reservations DROP CONSTRAINT IF EXISTS reservations_status_check;

-- 2. Add new CHECK constraints with all session types
ALTER TABLE reservations ADD CONSTRAINT reservations_session_check
  CHECK (session IN ('morning', 'afternoon', 'sunset', 'fullday'));

-- 3. Add new CHECK constraint with all statuses
ALTER TABLE reservations ADD CONSTRAINT reservations_status_check
  CHECK (status IN ('payment_pending', 'pending', 'confirmed', 'cancelled'));

-- 4. Add stripe_session_id column
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS stripe_session_id VARCHAR(200);

-- 5. Update default status to payment_pending (new reservations start pending payment)
ALTER TABLE reservations ALTER COLUMN status SET DEFAULT 'payment_pending';

-- 6. Create index for Stripe session lookups
CREATE INDEX IF NOT EXISTS idx_reservations_stripe_session ON reservations(stripe_session_id);
