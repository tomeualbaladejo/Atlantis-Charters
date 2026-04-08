// Vercel Serverless Function: Confirm reservation
// Called when captain clicks CONFIRM in email
// Updates status to 'confirmed' and sends client confirmation email

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export default async function handler(req, res) {
  const { id, token } = req.query;

  // Simple validation (using id as token for now)
  if (!id || token !== id) {
    return res.status(400).send('<h1>Link inválido</h1>');
  }

  try {
    // Get reservation
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !reservation) {
      return res.status(404).send('<h1>Reserva no encontrada</h1>');
    }

    if (reservation.status === 'confirmed') {
      return res.send(`
        <html><body style="font-family:Arial;text-align:center;padding:80px;">
          <h2 style="color:#2E7D32;">✅ Esta reserva ya estaba confirmada</h2>
          <p>${reservation.name} · ${reservation.date}</p>
        </body></html>
      `);
    }

    // Session details
    const sessionLabel = reservation.session === 'morning'
      ? 'Mañana (10:00 - 14:00)'
      : 'Atardecer (16:00 - 20:00)';

    const startTime = reservation.session === 'morning' ? '10:00' : '16:00';
    const endTime = reservation.session === 'morning' ? '14:00' : '20:00';

    const dateFormatted = new Date(reservation.date + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // NOTE: Google Calendar API with just an API key is READ-ONLY
    // To write events we need OAuth2, which requires user authentication flow
    // For now, we'll provide a Google Calendar "quick add" link below
    // The captain can click it to add the event with all details pre-filled

    // Update reservation status to confirmed
    const { error: updateError } = await supabase
      .from('reservations')
      .update({
        status: 'confirmed'
      })
      .eq('id', id);

    if (updateError) {
      console.error('Supabase update error:', updateError);
      return res.status(500).send('<h1>Error actualizando la reserva</h1>');
    }

    // Send confirmation email to CLIENT
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'onboarding@resend.dev',
          to: ['tomeualbaladejo@gmail.com'], // Test mode — change to reservation.email when domain verified
          subject: `✅ ¡Tu reserva está confirmada! — Atlantis Charters`,
          html: `
<div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="color: #C85A4A; font-size: 28px; margin: 0;">ATLANTIS CHARTERS</h1>
    <p style="color: #6B6860; margin: 8px 0 0;">Port de Pollença, Mallorca</p>
  </div>

  <div style="background: #F5F0E8; border-radius: 16px; padding: 32px; margin-bottom: 24px;">
    <h2 style="color: #1C1C1A; font-size: 22px; margin: 0 0 24px;">¡Tu reserva está confirmada! ⛵</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 10px 0; color: #6B6860; width: 140px; border-bottom: 1px solid #E8E0CC;">Nombre</td><td style="padding: 10px 0; font-weight: bold; border-bottom: 1px solid #E8E0CC;">${reservation.name}</td></tr>
      <tr><td style="padding: 10px 0; color: #6B6860; border-bottom: 1px solid #E8E0CC;">Fecha</td><td style="padding: 10px 0; font-weight: bold; border-bottom: 1px solid #E8E0CC;">${dateFormatted.charAt(0).toUpperCase() + dateFormatted.slice(1)}</td></tr>
      <tr><td style="padding: 10px 0; color: #6B6860; border-bottom: 1px solid #E8E0CC;">Horario</td><td style="padding: 10px 0; font-weight: bold; color: #C85A4A; border-bottom: 1px solid #E8E0CC;">${sessionLabel}</td></tr>
      <tr><td style="padding: 10px 0; color: #6B6860; border-bottom: 1px solid #E8E0CC;">Pasajeros</td><td style="padding: 10px 0; border-bottom: 1px solid #E8E0CC;">${reservation.passengers} personas</td></tr>
      <tr><td style="padding: 10px 0; color: #6B6860;">Punto de salida</td><td style="padding: 10px 0;">W36Q+CH6, 07470 Port de Pollença</td></tr>
    </table>
  </div>

  <div style="border-left: 4px solid #C85A4A; padding-left: 16px; margin-bottom: 32px;">
    <p style="margin: 0; color: #1C1C1A; line-height: 1.7;">
      Si tienes alguna duda, escríbenos a
      <a href="mailto:Atlantis.charter.mallorca@gmail.com" style="color: #C85A4A;">Atlantis.charter.mallorca@gmail.com</a>
      o por WhatsApp al
      <a href="https://wa.me/34611062419" style="color: #C85A4A;">+34 611 062 419</a>.
    </p>
  </div>

  <p style="text-align: center; color: #6B6860; font-size: 13px;">© 2025 Atlantis Charters · Port de Pollença, Mallorca</p>
</div>
          `
        })
      });
      console.log('Client confirmation email sent');
    } catch (emailError) {
      console.error('Client email error:', emailError);
      // Continue even if email fails
    }

    // Build Google Calendar quick add URL
    const calendarEventTitle = encodeURIComponent(`⛵ Atlantis — ${reservation.name} (${reservation.session === 'morning' ? 'Mañana' : 'Atardecer'})`);
    const calendarDates = `${reservation.date.replace(/-/g, '')}T${startTime.replace(':', '')}00/${reservation.date.replace(/-/g, '')}T${endTime.replace(':', '')}00`;
    const calendarDetails = encodeURIComponent(`Cliente: ${reservation.name}\nEmail: ${reservation.email}\nTeléfono: ${reservation.phone}\nPasajeros: ${reservation.passengers}${reservation.message ? `\nMensaje: ${reservation.message}` : ''}`);
    const calendarLocation = encodeURIComponent('W36Q+CH6, 07470 Port de Pollença, Illes Balears');
    const calendarUrl = `https://calendar.google.com/calendar/r/eventedit?text=${calendarEventTitle}&dates=${calendarDates}&details=${calendarDetails}&location=${calendarLocation}`;

    // Show success page to captain
    res.send(`
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reserva confirmada — Atlantis</title>
        <style>
          body { font-family: 'Georgia', serif; background: #F5F0E8; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
          .card { background: white; border-radius: 20px; padding: 48px; max-width: 480px; text-align: center; box-shadow: 0 8px 32px rgba(0,0,0,0.1); }
          h1 { color: #2E7D32; font-size: 24px; margin-bottom: 8px; }
          p { color: #6B6860; line-height: 1.6; }
          .detail { background: #F5F0E8; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: left; }
          .detail p { margin: 6px 0; font-size: 14px; }
          a { display: inline-block; margin-top: 12px; background: #C85A4A; color: white; padding: 12px 32px; border-radius: 30px; text-decoration: none; font-size: 15px; }
          a.calendar { background: #4285F4; margin-top: 12px; }
          a.home { background: #6B6860; margin-top: 8px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div style="font-size: 56px; margin-bottom: 16px;">✅</div>
          <h1>¡Reserva confirmada!</h1>
          <p>Se ha enviado el email de confirmación al cliente.</p>
          <div class="detail">
            <p><strong>${reservation.name}</strong></p>
            <p>📅 ${dateFormatted}</p>
            <p>⛵ ${sessionLabel}</p>
            <p>👥 ${reservation.passengers} pasajeros</p>
          </div>
          <a href="${calendarUrl}" target="_blank" class="calendar">
            📅 Añadir a Google Calendar
          </a>
          <br>
          <a href="https://atlantis-charters.vercel.app/admin" class="home">Ver panel de administración</a>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Confirm reservation error:', error);
    res.status(500).send('<h1>Error procesando la confirmación</h1>');
  }
}
