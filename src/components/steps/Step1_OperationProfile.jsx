import { useState } from 'react';

export default function Step1_OperationProfile({ ops, setOps, onNext }) {
  const [errors, setErrors] = useState({});

  function validate() {
    const e = {};
    if (!ops.companyName.trim()) e.companyName = 'Company name is required.';
    if (!ops.industry) e.industry = 'Please select your industry.';
    return e;
  }

  function handleNext() {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setErrors({});
    onNext();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Let's get started</h2>
      <p className="text-sm text-gray-500 mb-4">Tell us about your project — we'll recommend the right use cases for you.</p>

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 mb-6">
        <p className="text-sm text-blue-900 leading-relaxed">
          <span className="font-semibold">Xemelgo is an RFID-powered operations platform</span> that gives manufacturers real-time visibility into inventory, WIP, and assets. This calculator estimates the financial impact for an operation like yours — complete the steps below to see your personalized ROI.
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Project Overview</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
          <input
            type="text"
            value={ops.companyName}
            onChange={(e) => setOps((prev) => ({ ...prev, companyName: e.target.value }))}
            placeholder="Acme Manufacturing"
            className={`block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent
              ${errors.companyName ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
          />
          {errors.companyName && <p className="mt-1 text-xs text-red-600">{errors.companyName}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Industry / Vertical</label>
          <select
            value={ops.industry}
            onChange={(e) => setOps((prev) => ({ ...prev, industry: e.target.value }))}
            className={`block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white
              ${errors.industry ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
          >
            <option value="">Select your industry</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="retail">Retail</option>
            <option value="supplychain">Supply Chain / Distribution</option>
            <option value="healthcare">Healthcare / Life Sciences</option>
            <option value="other">Other</option>
          </select>
          {errors.industry && <p className="mt-1 text-xs text-red-600">{errors.industry}</p>}
        </div>

        <div className="mb-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            What are you trying to solve? <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={ops.projectDescription || ''}
            onChange={(e) => setOps((prev) => ({ ...prev, projectDescription: e.target.value }))}
            placeholder="e.g. We lose hours every week searching for WIP across three production lines and want real-time visibility into where everything is."
            rows={3}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="mt-1 text-xs text-gray-400">Helps us recommend the right use cases on the next step.</p>
        </div>
      </div>

      <div className="flex justify-end pb-20 lg:pb-0">
        <button
          onClick={handleNext}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          Next: Select Use Cases →
        </button>
      </div>
    </div>
  );
}
