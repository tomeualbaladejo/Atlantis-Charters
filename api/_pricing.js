// Shared pricing and session config for both server (Stripe checkout,
// emails, calendar, availability) and client (plan cards, booking modal).
// Underscore prefix keeps Vercel from treating this as an API endpoint.
//
// SESSIONS is the single source of truth for session times. start/end are
// local Spanish time ("HH:MM", Europe/Madrid).
//
// Formula: total = basePrice + max(0, passengers - 4) * extraPerPassenger
// Deposit: rounded to the nearest whole euro at DEPOSIT_RATE.

export const DEPOSIT_RATE = 0.30;
export const DEPOSIT_PCT_LABEL = '30%';
export const TIMEZONE = 'Europe/Madrid';

export const SESSIONS = {
  morning:   { basePrice: 530, extraPerPassenger: 40, name: 'Mañana',       start: '10:00', end: '14:00' },
  afternoon: { basePrice: 530, extraPerPassenger: 40, name: 'Tarde',        start: '14:30', end: '18:30' },
  halfday:   { basePrice: 650, extraPerPassenger: 50, name: 'Medio día',    start: '10:00', end: '16:00' },
  fullday:   { basePrice: 750, extraPerPassenger: 50, name: 'Día completo', start: '10:00', end: '18:00' },
  sunset:    { basePrice: 370, extraPerPassenger: 25, name: 'Atardecer',    start: '19:00', end: '21:30' },
};

// label, e.g. 'Mañana (10:00 - 14:00)', is derived so it can never drift from start/end.
for (const cfg of Object.values(SESSIONS)) {
  cfg.label = `${cfg.name} (${cfg.start} - ${cfg.end})`;
}

export const SESSION_KEYS = Object.keys(SESSIONS);

// "HH:MM" -> minutes since midnight
export function toMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// Half-open interval overlap: [start, end) — touching sessions do not overlap.
export function rangesOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

// True if the two session keys share any time. Unknown keys overlap nothing.
export function sessionsOverlap(a, b) {
  const sa = SESSIONS[a];
  const sb = SESSIONS[b];
  if (!sa || !sb) return false;
  return rangesOverlap(toMinutes(sa.start), toMinutes(sa.end), toMinutes(sb.start), toMinutes(sb.end));
}

// All session keys that overlap the given one (including itself).
export function overlappingSessions(session) {
  return SESSION_KEYS.filter(k => sessionsOverlap(session, k));
}

export function calcPrice(session, passengers) {
  const cfg = SESSIONS[session];
  if (!cfg) return null;
  const px = Math.max(1, Math.min(6, parseInt(passengers) || 1));
  const extra = Math.max(0, px - 4) * cfg.extraPerPassenger;
  const total = cfg.basePrice + extra;
  const deposit = Math.round(total * DEPOSIT_RATE);
  return {
    total,
    deposit,
    remainder: total - deposit,
    label: cfg.label,
  };
}
