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

  console.log('Reserve API called:', { date, session, passengers });

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

    // Note: Customer confirmation emails disabled until domain is verified in Resend
    // Resend free tier only allows sending to verified email address

    // Send notification email to captain
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
          subject: `🆕 Nueva reserva Atlantis — ${dateFormatted}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
                <tr>
                  <td align="center">
                    <table width="100%" style="max-width: 600px; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                      <!-- Header -->
                      <tr>
                        <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px 40px; text-align: center;">
                          <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 600;">
                            🆕 Nueva Reserva
                          </h1>
                          <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                            Atlantis Charters
                          </p>
                        </td>
                      </tr>

                      <!-- Alert Banner -->
                      <tr>
                        <td style="background-color: #fef3c7; padding: 15px 40px; border-left: 4px solid #f59e0b;">
                          <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                            ⚠️ <strong>Importante:</strong> El cliente aún no ha recibido confirmación automática.
                            Contacta para confirmar la reserva.
                          </p>
                        </td>
                      </tr>

                      <!-- Content -->
                      <tr>
                        <td style="padding: 40px;">
                          <!-- Customer Info -->
                          <div style="margin-bottom: 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #1e3a8a; font-size: 20px; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                              Información del Cliente
                            </h2>
                            <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px; width: 140px;">
                                  <strong>Nombre:</strong>
                                </td>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #1f2937; font-size: 14px;">
                                  ${name}
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">
                                  <strong>Email:</strong>
                                </td>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                                  <a href="mailto:${email}" style="color: #3b82f6; text-decoration: none; font-size: 14px;">
                                    ${email}
                                  </a>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">
                                  <strong>Teléfono:</strong>
                                </td>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
                                  <a href="tel:${phone}" style="color: #3b82f6; text-decoration: none; font-size: 14px;">
                                    ${phone}
                                  </a>
                                </td>
                              </tr>
                            </table>
                          </div>

                          <!-- Booking Details -->
                          <div style="margin-bottom: 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #1e3a8a; font-size: 20px; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                              Detalles de la Reserva
                            </h2>
                            <table width="100%" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px; width: 140px;">
                                  <strong>Fecha:</strong>
                                </td>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #1f2937; font-size: 14px;">
                                  ${dateFormatted}
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">
                                  <strong>Sesión:</strong>
                                </td>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #1f2937; font-size: 14px;">
                                  ${sessionLabel}
                                </td>
                              </tr>
                              <tr>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #6b7280; font-size: 14px;">
                                  <strong>Pasajeros:</strong>
                                </td>
                                <td style="padding: 12px 0; border-bottom: 1px solid #f3f4f6; color: #1f2937; font-size: 14px;">
                                  ${passengers}
                                </td>
                              </tr>
                              ${message ? `
                              <tr>
                                <td style="padding: 12px 0; color: #6b7280; font-size: 14px; vertical-align: top;">
                                  <strong>Mensaje:</strong>
                                </td>
                                <td style="padding: 12px 0; color: #1f2937; font-size: 14px; line-height: 1.6;">
                                  ${message}
                                </td>
                              </tr>
                              ` : ''}
                            </table>
                          </div>

                          <!-- Action Button -->
                          <div style="text-align: center; margin-top: 30px;">
                            <a href="https://atlantischarters.com/admin"
                               style="display: inline-block; background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                              Ver Panel de Administración
                            </a>
                          </div>
                        </td>
                      </tr>

                      <!-- Footer -->
                      <tr>
                        <td style="background-color: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                          <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px;">
                            ID Reserva: ${reservation.id}
                          </p>
                          <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                            Recibido: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </body>
            </html>
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
      message: 'Reservation confirmed'
    });

  } catch (error) {
    console.error('Reserve error:', error);
    res.status(500).json({ error: 'Failed to create reservation' });
  }
}
