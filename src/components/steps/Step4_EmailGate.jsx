import { useState } from 'react';
import { calcFinancials } from '../../utils/calculations';
import { fmt$, fmtPct, fmtWks } from '../../utils/format';
import MetricCard from '../MetricCard';

const HUBSPOT_PORTAL_ID = 'YOUR_PORTAL_ID';
const HUBSPOT_FORM_ID = 'YOUR_FORM_ID';
const HUBSPOT_FORM_ENDPOINT = `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_ID}`;

export default function Step4_EmailGate({ ops, useCases, fin, onSubmit, onBack }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    company: ops.companyName || '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const result = calcFinancials(ops, useCases, fin);
  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(HUBSPOT_FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: [
            { name: 'firstname', value: form.firstName },
            { name: 'lastname', value: form.lastName },
            { name: 'company', value: form.company },
            { name: 'email', value: form.email },
          ],
        }),
      });
    } catch (_) {
      // swallow errors — show results regardless
    }
    setLoading(false);
    setUnlocked(true);
    setTimeout(() => onSubmit(form), 800);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Get your personalized ROI report.</h2>
      <p className="text-sm text-gray-500 mb-6">Your report includes everything you saw in this calculator plus a full use-case breakdown, your 5-year cash flow table, and a summary page formatted to share with your finance team or leadership. Enter your details below to receive it.</p>

      {/* Blurred metric cards */}
      <div className="relative mb-6">
        <div className={`grid grid-cols-2 lg:grid-cols-3 gap-3 transition-all duration-700 ${unlocked ? '' : 'blur-sm opacity-40 select-none pointer-events-none'}`}>
          <MetricCard label="5-Year ROI" rawValue={result.fiveYrRoi - 1} formatter={fmtPct} explanation="5-year total return" colorClass="border-blue-500" />
          <MetricCard label="5-Year NPV" rawValue={result.npv} formatter={fmt$} explanation="Present value of cash flows" colorClass="border-green-500" />
          <MetricCard label="IRR (Annual)" rawValue={result.irrAnnual} formatter={fmtPct} explanation="Internal rate of return" colorClass="border-purple-500" />
          <MetricCard label="Payback Period" rawValue={result.paybackWeeks} formatter={fmtWks} explanation="Weeks to break even" colorClass="border-orange-500" />
          <MetricCard label="Net Annual Value" rawValue={result.netAnnualValue} formatter={fmt$} explanation="Annual savings minus SaaS cost" colorClass="border-teal-500" />
          <MetricCard label="Annual SaaS ROI" rawValue={result.saasRoi} formatter={fmtPct} explanation="Return on platform fee" colorClass="border-indigo-500" />
        </div>
        {!unlocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="bg-white rounded-full p-3 shadow-lg mb-2">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-700">Enter your details to unlock</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
              <input required type="text" value={form.firstName} onChange={set('firstName')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input required type="text" value={form.lastName} onChange={set('lastName')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
            <input required type="text" value={form.company} onChange={set('company')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Work Email</label>
            <input required type="email" value={form.email} onChange={set('email')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <p className="text-xs text-gray-400">We respect your privacy. No spam, ever.</p>
          <div className="flex justify-between pt-2">
            <button type="button" onClick={onBack} className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-2.5 rounded-lg border border-gray-300 transition-colors">
              ← Back
            </button>
            <button type="submit" disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-medium px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2">
              {loading && (
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                </svg>
              )}
              {loading ? 'Unlocking...' : 'Unlock My Results →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
