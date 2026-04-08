// Vercel Serverless Function: Create reservation
// Saves to Supabase and sends confirmation emails via Resend

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { date, session, name, email, phone, passengers, message } = req.body;

  // Validate required fields
  if (!date || !session || !name || !email || !phone || !passengers) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate session value
  if (!['morning', 'sunset'].includes(session)) {
    return res.status(400).json({ error: 'Invalid session. Must be "morning" or "sunset"' });
  }

  // Validate passengers
  const passengersNum = parseInt(passengers);
  if (isNaN(passengersNum) || passengersNum < 1 || passengersNum > 12) {
    return res.status(400).json({ error: 'Passengers must be between 1 and 12' });
  }

  try {
    // Check availability — make sure slot isn't already taken
    const { data: existing, error: checkError } = await supabase
      .from('reservations')
      .select('id')
      .eq('date', date)
      .eq('session', session)
      .eq('status', 'confirmed');

    if (checkError) {
      console.error('Check error:', checkError);
      return res.status(500).json({ error: 'Database error checking availability' });
    }

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'This slot is already booked' });
    }

    // Save to Supabase
    const { data: reservation, error: dbError } = await supabase
      .from('reservations')
      .insert([{
        date,
        session,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        passengers: passengersNum,
        message: message?.trim() || null
      }])
      .select()
      .single();

    if (dbError) {
      console.error('DB error:', dbError);
      return res.status(500).json({ error: 'Database error saving reservation' });
    }

    // Format session details for emails
    const sessionLabel = session === 'morning'
      ? 'Mañana (09:00 - 14:00)'
      : 'Atardecer (15:00 - 20:00)';

    const sessionLabelEN = session === 'morning'
      ? 'Morning (09:00 - 14:00)'
      : 'Sunset (15:00 - 20:00)';

    const dateFormatted = new Date(date + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const dateFormattedEN = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Send confirmation email to client
    try {
      const clientEmailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Atlantis Charters <onboarding@resend.dev>',
          to: [email],
          subject: `✅ Reserva confirmada — Atlantis Charters`,
          html: `
            <div style="font-family: 'Georgia', serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #FFFFFF;">
              <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="color: #C85A4A; font-size: 28px; margin: 0;">ATLANTIS CHARTERS</h1>
                <p style="color: #6B6860; margin: 8px 0 0;">Port de Pollença, Mallorca</p>
              </div>

              <div style="background: #F5F0E8; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
                <h2 style="color: #1C1C1A; font-size: 22px; margin: 0 0 24px;">¡Tu reserva está confirmada! ⛵</h2>
                <h3 style="color: #6B6860; font-size: 16px; margin: 0 0 16px; font-weight: normal;">Your booking is confirmed!</h3>

                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6B6860; width: 140px;">Nombre / Name</td>
                    <td style="padding: 8px 0; font-weight: bold; color: #1C1C1A;">${name}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B6860;">Fecha / Date</td>
                    <td style="padding: 8px 0; font-weight: bold; color: #1C1C1A;">${dateFormatted}<br><span style="font-weight: normal; color: #6B6860;">${dateFormattedEN}</span></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B6860;">Salida / Session</td>
                    <td style="padding: 8px 0; font-weight: bold; color: #C85A4A;">${sessionLabel}<br><span style="font-weight: normal;">${sessionLabelEN}</span></td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B6860;">Pasajeros / Guests</td>
                    <td style="padding: 8px 0; font-weight: bold; color: #1C1C1A;">${passengers} personas</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6B6860;">Punto de salida</td>
                    <td style="padding: 8px 0; color: #1C1C1A;">W36Q+CH6, 07470 Port de Pollença</td>
                  </tr>
                </table>
              </div>

              <div style="border-left: 4px solid #C85A4A; padding-left: 16px; margin-bottom: 24px;">
                <p style="margin: 0; color: #1C1C1A; line-height: 1.6;">
                  El equipo del Atlantis se pondrá en contacto contigo si necesita más información.<br><br>
                  <em style="color: #6B6860;">The Atlantis team will contact you if more information is needed.</em><br><br>
                  Si tienes alguna duda, escríbenos a <a href="mailto:Atlantis.charter.mallorca@gmail.com" style="color: #C85A4A;">Atlantis.charter.mallorca@gmail.com</a>
                  o al <a href="https://wa.me/34611062419" style="color: #C85A4A;">+34 611 062 419</a>.
                </p>
              </div>

              <p style="text-align: center; color: #6B6860; font-size: 13px;">© 2025 Atlantis Charters · Port de Pollença, Mallorca</p>
            </div>
          `
        })
      });

      const clientEmailResult = await clientEmailRes.json();
      console.log('Client email result:', JSON.stringify(clientEmailResult));
    } catch (emailError) {
      console.error('Client email error:', emailError);
      // Don't fail the reservation if email fails
    }

    // Send notification email to captain
    try {
      const captainEmailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'Atlantis Charters <onboarding@resend.dev>',
          to: [process.env.CAPTAIN_EMAIL],
          subject: `🆕 Nueva reserva — ${dateFormatted} · ${sessionLabel}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px;">
              <h2 style="color: #C85A4A; margin-bottom: 24px;">Nueva reserva recibida</h2>

              <table style="width: 100%; border-collapse: collapse; background: #F5F0E8; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 12px 16px; color: #6B6860; width: 140px;">Nombre</td>
                  <td style="padding: 12px 16px; font-weight: bold;">${name}</td>
                </tr>
                <tr style="background: rgba(0,0,0,0.03);">
                  <td style="padding: 12px 16px; color: #6B6860;">Email</td>
                  <td style="padding: 12px 16px;"><a href="mailto:${email}">${email}</a></td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; color: #6B6860;">Teléfono</td>
                  <td style="padding: 12px 16px;"><a href="tel:${phone}">${phone}</a></td>
                </tr>
                <tr style="background: rgba(0,0,0,0.03);">
                  <td style="padding: 12px 16px; color: #6B6860;">Fecha</td>
                  <td style="padding: 12px 16px; font-weight: bold;">${dateFormatted}</td>
                </tr>
                <tr>
                  <td style="padding: 12px 16px; color: #6B6860;">Sesión</td>
                  <td style="padding: 12px 16px; font-weight: bold; color: #C85A4A;">${sessionLabel}</td>
                </tr>
                <tr style="background: rgba(0,0,0,0.03);">
                  <td style="padding: 12px 16px; color: #6B6860;">Pasajeros</td>
                  <td style="padding: 12px 16px;">${passengers}</td>
                </tr>
                ${message ? `
                <tr>
                  <td style="padding: 12px 16px; color: #6B6860;">Mensaje</td>
                  <td style="padding: 12px 16px;">${message}</td>
                </tr>
                ` : ''}
              </table>

              <p style="margin-top: 24px; color: #6B6860; font-size: 13px;">
                ID de reserva: ${reservation.id}<br>
                Creada: ${new Date().toLocaleString('es-ES')}<br><br>
                Para cancelar o gestionar: accede al panel de administración.
              </p>
            </div>
          `
        })
      });

      const captainEmailResult = await captainEmailRes.json();
      console.log('Captain email result:', JSON.stringify(captainEmailResult));
    } catch (emailError) {
      console.error('Captain email error:', emailError);
      // Don't fail the reservation if email fails
    }

    res.status(201).json({
      success: true,
      reservationId: reservation.id,
      message: 'Reservation confirmed'
    });

  } catch (error) {
    console.error('Reserve error:', error);
    res.status(500).json({ error: 'Failed to create reservation' });
  }
}
