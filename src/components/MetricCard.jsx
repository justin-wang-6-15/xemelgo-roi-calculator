import { useCountUp } from '../hooks/useCountUp';

export default function MetricCard({ label, rawValue, formatter, explanation, colorClass, benchmark }) {
  const animated = useCountUp(rawValue ?? 0);
  const display = formatter ? formatter(animated) : String(Math.round(animated));

  return (
    <div className={`bg-white rounded-xl shadow-md p-5 border-l-4 ${colorClass}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mb-1">{display}</p>
      <p className="text-xs text-gray-500">{explanation}</p>
      {benchmark && (
        <p className="mt-1.5 text-xs text-teal-600 font-medium bg-teal-50 rounded px-1.5 py-0.5 inline-block">
          {benchmark}
        </p>
      )}
    </div>
  );
}
