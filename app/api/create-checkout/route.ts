import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { setEntry } from '@/lib/store';

// Simple in-process rate limiter: max 10 requests per IP per hour
const rateLimitMap = new Map<string, { count: number; reset: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const limit = 10;

  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count += 1;
  return true;
}

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { country, regNo, buyerName, paymentTerms, creditLimit } = body as Record<string, unknown>;

  // Validate required fields server-side
  if (!country || typeof country !== 'string') {
    return NextResponse.json({ error: 'Country is required.' }, { status: 400 });
  }
  if (!regNo || typeof regNo !== 'string') {
    return NextResponse.json({ error: 'Registration number is required.' }, { status: 400 });
  }
  if (!paymentTerms || typeof paymentTerms !== 'string') {
    return NextResponse.json({ error: 'Payment terms are required.' }, { status: 400 });
  }
  if (!creditLimit || typeof creditLimit !== 'number' || creditLimit <= 0) {
    return NextResponse.json({ error: 'A valid credit limit is required.' }, { status: 400 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_URL ?? 'http://localhost:3000';
  const stripe = getStripe();

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID!,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/report/{CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/?cancelled=1`,
      metadata: {
        // Store minimal metadata on the Stripe session for reference;
        // full data stored server-side in the store below
        country: String(country).slice(0, 100),
        regNo: String(regNo).slice(0, 100),
      },
    });

    // Store full form data server-side keyed to session ID
    setEntry(session.id, {
      formData: {
        country: String(country),
        regNo: String(regNo),
        buyerName: typeof buyerName === 'string' ? buyerName : '',
        paymentTerms: String(paymentTerms),
        creditLimit: Number(creditLimit),
      },
      status: 'pending',
      createdAt: Date.now(),
    });

    return NextResponse.json({ checkoutUrl: session.url });
  } catch (err: unknown) {
    console.error('[create-checkout]', err);
    return NextResponse.json(
      { error: 'Failed to create payment session. Please try again.' },
      { status: 500 }
    );
  }
}
