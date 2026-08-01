// Shared pricing config for both server (Stripe checkout, emails) and
// client (plan cards, booking modal). Underscore prefix keeps Vercel
// from treating this as an API endpoint.
//
// Formula: total = basePrice + max(0, passengers - 4) * extraPerPassenger
// Deposit: rounded to the nearest whole euro at DEPOSIT_RATE.

export const DEPOSIT_RATE = 0.30;
export const DEPOSIT_PCT_LABEL = '30%';

export const SESSIONS = {
  morning:   { basePrice: 530, extraPerPassenger: 40, label: 'Mañana (10:00 - 14:00)' },
  afternoon: { basePrice: 530, extraPerPassenger: 40, label: 'Tarde (14:30 - 18:30)' },
  halfday:   { basePrice: 650, extraPerPassenger: 50, label: 'Medio día (10:00 - 16:00)' },
  fullday:   { basePrice: 750, extraPerPassenger: 50, label: 'Día completo (10:00 - 18:00)' },
  sunset:    { basePrice: 370, extraPerPassenger: 25, label: 'Atardecer (19:00 - 21:30)' },
};

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
