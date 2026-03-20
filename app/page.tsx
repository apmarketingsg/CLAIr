import InputForm from '@/components/InputForm';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 flex flex-col">
      {/* Nav */}
      <nav className="px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="h-7 w-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <span className="text-white font-bold text-xl tracking-tight">CLAIR</span>
        </div>
        <span className="text-brand-100 text-sm hidden sm:block">Credit Limit AI Review</span>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center mb-10 max-w-2xl">
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-4">
            Know your buyer&apos;s credit risk<br className="hidden sm:block" /> in minutes.
          </h1>
          <p className="text-brand-100 text-lg">
            AI-powered credit assessments modelled on professional trade credit underwriting methodology.
            Country risk · Sector risk · Buyer risk — all in one report.
          </p>
        </div>

        {/* Form card */}
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-brand-900">New Credit Assessment</h2>
            <span className="bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1 rounded-full border border-brand-100">
              $2.50 per report
            </span>
          </div>
          <InputForm />
        </div>

        {/* Trust badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-brand-100 text-sm">
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Stripe-secured payment
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Report ready in ~2 min
          </div>
          <div className="flex items-center gap-1.5">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            Downloadable PDF
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="px-6 py-4 text-center text-brand-200 text-xs">
        © {new Date().getFullYear()} CLAIR — Credit Limit AI Review. Advisory only. Not affiliated with any credit insurer.
      </footer>
    </div>
  );
}
