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

const UNITS_FIELD_LANG = {
  '':              { label: 'Units Produced Per Month',               placeholder: '10,000', helper: 'Enter your monthly finished goods output. If your facility tracks work orders, use the number of work orders completed per month. When in doubt, use finished goods units.' },
  manufacturing:   { label: 'Units Produced Per Month',               placeholder: '10,000', helper: 'Enter your monthly finished goods output. If your facility tracks work orders, use the number of work orders completed per month. When in doubt, use finished goods units.' },
  aerospace:       { label: 'Work Orders Completed Per Month',         placeholder: '250',    helper: 'Enter the number of work orders or job orders your facility completes each month.' },
  lifesciences:    { label: 'Lots or Batches Completed Per Month',     placeholder: '50',     helper: 'Enter the number of production lots or batches your facility releases per month.' },
  foodbeverage:    { label: 'Cases or Pallets Produced Per Month',     placeholder: '2,000',  helper: 'Enter your monthly finished goods output in cases or pallet equivalents, whichever you track.' },
  automotive:      { label: 'Vehicles or Assemblies Completed Per Month', placeholder: '500', helper: 'Enter the number of finished vehicles, modules, or major assemblies your facility completes per month.' },
  electronics:     { label: 'PCBAs or Assemblies Completed Per Month', placeholder: '1,000',  helper: 'Enter the number of finished circuit board assemblies or electronic assemblies completed per month.' },
  retail:          { label: 'Orders Shipped Per Month',                placeholder: '5,000',  helper: 'Enter the total number of outbound orders or shipments your facility processes per month.' },
  other:           { label: 'Units or Jobs Completed Per Month',       placeholder: '1,000',  helper: 'Enter whatever unit best represents your monthly throughput — finished goods, work orders, or jobs completed.' },
};

const SHIFTS_FIELD_LANG = {
  retail: { label: 'Operating Hours Per Day', helper: 'How many hours per day your facility or distribution center operates.' },
};
const DEFAULT_SHIFTS_LANG = { label: 'Shifts Per Day', helper: 'Number of shifts your facility runs.' };

// Fix 2: updated descriptions with direct-employees clarification
const ROLE_DESCRIPTIONS = [
  'Warehouse staff, stockroom associates, forklift operators — anyone who physically moves or stores inventory.',
  'Production schedulers, inventory analysts, supply chain coordinators — anyone managing what\'s where and what\'s needed next.',
  'Supervisors, managers, plant leadership — anyone overseeing operations but not directly handling materials.',
  'Direct Employees: Frontline production workers — assemblers, machine operators, line technicians. Do not include anyone already listed as a Material Handler, Planner, or in Indirect/Leadership.',
];

function RoleClassificationHelp() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-1 mb-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
      >
        How to classify your team {open ? '▲' : '▾'}
      </button>
      {open && (
        <div className="mt-2 space-y-2 text-xs text-gray-600 bg-blue-50 rounded-lg p-3 border border-blue-100">
          {roles.map((role, i) => (
            <div key={role.countKey}>
              <span className="font-semibold text-gray-700">{role.label}:</span>{' '}
              {ROLE_DESCRIPTIONS[i]}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Step1_OperationProfile({ ops, setOps, onNext }) {
  const [errors, setErrors] = useState({});
  const set = (key) => (val) => setOps((prev) => ({ ...prev, [key]: val }));

  function validate() {
    const e = {};
    if (!ops.companyName.trim()) e.companyName = 'Company name is required.';
    // Fix 10: industry required
    if (!ops.industry) e.industry = 'Please select your industry.';
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
      <p className="text-sm text-gray-500 mb-4">Tell us about your team — we'll use this to calculate the true dollar value of time saved.</p>

      <div className="bg-blue-50 border border-blue-100 rounded-xl px-5 py-4 mb-6">
        <p className="text-sm text-blue-900 leading-relaxed">
          <span className="font-semibold">Xemelgo is an RFID-powered operations platform</span> that gives manufacturers real-time visibility into inventory, WIP, and assets. This calculator estimates the financial impact for an operation like yours — complete the steps below to see your personalized ROI.
        </p>
      </div>

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

        {/* Fix 10: Industry selector, placed between Company Name and Units */}
        <Field label="Industry / Vertical" error={errors.industry}>
          <select
            value={ops.industry}
            onChange={(e) => setOps((prev) => ({ ...prev, industry: e.target.value }))}
            className={`block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent bg-white
              ${errors.industry ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
          >
            <option value="">Select your industry</option>
            <option value="manufacturing">Manufacturing (general)</option>
            <option value="aerospace">Aerospace and Defense</option>
            <option value="lifesciences">Life Sciences / Medical Devices</option>
            <option value="foodbeverage">Food and Beverage</option>
            <option value="automotive">Automotive</option>
            <option value="electronics">Electronics / High-Tech</option>
            <option value="retail">Retail / Distribution</option>
            <option value="other">Other</option>
          </select>
        </Field>

        {(() => {
          const unitsLang = UNITS_FIELD_LANG[ops.industry] ?? UNITS_FIELD_LANG[''];
          return (
            <Field label={unitsLang.label} description={unitsLang.helper} error={errors.unitsPerMonth}>
              <input
                type="number"
                value={ops.unitsPerMonth}
                min={0}
                placeholder={unitsLang.placeholder}
                onChange={(e) => set('unitsPerMonth')(Number(e.target.value))}
                className={`block w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent
                  ${errors.unitsPerMonth ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-blue-500'}`}
              />
            </Field>
          );
        })()}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Work Weeks / Year" description="Typical = 50 after holidays." error={errors.workWeeksPerYear}>
            <NumInput value={ops.workWeeksPerYear} onChange={set('workWeeksPerYear')} min={1} max={52} error={errors.workWeeksPerYear} />
          </Field>
          <Field label="Working Days / Week" description="Standard production days. Typical = 5." error={errors.workDaysPerWeek}>
            <NumInput value={ops.workDaysPerWeek} onChange={set('workDaysPerWeek')} min={1} max={7} error={errors.workDaysPerWeek} />
          </Field>
          {(() => {
            const shiftsLang = SHIFTS_FIELD_LANG[ops.industry] ?? DEFAULT_SHIFTS_LANG;
            return (
              <Field label={shiftsLang.label} description={shiftsLang.helper}>
                <NumInput value={ops.shiftsPerDay} onChange={set('shiftsPerDay')} min={1} max={ops.industry === 'retail' ? 24 : 3} />
              </Field>
            );
          })()}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-base font-semibold text-gray-800 mb-1 flex items-center gap-1.5">
          Team Headcount & Burdened Rates
          <Tooltip content="Burdened rate = base wage + payroll taxes + benefits + overhead. Typically 1.3–1.5× the hourly base wage.">
            <span className="text-blue-400 cursor-help text-sm">ⓘ</span>
          </Tooltip>
        </h3>
        <p className="text-xs text-gray-500 mb-3">Burdened rate = base wage + benefits, taxes, overhead. Typically 1.3–1.5× base wage.</p>

        <RoleClassificationHelp />

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
                  <td className="py-2 pr-4">
                    <span className="text-gray-700">{role.label}</span>
                    {/* Fix 2: clarifying note for Direct Employees */}
                    {role.countKey === 'directCount' && (
                      <p className="text-xs text-gray-400 italic mt-0.5">Production line workers only — do not include anyone already counted above.</p>
                    )}
                  </td>
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
              <p className="text-sm font-medium text-gray-700 mb-0.5">{role.label}</p>
              {/* Fix 2: clarifying note for Direct Employees */}
              {role.countKey === 'directCount' && (
                <p className="text-xs text-gray-400 italic mb-2">Production line workers only — do not include anyone already counted above.</p>
              )}
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
          Next: Review Your Opportunity →
        </button>
      </div>
    </div>
  );
}
