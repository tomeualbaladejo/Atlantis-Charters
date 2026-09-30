import { SESSIONS } from '../../api/_pricing.js'

// Half day stays off until Supabase migration 004 (halfday session) is applied;
// until then a half-day checkout would fail server-side.
export const HALFDAY_BOOKABLE = false

// Display order for session pickers and plan cards.
export const SESSION_KEYS = ['morning', 'halfday', 'fullday', 'afternoon', 'sunset']

// Sessions a customer can currently book in the widget.
export const BOOKABLE_SESSION_KEYS = SESSION_KEYS.filter(key => key !== 'halfday' || HALFDAY_BOOKABLE)

export const isBookableSession = (key) => BOOKABLE_SESSION_KEYS.includes(key)

export function sessionTimeRange(key) {
  const cfg = SESSIONS[key]
  return cfg ? `${cfg.start} – ${cfg.end}` : ''
}
