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

  console.log('Reserve API called:', {
    date,
    session,
    passengers,
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
    hasSupabaseKey: !!process.env.SUPABASE_SERVICE_KEY
  });

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

    // Save to Supabase as PENDING (captain must confirm)
    const { data: reservation, error: dbError } = await supabase
      .from('reservations')
      .insert([{
        date,
        session,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        passengers: passengersNum,
        message: message?.trim() || null,
        status: 'pending'
      }])
      .select()
      .single();

    if (dbError) {
      console.error('DB error:', JSON.stringify(dbError, null, 2));
      return res.status(500).json({
        error: 'Database error saving reservation',
        details: dbError.message || 'Unknown error'
      });
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

    // Send notification email to captain with CONFIRM button
    try {
      const resendResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: ['tomeualbaladejo@gmail.com'],
          subject: `⏳ Nueva solicitud de reserva — ${dateFormatted}`,
          html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #ffffff;">
  <h2 style="color: #C85A4A; margin-bottom: 4px;">Nueva solicitud de reserva</h2>
  <p style="color: #6B6860; margin-bottom: 24px;">Un cliente quiere reservar una salida. Confirma para bloquear la fecha.</p>

  <div style="background: #F5F0E8; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #6B6860; width: 130px;">Nombre</td><td style="padding: 8px 0; font-weight: bold;">${name}</td></tr>
      <tr><td style="padding: 8px 0; color: #6B6860;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #C85A4A;">${email}</a></td></tr>
      <tr><td style="padding: 8px 0; color: #6B6860;">Teléfono</td><td style="padding: 8px 0;"><a href="tel:${phone}" style="color: #C85A4A;">${phone}</a></td></tr>
      <tr><td style="padding: 8px 0; color: #6B6860;">Fecha</td><td style="padding: 8px 0; font-weight: bold;">${dateFormatted}</td></tr>
      <tr><td style="padding: 8px 0; color: #6B6860;">Sesión</td><td style="padding: 8px 0; font-weight: bold; color: #C85A4A;">${sessionLabel}</td></tr>
      <tr><td style="padding: 8px 0; color: #6B6860;">Pasajeros</td><td style="padding: 8px 0;">${passengers}</td></tr>
      ${message ? `<tr><td style="padding: 8px 0; color: #6B6860;">Mensaje</td><td style="padding: 8px 0;">${message}</td></tr>` : ''}
    </table>
  </div>

  <div style="text-align: center; margin-bottom: 24px;">
    <a href="https://atlantis-charters.vercel.app/api/confirm-reservation?id=${reservation.id}&token=${reservation.id}"
       style="display: inline-block; background: #C85A4A; color: white; padding: 16px 40px; border-radius: 30px; text-decoration: none; font-size: 16px; font-weight: 500;">
      ✅ Confirmar reserva
    </a>
  </div>

  <p style="text-align: center; color: #6B6860; font-size: 13px;">
    Al confirmar, se creará automáticamente el evento en tu Google Calendar<br>
    y el cliente recibirá un email de confirmación.
  </p>
</div>
          `
        })
      });
      const resendResult = await resendResponse.json();
      console.log('Captain email sent:', resendResult);
    } catch(emailError) {
      console.error('Email error:', emailError);
      // Don't fail the reservation if email fails
    }

    res.status(201).json({
      success: true,
      reservationId: reservation.id,
      status: 'pending',
      message: 'Reservation pending captain confirmation'
    });

  } catch (error) {
    console.error('Reserve error:', error);
    res.status(500).json({ error: 'Failed to create reservation' });
  }
}
