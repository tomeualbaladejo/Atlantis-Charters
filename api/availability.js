// Vercel Serverless Function: Get calendar availability
// Reads Google Calendar to return booked sessions per date for a given month

import { getGoogleAccessToken } from './_google-auth.js';
import { computeBookedSlots } from './_availability.js';
import { TIMEZONE } from './_pricing.js';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { year, month } = req.query;

  if (!year || !month) {
    return res.status(400).json({ error: 'year and month are required' });
  }

  try {
    // Calculate time range for the month
    const timeMin = new Date(parseInt(year), parseInt(month) - 1, 1).toISOString();
    const timeMax = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59).toISOString();

    const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID;

    const accessToken = await getGoogleAccessToken();
    if (!accessToken) {
      console.error('Failed to obtain Google access token for availability read');
      return res.status(500).json({ error: 'Calendar auth error' });
    }

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime&timeZone=${encodeURIComponent(TIMEZONE)}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const data = await response.json();

    if (data.error) {
      console.error('Google Calendar API error:', data.error);
      return res.status(500).json({ error: 'Calendar API error' });
    }

    // bookedSlots[date] = { morning, afternoon, halfday, fullday, sunset }, true = unavailable
    const bookedSlots = computeBookedSlots(data.items);

    res.json({ bookedSlots });
  } catch (error) {
    console.error('Availability error:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
}
