import { SESSIONS } from '../../api/_pricing.js'

// Display order for session pickers and plan cards.
export const SESSION_KEYS = ['morning', 'halfday', 'fullday', 'afternoon', 'sunset']

// Owner-confirmed price-card times. Used only until SESSIONS[key].start/.end
// are available from api/_pricing.js.
const FALLBACK_TIMES = {
  morning:   { start: '10:00', end: '14:00' },
  afternoon: { start: '14:30', end: '18:30' },
  halfday:   { start: '10:00', end: '16:00' },
  fullday:   { start: '10:00', end: '18:00' },
  sunset:    { start: '19:00', end: '21:30' },
}

export function sessionTimes(key) {
  const cfg = SESSIONS[key] || {}
  const fallback = FALLBACK_TIMES[key] || {}
  return {
    start: cfg.start || fallback.start,
    end: cfg.end || fallback.end,
  }
}

export function sessionTimeRange(key) {
  const { start, end } = sessionTimes(key)
  return start && end ? `${start} – ${end}` : ''
}
