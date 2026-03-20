'use client';

import { useState } from 'react';
import CountrySelect from './CountrySelect';

const PAYMENT_TERMS = [
  { value: '≤30 days', label: '≤ 30 days (Short)' },
  { value: '31-60 days', label: '31 – 60 days (Standard)' },
  { value: '61-90 days', label: '61 – 90 days (Extended)' },
  { value: '90+ days', label: '90+ days (Long)' },
];

interface FormValues {
  country: string;
  regNo: string;
  buyerName: string;
  paymentTerms: string;
  creditLimit: string;
}

interface Errors {
  country?: string;
  regNo?: string;
  paymentTerms?: string;
  creditLimit?: string;
}

export default function InputForm() {
  const [values, setValues] = useState<FormValues>({
    country: '',
    regNo: '',
    buyerName: '',
    paymentTerms: '',
    creditLimit: '',
  });
  const [errors, setErrors] = useState<Errors>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  function set(field: keyof FormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): Errors {
    const errs: Errors = {};
    if (!values.country) errs.country = 'Country is required.';
    if (!values.regNo.trim()) errs.regNo = 'Business registration number is required.';
    if (!values.paymentTerms) errs.paymentTerms = 'Payment terms are required.';
    if (!values.creditLimit.trim()) {
      errs.creditLimit = 'Credit limit is required.';
    } else if (isNaN(Number(values.creditLimit)) || Number(values.creditLimit) <= 0) {
      errs.creditLimit = 'Please enter a valid positive amount.';
    }
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setApiError('');

    try {
      const res = await fetch('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          country: values.country,
          regNo: values.regNo.trim(),
          buyerName: values.buyerName.trim(),
          paymentTerms: values.paymentTerms,
          creditLimit: Number(values.creditLimit),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create checkout session.');
      }

      const { checkoutUrl } = await res.json();
      window.location.href = checkoutUrl;
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'An unexpected error occurred.');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {/* Country */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Buyer Country <span className="text-red-500">*</span>
        </label>
        <CountrySelect
          value={values.country}
          onChange={(v) => set('country', v)}
          error={errors.country}
        />
      </div>

      {/* Business Registration Number */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Business Registration Number <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={values.regNo}
          onChange={(e) => set('regNo', e.target.value)}
          placeholder="e.g. 202012345A"
          className={`w-full px-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            errors.regNo ? 'border-red-400' : 'border-slate-300'
          }`}
        />
        {errors.regNo && (
          <p className="text-red-500 text-xs mt-1">{errors.regNo}</p>
        )}
      </div>

      {/* Buyer Name */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Buyer / Legal Entity Name{' '}
          <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={values.buyerName}
          onChange={(e) => set('buyerName', e.target.value)}
          placeholder="e.g. Acme Manufacturing Pte. Ltd."
          className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      {/* Payment Terms */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Terms of Payment <span className="text-red-500">*</span>
        </label>
        <select
          value={values.paymentTerms}
          onChange={(e) => set('paymentTerms', e.target.value)}
          className={`w-full px-3 py-2.5 border rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            errors.paymentTerms ? 'border-red-400' : 'border-slate-300'
          }`}
        >
          <option value="">Select payment terms…</option>
          {PAYMENT_TERMS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        {errors.paymentTerms && (
          <p className="text-red-500 text-xs mt-1">{errors.paymentTerms}</p>
        )}
      </div>

      {/* Credit Limit */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Credit Limit (USD) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">
            $
          </span>
          <input
            type="number"
            min="1"
            step="any"
            value={values.creditLimit}
            onChange={(e) => set('creditLimit', e.target.value)}
            placeholder="50,000"
            className={`w-full pl-7 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              errors.creditLimit ? 'border-red-400' : 'border-slate-300'
            }`}
          />
        </div>
        {errors.creditLimit && (
          <p className="text-red-500 text-xs mt-1">{errors.creditLimit}</p>
        )}
      </div>

      {/* API error */}
      {apiError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {apiError}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-6 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-lg text-sm transition disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            Redirecting to payment…
          </>
        ) : (
          <>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Generate Report — $2.50
          </>
        )}
      </button>

      <p className="text-xs text-slate-400 text-center">
        Secure payment via Stripe. Your report is generated immediately after payment.
      </p>
    </form>
  );
}
