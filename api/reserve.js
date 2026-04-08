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

  console.log('Reserve API called with:', JSON.stringify(req.body));

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

    console.log('Supabase result:', JSON.stringify({ reservation, dbError }));

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

    // Note: Customer confirmation emails disabled until domain is verified in Resend
    // Resend free tier only allows sending to verified email address

    // Send notification email to captain
    try {
      const captainEmailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: [process.env.CAPTAIN_EMAIL],
          subject: `🆕 Nueva reserva — ${dateFormatted} · ${sessionLabel}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #f9f9f9;">
              <h2 style="color: #C85A4A; margin-bottom: 24px;">🎯 Nueva reserva recibida</h2>

              <div style="background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px 0; color: #666; width: 120px;"><strong>Nombre</strong></td>
                    <td style="padding: 12px 0;">${name}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px 0; color: #666;"><strong>Email</strong></td>
                    <td style="padding: 12px 0;"><a href="mailto:${email}" style="color: #C85A4A;">${email}</a></td>
                  </tr>
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px 0; color: #666;"><strong>Teléfono</strong></td>
                    <td style="padding: 12px 0;"><a href="tel:${phone}" style="color: #C85A4A;">${phone}</a></td>
                  </tr>
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px 0; color: #666;"><strong>Fecha</strong></td>
                    <td style="padding: 12px 0; font-weight: bold;">${dateFormatted}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px 0; color: #666;"><strong>Sesión</strong></td>
                    <td style="padding: 12px 0; font-weight: bold; color: #C85A4A;">${sessionLabel}</td>
                  </tr>
                  <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 12px 0; color: #666;"><strong>Pasajeros</strong></td>
                    <td style="padding: 12px 0;">${passengers}</td>
                  </tr>
                  ${message ? `
                  <tr>
                    <td style="padding: 12px 0; color: #666; vertical-align: top;"><strong>Mensaje</strong></td>
                    <td style="padding: 12px 0;">${message}</td>
                  </tr>
                  ` : ''}
                </table>
              </div>

              <div style="background: #FFF3CD; border-left: 4px solid #FFC107; padding: 16px; border-radius: 8px; margin-bottom: 20px;">
                <p style="margin: 0; color: #856404;">
                  <strong>⚠️ Nota:</strong> El cliente NO ha recibido email de confirmación automático.
                  Por favor, contacta al cliente directamente para confirmar la reserva.
                </p>
              </div>

              <div style="background: white; border-radius: 8px; padding: 16px;">
                <p style="margin: 0 0 8px; color: #666; font-size: 13px;">
                  <strong>ID de reserva:</strong> ${reservation.id}<br>
                  <strong>Creada:</strong> ${new Date().toLocaleString('es-ES')}
                </p>
                <p style="margin: 8px 0 0; font-size: 13px;">
                  <a href="https://atlantis-charters.vercel.app/admin" style="color: #C85A4A;">
                    Ver en panel de administración →
                  </a>
                </p>
              </div>
            </div>
          `
        })
      });
      const captainEmailResult = await captainEmailResponse.json();
      console.log('Captain email result:', JSON.stringify(captainEmailResult));

      if (captainEmailResult.statusCode && captainEmailResult.statusCode !== 200) {
        console.error('Captain email failed:', captainEmailResult);
      }
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
