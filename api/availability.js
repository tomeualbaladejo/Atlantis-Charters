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
        console.log(`[${date}] All-day event: ${event.summary}`);
        return;
      }

      const title = (event.summary || '').toLowerCase();

      // Parse time directly from dateTime string to avoid timezone issues
      // Format: "2026-04-13T14:30:00+02:00"
      const timeMatch = event.start.dateTime.match(/T(\d{2}):(\d{2})/);
      const startHour = timeMatch ? parseInt(timeMatch[1]) : 0;
      const startMinutes = timeMatch ? parseInt(timeMatch[2]) : 0;
      const startDecimal = startHour + startMinutes / 60;

      console.log(`[${date}] Event: "${event.summary || '(no title)'}" at ${startHour}:${startMinutes.toString().padStart(2, '0')} (${startDecimal})`);

      // Check title keywords - order matters!
      const isFullDay = title.includes('día completo') || title.includes('dia completo') ||
                        title.includes('completo') || title.includes('full day') ||
                        title.includes('fullday');
      const isMorning = title.includes('medio día mañana') || title.includes('medio dia mañana') ||
                       title.includes('mañana') || title.includes('morning');
      const isAfternoon = title.includes('medio día tarde') || title.includes('medio dia tarde') ||
                         title.includes('tarde') || title.includes('afternoon');
      const isSunset = title.includes('atardecer') || title.includes('sunset');

      console.log(`  Keywords: fullday=${isFullDay}, morning=${isMorning}, afternoon=${isAfternoon}, sunset=${isSunset}`);

      if (isFullDay) {
        // Full day only blocks afternoon + sunset (NOT morning)
        bookedSlots[date].afternoon = true;
        bookedSlots[date].sunset = true;
        console.log(`  → Blocked: afternoon, sunset (fullday)`);
      } else if (isMorning) {
        bookedSlots[date].morning = true;
        console.log(`  → Blocked: morning`);
      } else if (isAfternoon) {
        bookedSlots[date].afternoon = true;
        console.log(`  → Blocked: afternoon`);
      } else if (isSunset) {
        bookedSlots[date].sunset = true;
        console.log(`  → Blocked: sunset`);
      } else {
        // Fallback: use start time
        if (startDecimal >= 19) {
          bookedSlots[date].sunset = true;
          console.log(`  → Blocked: sunset (by time ${startDecimal})`);
        } else if (startDecimal >= 14) {
          bookedSlots[date].afternoon = true;
          console.log(`  → Blocked: afternoon (by time ${startDecimal})`);
        } else if (startDecimal >= 10) {
          bookedSlots[date].morning = true;
          console.log(`  → Blocked: morning (by time ${startDecimal})`);
        } else {
          // Unknown time — block all to be safe
          bookedSlots[date].morning = true;
          bookedSlots[date].afternoon = true;
          bookedSlots[date].sunset = true;
          console.log(`  → Blocked: ALL (unknown time ${startDecimal})`);
        }
      }
    });

    res.json({ bookedSlots });
  } catch (error) {
    console.error('Availability error:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
}
