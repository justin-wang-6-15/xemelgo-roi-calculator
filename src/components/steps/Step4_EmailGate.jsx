import { useState } from 'react';

const HUBSPOT_PORTAL_ID = 'YOUR_PORTAL_ID';
const HUBSPOT_FORM_ID = 'YOUR_FORM_ID';
const HUBSPOT_FORM_ENDPOINT = `https://api.hsforms.com/submissions/v3/integration/submit/${HUBSPOT_PORTAL_ID}/${HUBSPOT_FORM_ID}`;

export default function Step4_EmailGate({ ops, onSubmit, onBack }) {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    company: ops.companyName || '',
    email: '',
  });
  const [loading, setLoading] = useState(false);

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
      // swallow errors — show thank you regardless
    }
    setLoading(false);
    onSubmit(form);
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Get Your Full ROI Report</h2>
      <p className="text-sm text-gray-500 mb-6">Enter your details to unlock your personalized analysis and receive a copy.</p>

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
              {loading ? 'Submitting...' : 'View My Results →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
