import { useState } from 'react';
import Tooltip from '../Tooltip';

function Field({ label, description, error, children }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
      {!error && description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
    </div>
  );
}

function NumInput({ value, onChange, min, max, error }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent
        ${error ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
    />
  );
}

const roles = [
  { label: 'Material Handlers', countKey: 'materialHandlerCount', rateKey: 'materialHandlerRate' },
  { label: 'Planners', countKey: 'plannerCount', rateKey: 'plannerRate' },
  { label: 'Indirect / Leadership', countKey: 'indirectCount', rateKey: 'indirectRate' },
  { label: 'Direct Employees', countKey: 'directCount', rateKey: 'directRate' },
];

export default function Step1_OperationProfile({ ops, setOps, onNext }) {
  const [errors, setErrors] = useState({});
  const set = (key) => (val) => setOps((prev) => ({ ...prev, [key]: val }));

  function validate() {
    const e = {};
    if (!ops.companyName.trim()) e.companyName = 'Company name is required.';
    if (!ops.unitsPerMonth || ops.unitsPerMonth <= 0) e.unitsPerMonth = 'Enter a value greater than 0.';
    if (!ops.workWeeksPerYear || ops.workWeeksPerYear <= 0) e.workWeeksPerYear = 'Required.';
    if (!ops.workDaysPerWeek || ops.workDaysPerWeek <= 0) e.workDaysPerWeek = 'Required.';
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
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Let's size your opportunity</h2>
      <p className="text-sm text-gray-500 mb-6">Tell us about your team — we'll use this to calculate the true dollar value of time saved.</p>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Facility Overview</h3>
        <Field label="Company Name" error={errors.companyName}>
          <input
            type="text"
            value={ops.companyName}
            onChange={(e) => setOps((prev) => ({ ...prev, companyName: e.target.value }))}
            placeholder="Acme Manufacturing"
            className={`block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent
              ${errors.companyName ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
          />
        </Field>
        <Field label="Units Produced Per Month" description="How many finished goods or work orders does your facility complete each month?" error={errors.unitsPerMonth}>
          <NumInput value={ops.unitsPerMonth} onChange={set('unitsPerMonth')} min={0} error={errors.unitsPerMonth} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Work Weeks / Year" description="Typical = 50 after holidays." error={errors.workWeeksPerYear}>
            <NumInput value={ops.workWeeksPerYear} onChange={set('workWeeksPerYear')} min={1} max={52} error={errors.workWeeksPerYear} />
          </Field>
          <Field label="Working Days / Week" description="Standard production days. Typical = 5." error={errors.workDaysPerWeek}>
            <NumInput value={ops.workDaysPerWeek} onChange={set('workDaysPerWeek')} min={1} max={7} error={errors.workDaysPerWeek} />
          </Field>
          <Field label="Shifts Per Day" description="Number of shifts your facility runs.">
            <NumInput value={ops.shiftsPerDay} onChange={set('shiftsPerDay')} min={1} max={3} />
          </Field>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-1.5">
          Team Headcount & Burdened Rates
          <Tooltip content="Burdened rate = base wage + payroll taxes + benefits + overhead. Typically 1.3–1.5× the hourly base wage.">
            <span className="text-blue-400 cursor-help text-sm">ⓘ</span>
          </Tooltip>
        </h3>
        <p className="text-xs text-gray-500 mb-4">Burdened rate = base wage + benefits, taxes, overhead. Typically 1.3–1.5× base wage.</p>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 pr-4 font-medium text-gray-700">Role</th>
                <th className="text-left py-2 px-2 font-medium text-gray-700"># of People</th>
                <th className="text-left py-2 pl-2 font-medium text-gray-700">Burdened Hourly Rate ($)</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.countKey} className="border-b border-gray-100">
                  <td className="py-2 pr-4 text-gray-700">{role.label}</td>
                  <td className="py-2 px-2">
                    <input
                      type="number"
                      value={ops[role.countKey]}
                      min={0}
                      onChange={(e) => setOps((prev) => ({ ...prev, [role.countKey]: Number(e.target.value) }))}
                      className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="py-2 pl-2">
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-1">$</span>
                      <input
                        type="number"
                        value={ops[role.rateKey]}
                        min={0}
                        onChange={(e) => setOps((prev) => ({ ...prev, [role.rateKey]: Number(e.target.value) }))}
                        className="w-24 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile stacked cards */}
        <div className="sm:hidden space-y-3">
          {roles.map((role) => (
            <div key={role.countKey} className="border border-gray-200 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-700 mb-2">{role.label}</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">People</label>
                  <input
                    type="number"
                    value={ops[role.countKey]}
                    min={0}
                    onChange={(e) => setOps((prev) => ({ ...prev, [role.countKey]: Number(e.target.value) }))}
                    className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">$/hr (burdened)</label>
                  <div className="flex items-center">
                    <span className="text-gray-400 mr-1 text-sm">$</span>
                    <input
                      type="number"
                      value={ops[role.rateKey]}
                      min={0}
                      onChange={(e) => setOps((prev) => ({ ...prev, [role.rateKey]: Number(e.target.value) }))}
                      className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pb-20 lg:pb-0">
        <button
          onClick={handleNext}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          Next: Savings Inputs →
        </button>
      </div>
    </div>
  );
}
