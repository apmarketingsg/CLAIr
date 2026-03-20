import { NextRequest, NextResponse } from 'next/server';
import { getEntry } from '@/lib/store';

export async function GET(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const { sessionId } = params;

  if (!sessionId || typeof sessionId !== 'string') {
    return NextResponse.json({ error: 'Invalid session ID.' }, { status: 400 });
  }

  const entry = getEntry(sessionId);

  if (!entry) {
    return NextResponse.json({ error: 'Report not found or has expired.' }, { status: 404 });
  }

  // Never expose formData or lead info to the client
  return NextResponse.json({
    status: entry.status,
    markdown: entry.status === 'ready' ? entry.markdown : undefined,
    errorMessage: entry.status === 'error' ? entry.errorMessage : undefined,
  });
}
