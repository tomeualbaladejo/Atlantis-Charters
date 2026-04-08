// Vercel Serverless Function: Admin - Get all reservations
// Protected endpoint for the captain's admin panel

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple password protection
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Get query parameters for filtering
    const { status, from, to } = req.query;

    let query = supabase
      .from('reservations')
      .select('*')
      .order('date', { ascending: true })
      .order('session', { ascending: true });

    // Filter by status if provided
    if (status && ['confirmed', 'cancelled'].includes(status)) {
      query = query.eq('status', status);
    }

    // Filter by date range if provided
    if (from) {
      query = query.gte('date', from);
    }
    if (to) {
      query = query.lte('date', to);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Admin reservations error:', error);
      return res.status(500).json({ error: 'Database error' });
    }

    // Add summary stats
    const stats = {
      total: data.length,
      confirmed: data.filter(r => r.status === 'confirmed').length,
      cancelled: data.filter(r => r.status === 'cancelled').length,
      totalPassengers: data.filter(r => r.status === 'confirmed').reduce((sum, r) => sum + r.passengers, 0)
    };

    res.json({ reservations: data, stats });

  } catch (error) {
    console.error('Admin error:', error);
    res.status(500).json({ error: 'Failed to fetch reservations' });
  }
}
