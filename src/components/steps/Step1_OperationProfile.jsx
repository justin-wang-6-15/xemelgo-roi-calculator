function Field({ label, description, children }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {description && <p className="mt-1 text-xs text-gray-500">{description}</p>}
    </div>
  );
}

function NumInput({ value, onChange, min, max }) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      onChange={(e) => onChange(Number(e.target.value))}
      className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
  const set = (key) => (val) => setOps((prev) => ({ ...prev, [key]: val }));

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Operation Profile</h2>
      <p className="text-sm text-gray-500 mb-6">Tell us about your facility so we can tailor the analysis.</p>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Facility Overview</h3>
        <Field label="Company Name">
          <input
            type="text"
            value={ops.companyName}
            onChange={(e) => setOps((prev) => ({ ...prev, companyName: e.target.value }))}
            placeholder="Acme Manufacturing"
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </Field>
        <Field label="Units Produced Per Month" description="How many finished goods or work orders does your facility complete each month? Used to contextualize your throughput.">
          <NumInput value={ops.unitsPerMonth} onChange={set('unitsPerMonth')} min={0} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Work Weeks / Year" description="Typical = 50 after holidays/shutdowns.">
            <NumInput value={ops.workWeeksPerYear} onChange={set('workWeeksPerYear')} min={1} max={52} />
          </Field>
          <Field label="Working Days / Week" description="Standard production days. Typical = 5.">
            <NumInput value={ops.workDaysPerWeek} onChange={set('workDaysPerWeek')} min={1} max={7} />
          </Field>
          <Field label="Shifts Per Day" description="Number of shifts your facility runs. Informational for context.">
            <NumInput value={ops.shiftsPerDay} onChange={set('shiftsPerDay')} min={1} max={3} />
          </Field>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-base font-semibold text-gray-800 mb-1">Team Headcount & Burdened Rates</h3>
        <p className="text-xs text-gray-500 mb-4">Burdened rate = base wage + benefits, taxes, overhead. Typically 1.3–1.5× base wage.</p>
        <div className="overflow-x-auto">
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
      </div>

      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          Next: Savings Inputs →
        </button>
      </div>
    </div>
  );
}
