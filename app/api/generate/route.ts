import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { setEntry, updateEntry } from '@/lib/store';
import { generateCreditReport } from '@/lib/claude';

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

  const sessionId = randomUUID();
  const formData = {
    country: String(country),
    regNo: String(regNo),
    buyerName: typeof buyerName === 'string' ? buyerName : '',
    paymentTerms: String(paymentTerms),
    creditLimit: Number(creditLimit),
  };

  setEntry(sessionId, { formData, status: 'processing', createdAt: Date.now() });

  generateCreditReport(formData)
    .then((markdown) => {
      updateEntry(sessionId, { status: 'ready', markdown });
    })
    .catch((err: unknown) => {
      console.error(`[generate] Claude generation failed for ${sessionId}:`, err);
      updateEntry(sessionId, {
        status: 'error',
        errorMessage: err instanceof Error ? err.message : 'Unknown error',
      });
    });

  return NextResponse.json({ sessionId });
}
