// Vercel Serverless Function: Cancel a reservation
// Protected endpoint for captain only

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Password protection
  const auth = req.headers.authorization;
  if (auth !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { id, sendEmail = true } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Reservation ID is required' });
  }

  try {
    // Get reservation details first (for email)
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({ error: 'Reservation is already cancelled' });
    }

    // Update status to cancelled
    const { error: updateError } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (updateError) {
      console.error('Cancel error:', updateError);
      return res.status(500).json({ error: 'Database error' });
    }

    // Send cancellation email to client if requested
    if (sendEmail && reservation.email) {
      const sessionLabel = reservation.session === 'morning'
        ? 'Mañana (09:00 - 14:00)'
        : 'Atardecer (15:00 - 20:00)';

      const dateFormatted = new Date(reservation.date + 'T00:00:00').toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: 'Atlantis Charters <reservas@atlantis-charters.vercel.app>',
            to: [reservation.email],
            subject: `❌ Reserva cancelada — Atlantis Charters`,
            html: `
              <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FFFFFF;">
                <div style="text-align: center; margin-bottom: 32px;">
                  <h1 style="color: #C85A4A; font-size: 28px; margin: 0;">ATLANTIS CHARTERS</h1>
                  <p style="color: #6B6860; margin: 8px 0 0;">Port de Pollença, Mallorca</p>
                </div>

                <div style="background: #FEF2F2; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
                  <h2 style="color: #1C1C1A; font-size: 22px; margin: 0 0 24px;">Tu reserva ha sido cancelada</h2>
                  <h3 style="color: #6B6860; font-size: 16px; margin: 0 0 16px; font-weight: normal;">Your booking has been cancelled</h3>

                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #6B6860; width: 140px;">Fecha / Date</td>
                      <td style="padding: 8px 0; color: #1C1C1A;">${dateFormatted}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #6B6860;">Salida / Session</td>
                      <td style="padding: 8px 0; color: #1C1C1A;">${sessionLabel}</td>
                    </tr>
                  </table>
                </div>

                <div style="border-left: 4px solid #C85A4A; padding-left: 16px; margin-bottom: 24px;">
                  <p style="margin: 0; color: #1C1C1A; line-height: 1.6;">
                    Si tienes alguna pregunta o deseas hacer una nueva reserva, contáctanos:<br><br>
                    <em style="color: #6B6860;">If you have any questions or would like to make a new booking, contact us:</em><br><br>
                    <a href="mailto:Atlantis.charter.mallorca@gmail.com" style="color: #C85A4A;">Atlantis.charter.mallorca@gmail.com</a><br>
                    <a href="https://wa.me/34611062419" style="color: #C85A4A;">+34 611 062 419</a>
                  </p>
                </div>

                <p style="text-align: center; color: #6B6860; font-size: 13px;">© 2025 Atlantis Charters · Port de Pollença, Mallorca</p>
              </div>
            `
          })
        });
      } catch (emailError) {
        console.error('Cancellation email error:', emailError);
        // Don't fail if email fails
      }
    }

    res.json({ success: true, message: 'Reservation cancelled' });

  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ error: 'Failed to cancel reservation' });
  }
}
