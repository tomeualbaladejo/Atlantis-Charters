// Vercel Serverless Function: Stripe webhook handler
// Handles checkout.session.completed event and updates reservation status

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// Disable body parsing for webhook signature verification
export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log('Webhook received:', event.type);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const reservationId = session.metadata.reservation_id;

    console.log('Payment completed for reservation:', reservationId);

    // Update reservation to 'pending' (awaiting captain confirmation)
    const { data: reservation, error: updateError } = await supabase
      .from('reservations')
      .update({
        status: 'pending',
        stripe_session_id: session.id
      })
      .eq('id', reservationId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update reservation:', updateError);
      return res.status(500).json({ error: 'Database update failed' });
    }

    if (reservation) {
      const PRICES = {
        morning:   { total: 520, deposit: 104, label: 'Medio día mañana (10:00 - 14:00)' },
        afternoon: { total: 520, deposit: 104, label: 'Medio día tarde (14:30 - 18:30)' },
        sunset:    { total: 350, deposit: 70,  label: 'Atardecer (19:00 - 21:30)' },
        fullday:   { total: 620, deposit: 124, label: 'Día completo (14:30 - 20:30)' }
      };

      const price = PRICES[reservation.session];
      const dateFormatted = new Date(reservation.date + 'T00:00:00').toLocaleDateString('es-ES', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      });

      // Send notification to captain
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'onboarding@resend.dev',
            to: ['tomeualbaladejo@gmail.com'],
            subject: `💳 Pago recibido — Nueva reserva: ${reservation.name} · ${dateFormatted}`,
            html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
  <h2 style="color: #C85A4A; margin-bottom: 8px;">💳 Pago recibido — Nueva reserva</h2>
  <p style="color: #2E7D32; font-weight: bold; margin-bottom: 24px;">✅ El cliente ha pagado el depósito de ${price.deposit}€</p>

  <div style="background: #F5F0E8; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #6B6860; width: 150px;">Nombre</td><td style="padding: 8px 0; font-weight: bold;">${reservation.name}</td></tr>
      <tr><td style="padding: 8px 0; color: #6B6860;">Email</td><td style="padding: 8px 0;"><a href="mailto:${reservation.email}" style="color: #C85A4A;">${reservation.email}</a></td></tr>
      <tr><td style="padding: 8px 0; color: #6B6860;">Teléfono</td><td style="padding: 8px 0;"><a href="tel:${reservation.phone}" style="color: #C85A4A;">${reservation.phone}</a></td></tr>
      <tr><td style="padding: 8px 0; color: #6B6860;">Fecha</td><td style="padding: 8px 0; font-weight: bold;">${dateFormatted}</td></tr>
      <tr><td style="padding: 8px 0; color: #6B6860;">Sesión</td><td style="padding: 8px 0; font-weight: bold; color: #C85A4A;">${price.label}</td></tr>
      <tr><td style="padding: 8px 0; color: #6B6860;">Pasajeros</td><td style="padding: 8px 0;">${reservation.passengers}</td></tr>
      <tr><td style="padding: 8px 0; color: #6B6860;">Depósito pagado</td><td style="padding: 8px 0; font-weight: bold; color: #2E7D32;">${price.deposit}€</td></tr>
      <tr><td style="padding: 8px 0; color: #6B6860;">Resto a cobrar</td><td style="padding: 8px 0; font-weight: bold;">${price.total - price.deposit}€ (a bordo)</td></tr>
      ${reservation.message ? `<tr><td style="padding: 8px 0; color: #6B6860;">Mensaje</td><td style="padding: 8px 0;">${reservation.message}</td></tr>` : ''}
    </table>
  </div>

  <div style="text-align: center; margin: 32px 0;">
    <a href="https://atlantis-charters.vercel.app/api/confirm-reservation?id=${reservation.id}&token=${reservation.id}"
       style="display: inline-block; background: #C85A4A; color: white; padding: 16px 40px; border-radius: 30px; text-decoration: none; font-size: 16px; font-weight: 500;">
      ✅ Confirmar y añadir al calendario
    </a>
  </div>

  <p style="text-align: center; color: #6B6860; font-size: 13px;">
    Al confirmar se creará el evento en Google Calendar y el cliente recibirá confirmación.
  </p>
</div>
            `
          })
        });
        console.log('Captain notification email sent');
      } catch (emailError) {
        console.error('Failed to send captain email:', emailError);
      }
    }
  }

  res.json({ received: true });
}
