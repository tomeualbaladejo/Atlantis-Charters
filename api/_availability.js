// Pure helpers that turn Google Calendar events into per-date session
// availability. Kept separate from availability.js so they can be tested
// without network access. Underscore prefix: not a Vercel endpoint.
//
// bookedSlots[date] = { morning, afternoon, halfday, fullday, sunset }
// true = unavailable. Only dates with at least one event are present.

import { SESSIONS, SESSION_KEYS, TIMEZONE, toMinutes, rangesOverlap, overlappingSessions } from './_pricing.js';

const DAY_MINUTES = 24 * 60;

const localFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: TIMEZONE,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

// ISO dateTime (any offset) -> { date: 'YYYY-MM-DD', minutes } in Madrid time
function toLocal(dateTime) {
  const d = new Date(dateTime);
  if (isNaN(d)) return null;
  const parts = Object.fromEntries(localFormatter.formatToParts(d).map(p => [p.type, p.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    minutes: parseInt(parts.hour) * 60 + parseInt(parts.minute),
  };
}

function addDays(date, n) {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// Title keyword -> session key, for events without usable start/end times.
// Order matters: 'atardecer' contains 'tarde', 'medio día mañana' contains 'mañana'.
const KEYWORDS = [
  ['fullday',   ['día completo', 'dia completo', 'completo', 'full day', 'fullday']],
  ['morning',   ['medio día mañana', 'medio dia mañana']],
  ['afternoon', ['medio día tarde', 'medio dia tarde']],
  ['sunset',    ['atardecer', 'sunset']],
  ['halfday',   ['medio día', 'medio dia', 'half day', 'halfday']],
  ['morning',   ['mañana', 'morning']],
  ['afternoon', ['tarde', 'afternoon']],
];

export function sessionFromTitle(title) {
  const t = (title || '').toLowerCase();
  for (const [key, words] of KEYWORDS) {
    if (words.some(w => t.includes(w))) return key;
  }
  return null;
}

function emptySlots() {
  return Object.fromEntries(SESSION_KEYS.map(k => [k, false]));
}

export function computeBookedSlots(events) {
  const bookedSlots = {};
  const slotsFor = (date) => (bookedSlots[date] ||= emptySlots());
  const blockAll = (date) => SESSION_KEYS.forEach(k => { slotsFor(date)[k] = true; });

  // Block every session overlapping [startMin, endMin) on date.
  const blockRange = (date, startMin, endMin) => {
    const slots = slotsFor(date);
    for (const k of SESSION_KEYS) {
      if (rangesOverlap(startMin, endMin, toMinutes(SESSIONS[k].start), toMinutes(SESSIONS[k].end))) {
        slots[k] = true;
      }
    }
  };

  for (const event of events || []) {
    if (event.status === 'cancelled') continue;
    const start = event.start || {};
    const end = event.end || {};

    // All-day event (end.date is exclusive) — block everything on each day
    if (start.date && !start.dateTime) {
      const last = end.date && end.date > start.date ? addDays(end.date, -1) : start.date;
      for (let d = start.date; d <= last; d = addDays(d, 1)) blockAll(d);
      continue;
    }

    const s = start.dateTime && toLocal(start.dateTime);
    const e = end.dateTime && toLocal(end.dateTime);
    if (!s) continue;

    const usable = e && (e.date > s.date || (e.date === s.date && e.minutes > s.minutes));
    if (usable) {
      // Split events that cross midnight into per-day ranges
      for (let d = s.date; d <= e.date; d = addDays(d, 1)) {
        const from = d === s.date ? s.minutes : 0;
        const to = d === e.date ? e.minutes : DAY_MINUTES;
        if (to > from) blockRange(d, from, to);
      }
      continue;
    }

    // No usable end time: fall back to title keywords, else block the whole day
    const key = sessionFromTitle(event.summary);
    if (key) {
      overlappingSessions(key).forEach(k => { slotsFor(s.date)[k] = true; });
    } else {
      blockAll(s.date);
    }
  }

  return bookedSlots;
}
