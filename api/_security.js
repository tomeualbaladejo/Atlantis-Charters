// Shared helpers for HTML escaping and signed captain confirmation links.
// Underscore prefix: not a Vercel endpoint. Server-only (uses node:crypto).

import { createHmac, timingSafeEqual } from 'crypto';

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// Escape a customer-supplied value for interpolation into HTML text or a quoted attribute.
export function escapeHtml(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/[&<>"']/g, c => HTML_ESCAPES[c]);
}

// HMAC-SHA256 of the reservation id, keyed by CONFIRM_LINK_SECRET.
// Returns null when the secret is not configured.
export function confirmToken(id) {
  const secret = process.env.CONFIRM_LINK_SECRET;
  if (!secret || !id) return null;
  return createHmac('sha256', secret).update(`confirm-reservation:${id}`).digest('base64url');
}

export function verifyConfirmToken(id, token) {
  const expected = confirmToken(id);
  if (!expected || typeof token !== 'string') return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Full captain confirmation URL, or null when CONFIRM_LINK_SECRET is missing.
export function confirmUrl(id) {
  const token = confirmToken(id);
  if (!token) return null;
  const base = process.env.PUBLIC_APP_URL || 'https://atlantis-charters.vercel.app';
  return `${base}/api/confirm-reservation?id=${encodeURIComponent(id)}&token=${token}`;
}

// Button HTML for captain emails; degrades to a warning if the secret is missing
// so the booking notification itself is still delivered.
export function confirmButtonHtml(id, text) {
  const url = confirmUrl(id);
  if (!url) {
    console.error('CONFIRM_LINK_SECRET is not set — confirmation link omitted from captain email');
    return `<p style="color: #B00020; font-weight: bold;">⚠️ Enlace de confirmación no disponible (falta CONFIRM_LINK_SECRET). Reserva: ${escapeHtml(id)}</p>`;
  }
  return `<a href="${escapeHtml(url)}"
       style="display: inline-block; background: #C85A4A; color: white; padding: 16px 40px; border-radius: 30px; text-decoration: none; font-size: 16px; font-weight: 500;">
      ${text}
    </a>`;
}
