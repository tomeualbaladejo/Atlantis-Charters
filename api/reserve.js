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

    // Send confirmation email to client
    try {
      const clientEmailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: [email],
          subject: `✅ Reserva confirmada — Atlantis Charters`,
          html: `<p>Tu reserva para el ${date} (${session}) ha sido confirmada.</p>`
        })
      });
      const clientEmailResult = await clientEmailResponse.json();
      console.log('Client email result:', JSON.stringify(clientEmailResult));
    } catch (emailError) {
      console.error('Client email error:', emailError);
      // Don't fail the reservation if email fails
    }

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
          subject: `🆕 Nueva reserva — ${date} · ${session}`,
          html: `<p>Nueva reserva: ${name}, ${email}, ${phone}, ${passengers} pasajeros. Fecha: ${date}, Sesión: ${session}</p>`
        })
      });
      const captainEmailResult = await captainEmailResponse.json();
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
