-- Atlantis Charters Reservations Schema
-- Run this in Supabase SQL Editor

CREATE TABLE reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  date DATE NOT NULL,
  session VARCHAR(20) NOT NULL CHECK (session IN ('morning', 'sunset')),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  passengers INTEGER NOT NULL CHECK (passengers BETWEEN 1 AND 12),
  message TEXT,
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  google_event_id VARCHAR(100)
);

-- Indexes for fast lookups
CREATE INDEX idx_reservations_date ON reservations(date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_date_session ON reservations(date, session);

-- Row Level Security
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (make a reservation via the website)
CREATE POLICY "Anyone can create reservation" ON reservations
  FOR INSERT WITH CHECK (true);

-- Only service role can read/update/delete (captain panel uses service key)
CREATE POLICY "Service role can read" ON reservations
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Service role can update" ON reservations
  FOR UPDATE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can delete" ON reservations
  FOR DELETE USING (auth.role() = 'service_role');
