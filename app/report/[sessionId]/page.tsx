'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import ReportView from '@/components/ReportView';
import Link from 'next/link';

type Status = 'pending' | 'processing' | 'ready' | 'error' | 'not_found';

const STATUS_MESSAGES: Record<string, string> = {
  pending: 'Payment confirmed. Preparing your assessment…',
  processing: 'Claude is researching and analysing your buyer. This usually takes 60–90 seconds…',
};

export default function ReportPage() {
  const params = useParams();
  const sessionId = params?.sessionId as string;

  const [status, setStatus] = useState<Status>('pending');
  const [markdown, setMarkdown] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [dots, setDots] = useState('');

  const poll = useCallback(async () => {
    if (!sessionId) return;

    try {
      const res = await fetch(`/api/report/${sessionId}`);
      if (res.status === 404) {
        setStatus('not_found');
        return;
      }
      const data = await res.json();
      setStatus(data.status as Status);
      if (data.status === 'ready' && data.markdown) {
        setMarkdown(data.markdown);
      }
      if (data.status === 'error') {
        setErrorMessage(data.errorMessage ?? 'An error occurred generating your report.');
      }
    } catch {
      // Network hiccup — keep polling
    }
  }, [sessionId]);

  // Poll every 3 seconds while pending/processing
  useEffect(() => {
    poll();
    if (status === 'ready' || status === 'error' || status === 'not_found') return;
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [poll, status]);

  // Animated dots for loading state
  useEffect(() => {
    if (status === 'ready' || status === 'error' || status === 'not_found') return;
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'));
    }, 500);
    return () => clearInterval(interval);
  }, [status]);

  if (status === 'not_found') {
    return (
      <ErrorState
        title="Report Not Found"
        message="This report may have expired (reports are available for 24 hours after generation) or the session ID is invalid."
      />
    );
  }

  if (status === 'error') {
    return (
      <ErrorState
        title="Generation Failed"
        message={errorMessage || 'An error occurred while generating your report. Please contact support.'}
      />
    );
  }

  if (status !== 'ready') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
          {/* Animated shield */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-50 rounded-full mb-6">
            <svg
              className="h-10 w-10 text-brand-600 animate-pulse"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-brand-900 mb-2">
            Generating Your Report{dots}
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            {STATUS_MESSAGES[status] ?? 'Processing…'}
          </p>
          {/* Progress bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-2 bg-brand-500 rounded-full animate-pulse"
              style={{ width: status === 'processing' ? '60%' : '20%' }}
            />
          </div>
          <p className="text-xs text-slate-400 mt-4">
            Do not close this tab. The page will update automatically.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Screen nav */}
      <nav className="no-print bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-brand-900 font-bold text-lg hover:opacity-80 transition">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          CLAIR
        </Link>
        <Link
          href="/"
          className="text-sm text-slate-500 hover:text-brand-600 transition flex items-center gap-1"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          New Report
        </Link>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <ReportView markdown={markdown} sessionId={sessionId} />
      </main>

      <footer className="no-print py-6 text-center text-slate-400 text-xs">
        © {new Date().getFullYear()} CLAIR — Credit Limit AI Review. Advisory only.
      </footer>
    </div>
  );
}

function ErrorState({ title, message }: { title: string; message: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4">
          <svg className="h-8 w-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">{title}</h2>
        <p className="text-slate-500 text-sm mb-6">{message}</p>
        <Link
          href="/"
          className="inline-block px-6 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 transition"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
