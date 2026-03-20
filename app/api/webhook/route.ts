import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { getEntry, updateEntry } from '@/lib/store';
import { generateCreditReport } from '@/lib/claude';

// App Router route handlers receive the raw stream by default — no bodyParser config needed.
// We read it with req.text() which gives Stripe the raw bytes for signature verification.

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe signature.' }, { status: 400 });
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET is not set.');
    return NextResponse.json({ error: 'Webhook secret not configured.' }, { status: 500 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: unknown) {
    console.error('[webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature.' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const sessionId = session.id;

    const entry = getEntry(sessionId);
    if (!entry) {
      // Edge case: form data not found (e.g., server restarted between checkout and webhook)
      console.warn(`[webhook] No form data found for session ${sessionId}`);
      return NextResponse.json({ received: true });
    }

    // Mark as processing immediately so the polling page can show a loading state
    updateEntry(sessionId, { status: 'processing' });

    // Generate the report asynchronously — do NOT await here so Stripe gets a fast 200
    generateCreditReport(entry.formData)
      .then((markdown) => {
        updateEntry(sessionId, { status: 'ready', markdown });
      })
      .catch((err: unknown) => {
        console.error(`[webhook] Claude generation failed for ${sessionId}:`, err);
        updateEntry(sessionId, {
          status: 'error',
          errorMessage: err instanceof Error ? err.message : 'Unknown error',
        });
      });
  }

  return NextResponse.json({ received: true });
}
