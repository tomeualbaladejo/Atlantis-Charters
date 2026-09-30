import { SESSIONS } from '../../api/_pricing.js'

// Supabase migration 004 (halfday session) was applied on 2026-09-30.
// Set to false to hide half day from the booking widget again.
export const HALFDAY_BOOKABLE = true

// Display order for session pickers and plan cards.
export const SESSION_KEYS = ['morning', 'halfday', 'fullday', 'afternoon', 'sunset']

// Sessions a customer can currently book in the widget.
export const BOOKABLE_SESSION_KEYS = SESSION_KEYS.filter(key => key !== 'halfday' || HALFDAY_BOOKABLE)

export const isBookableSession = (key) => BOOKABLE_SESSION_KEYS.includes(key)

export function sessionTimeRange(key) {
  const cfg = SESSIONS[key]
  return cfg ? `${cfg.start} – ${cfg.end}` : ''
}
