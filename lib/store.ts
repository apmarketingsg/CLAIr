/**
 * Server-side in-memory store for pending form data and generated reports.
 * Reports expire after 24 hours.
 *
 * NOTE: This module runs exclusively on the server. Nothing here is ever
 * sent to or accessible from the browser.
 */

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface FormData {
  country: string;
  regNo: string;
  buyerName: string;
  paymentTerms: string;
  creditLimit: number;
}

export interface ReportEntry {
  formData: FormData;
  status: 'pending' | 'processing' | 'ready' | 'error';
  markdown?: string;
  errorMessage?: string;
  lead?: { name: string; email: string };
  createdAt: number;
}

// Module-level singleton — persists across requests in the same Node.js process.
const store = new Map<string, ReportEntry>();

export function setEntry(sessionId: string, entry: ReportEntry): void {
  store.set(sessionId, entry);
  // Schedule automatic cleanup after TTL
  setTimeout(() => store.delete(sessionId), TTL_MS);
}

export function getEntry(sessionId: string): ReportEntry | undefined {
  return store.get(sessionId);
}

export function updateEntry(
  sessionId: string,
  patch: Partial<ReportEntry>
): void {
  const existing = store.get(sessionId);
  if (existing) {
    store.set(sessionId, { ...existing, ...patch });
  }
}
