import { calcFinancials } from '../utils/calculations';
import { fmt$, fmtWks } from '../utils/format';

export default function LivePreviewBar({ ops, savings, fin }) {
  const result = calcFinancials(ops, savings, fin);

  const metrics = [
    { label: 'Annual Opportunity', value: fmt$(result.totalGrossAnnual) },
    { label: 'Net Annual Value', value: fmt$(result.netAnnualValue) },
    { label: 'Est. Payback', value: fmtWks(result.paybackWeeks) },
  ];

  return (
    <>
      {/* Mobile: fixed bottom bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-blue-700 text-white px-4 py-2 shadow-lg">
        <div className="flex justify-around items-center">
          {metrics.map((m) => (
            <div key={m.label} className="text-center">
              <p className="text-xs text-blue-200">{m.label}</p>
              <p className="text-sm font-bold">{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Desktop: sticky sidebar card */}
      <div className="hidden lg:block">
        <div className="sticky top-8 bg-blue-700 text-white rounded-xl shadow-lg p-5">
          <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-4">Live Estimate</p>
          <div className="space-y-4">
            {metrics.map((m) => (
              <div key={m.label}>
                <p className="text-xs text-blue-300">{m.label}</p>
                <p className="text-xl font-bold">{m.value}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-blue-300 leading-relaxed">Updates as you fill in your numbers.</p>
        </div>
      </div>
    </>
  );
}
