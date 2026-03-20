import { NextRequest, NextResponse } from 'next/server';
import { getEntry, updateEntry } from '@/lib/store';

export async function POST(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;

  const entry = getEntry(sessionId);
  if (!entry) {
    return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid body.' }, { status: 400 });
  }

  const { name, email } = body as Record<string, unknown>;

  if (typeof name !== 'string' || !name.trim()) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }
  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 });
  }

  updateEntry(sessionId, {
    lead: { name: name.trim().slice(0, 200), email: email.trim().slice(0, 200) },
  });

  return NextResponse.json({ ok: true });
}
