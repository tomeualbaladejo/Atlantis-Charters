// Vercel Serverless Function: Get calendar availability
// Reads Google Calendar to return booked dates for a given month

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
    const API_KEY = process.env.GOOGLE_API_KEY;

    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDAR_ID)}/events?key=${API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error('Google Calendar API error:', data.error);
      return res.status(500).json({ error: 'Calendar API error' });
    }

    // Parse events to find booked dates and sessions
    const bookedSlots = {};

    (data.items || []).forEach(event => {
      const date = event.start.date || event.start.dateTime?.split('T')[0];
      if (!date) return;

      if (!bookedSlots[date]) bookedSlots[date] = { morning: false, sunset: false };

      const title = (event.summary || '').toLowerCase();

      // Check event start time to determine session
      let startHour = null;
      if (event.start.dateTime) {
        // Parse the hour from dateTime (format: 2026-04-19T09:00:00+02:00)
        const startTime = new Date(event.start.dateTime);
        startHour = startTime.getHours();
      }

      // Determine session from title keywords first
      const isMorningTitle = title.includes('mañana') || title.includes('morning') ||
                             title.includes('manana');
      const isSunsetTitle = title.includes('atardecer') || title.includes('sunset') ||
                            title.includes('tarde');
      const isFullDay = title.includes('completo') || title.includes('full') ||
                        title.includes('día completo');

      if (isFullDay) {
        // Full day blocks both
        bookedSlots[date].morning = true;
        bookedSlots[date].sunset = true;
      } else if (isMorningTitle) {
        bookedSlots[date].morning = true;
      } else if (isSunsetTitle) {
        bookedSlots[date].sunset = true;
      } else if (startHour !== null) {
        // Use start time to determine session
        if (startHour < 14) {
          // Starts before 2pm = morning session (10:00-14:00)
          bookedSlots[date].morning = true;
        } else {
          // Starts at 2pm or later = sunset session (16:00-20:00)
          bookedSlots[date].sunset = true;
        }
      } else {
        // All-day event or unknown — block both to be safe
        bookedSlots[date].morning = true;
        bookedSlots[date].sunset = true;
      }
    });

    res.json({ bookedSlots });
  } catch (error) {
    console.error('Availability error:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
}
