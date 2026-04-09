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

      if (!bookedSlots[date]) bookedSlots[date] = { morning: false, afternoon: false, sunset: false };

      // All-day event — block everything
      if (event.start.date && !event.start.dateTime) {
        bookedSlots[date].morning = true;
        bookedSlots[date].afternoon = true;
        bookedSlots[date].sunset = true;
        return;
      }

      const title = (event.summary || '').toLowerCase();
      const startHour = new Date(event.start.dateTime).getHours();
      const startMinutes = new Date(event.start.dateTime).getMinutes();
      const startDecimal = startHour + startMinutes / 60;

      const isMorning = title.includes('mañana') || title.includes('morning');
      const isAfternoon = title.includes('tarde') || title.includes('afternoon');
      const isSunset = title.includes('atardecer') || title.includes('sunset');
      const isFullDay = title.includes('completo') || title.includes('full') || title.includes('fullday');

      if (isFullDay) {
        bookedSlots[date].morning = true;
        bookedSlots[date].afternoon = true;
        bookedSlots[date].sunset = true;
      } else if (isMorning) {
        bookedSlots[date].morning = true;
      } else if (isAfternoon) {
        bookedSlots[date].afternoon = true;
      } else if (isSunset) {
        bookedSlots[date].sunset = true;
      } else {
        // Fallback: use start time
        // morning: 10:00-14:00 → starts around 10
        // afternoon: 14:30-18:00 → starts around 14-15
        // sunset: 19:00-21:30 → starts around 19
        if (startDecimal >= 19) {
          bookedSlots[date].sunset = true;
        } else if (startDecimal >= 14) {
          bookedSlots[date].afternoon = true;
        } else if (startDecimal >= 10) {
          bookedSlots[date].morning = true;
        } else {
          // Unknown time — block all to be safe
          bookedSlots[date].morning = true;
          bookedSlots[date].afternoon = true;
          bookedSlots[date].sunset = true;
        }
      }
    });

    res.json({ bookedSlots });
  } catch (error) {
    console.error('Availability error:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
}
