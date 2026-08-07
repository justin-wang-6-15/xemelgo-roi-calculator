import { toAnnualFrequency, formatFrequency } from '../utils/calculations';

const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

export default function FrequencyInput({ label, value, unit, ops, onChange }) {
  const annual = toAnnualFrequency(value, unit, ops);
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(Number(e.target.value), unit)}
          onWheel={(e) => e.target.blur()}
          className={inputCls}
        />
        <select
          value={unit}
          onChange={(e) => onChange(value, e.target.value)}
          className="rounded-lg border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          <option value="week">/ week</option>
          <option value="month">/ month</option>
          <option value="quarter">/ quarter</option>
          <option value="year">/ year</option>
        </select>
      </div>
      <p className="text-xs text-gray-400 mt-0.5">= {annual} per year</p>
    </div>
  );
}
