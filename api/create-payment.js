// Vercel Serverless Function: Create Stripe payment session
// Creates a Checkout Session for a 30% deposit and saves reservation as 'payment_pending'

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { calcPrice, DEPOSIT_PCT_LABEL } from './_pricing.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);
const APP_URL = process.env.PUBLIC_APP_URL || 'https://atlantis-charters.vercel.app';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Verify environment variables
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('Missing STRIPE_SECRET_KEY');
    return res.status(500).json({ error: 'Server configuration error: Missing Stripe key' });
  }
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase credentials');
    return res.status(500).json({ error: 'Server configuration error: Missing database credentials' });
  }

  const { date, session, name, email, phone, passengers, message } = req.body;

  // Validate required fields
  if (!date || !session || !name || !email || !phone || !passengers) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Validate passengers
  const passengersNum = parseInt(passengers);
  if (isNaN(passengersNum) || passengersNum < 1 || passengersNum > 6) {
    return res.status(400).json({ error: 'Passengers must be between 1 and 6' });
  }

  // Server-side price computation (never trust client-sent amounts)
  const price = calcPrice(session, passengersNum);
  if (!price) {
    return res.status(400).json({ error: 'Invalid session' });
  }

  try {
    // Check availability
    const { data: existing, error: checkError } = await supabase
      .from('reservations')
      .select('id')
      .eq('date', date)
      .eq('session', session)
      .in('status', ['payment_pending', 'pending', 'confirmed']);

    if (checkError) {
      console.error('Check error:', checkError);
      return res.status(500).json({ error: 'Database error checking availability' });
    }

    if (existing && existing.length > 0) {
      return res.status(409).json({ error: 'This slot is already booked' });
    }

    // Save as 'payment_pending' in Supabase
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
        status: 'payment_pending'
      }])
      .select()
      .single();

    if (dbError) {
      console.error('DB error:', dbError);
      return res.status(500).json({ error: 'Database error saving reservation' });
    }

    const dateFormatted = new Date(date + 'T00:00:00').toLocaleDateString('es-ES', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    });

    // Create Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      locale: 'es',
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Atlantis Charters — ${price.label}`,
            description: `${dateFormatted} · ${passengersNum} pasajeros · Depósito ${DEPOSIT_PCT_LABEL} (resto se paga a bordo)`,
            images: [`${APP_URL}/images/logo-atlantis.png`]
          },
          unit_amount: price.deposit * 100 // Stripe uses cents
        },
        quantity: 1
      }],
      metadata: {
        reservation_id: reservation.id,
        date,
        session,
        name,
        email,
        phone,
        passengers: String(passengersNum)
      },
      success_url: `${APP_URL}/payment-success.html?session_id={CHECKOUT_SESSION_ID}&reservation_id=${reservation.id}`,
      cancel_url: `${APP_URL}/?payment=cancelled&reservation_id=${reservation.id}`
    });

    console.log('Stripe checkout created:', checkoutSession.id, 'for reservation:', reservation.id);

    res.json({
      checkoutUrl: checkoutSession.url,
      reservationId: reservation.id
    });

  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      error: 'Failed to create payment session',
      details: error.message
    });
  }
}
