import { calcFinancials } from '../../utils/calculations';
import { fmt$, fmtPct, fmtWks } from '../../utils/format';

function MetricCard({ label, value, explanation, colorClass }) {
  return (
    <div className={`bg-white rounded-xl shadow-md p-5 border-l-4 ${colorClass}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500">{explanation}</p>
    </div>
  );
}

export default function Step3_FinancialResults({ ops, savings, fin, setFin, onNext, onBack }) {
  const set = (key) => (val) => setFin((prev) => ({ ...prev, [key]: val }));
  const result = calcFinancials(ops, savings, fin);

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold text-gray-900 mb-1">Financial Inputs & Results</h2>
      <p className="text-sm text-gray-500 mb-6">Review your investment and see the projected return.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Investment Inputs</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">CapEx (hardware, installation)</label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-1">$</span>
                <input
                  type="number"
                  min={0}
                  value={fin.capex}
                  onChange={(e) => set('capex')(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">One-time investment in RFID hardware, readers, antennas, and installation labor.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contingency Rate (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={Math.round(fin.contingencyRate * 100)}
                onChange={(e) => set('contingencyRate')(Number(e.target.value) / 100)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Buffer for unexpected installation costs. Applied to CapEx.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total CapEx with Contingency</label>
              <div className="bg-gray-50 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">
                {fmt$(result.totalCapex)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Xemelgo Monthly Platform Fee</label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-1">$</span>
                <input
                  type="number"
                  min={0}
                  value={fin.monthlyPlatformFee}
                  onChange={(e) => set('monthlyPlatformFee')(Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Monthly SaaS subscription including software, support, and updates.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WACC (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={Math.round(fin.wacc * 100)}
                onChange={(e) => set('wacc')(Number(e.target.value) / 100)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-xs text-gray-500">Your weighted average cost of capital, used to discount future cash flows to present value.</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Savings Summary</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-1 pr-2 font-medium text-gray-600">Category</th>
                <th className="text-right py-1 font-medium text-gray-600">Annual Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr><td className="py-1.5 pr-2 text-gray-700">Daily Production Meetings</td><td className="text-right text-gray-700">{fmt$(result.meeting.annualValue)}</td></tr>
              <tr><td className="py-1.5 pr-2 text-gray-700">Material Handler Search</td><td className="text-right text-gray-700">{fmt$(result.handlerSearch.annualValue)}</td></tr>
              <tr><td className="py-1.5 pr-2 text-gray-700">Production Control Search</td><td className="text-right text-gray-700">{fmt$(result.productionSearch.annualValue)}</td></tr>
              <tr><td className="py-1.5 pr-2 text-gray-700">Quarterly Cycle Counts</td><td className="text-right text-gray-700">{fmt$(result.cycleCountAnnual)}</td></tr>
              <tr><td className="py-1.5 pr-2 text-gray-700">Revenue Acceleration</td><td className="text-right text-gray-700">{fmt$(result.revenueAccelAnnual)}</td></tr>
              <tr className="border-t border-gray-300 font-semibold">
                <td className="py-1.5 pr-2 text-gray-900">Total Gross Annual</td>
                <td className="text-right text-gray-900">{fmt$(result.totalGrossAnnual)}</td>
              </tr>
              <tr>
                <td className="py-1.5 pr-2 text-gray-600">Annual Platform Cost</td>
                <td className="text-right text-red-600">({fmt$(result.annualSaasFee)})</td>
              </tr>
              <tr className="border-t-2 border-gray-400 font-bold">
                <td className="py-2 pr-2 text-gray-900">Net Annual Value</td>
                <td className="text-right text-blue-700 text-base">{fmt$(result.netAnnualValue)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <MetricCard label="5-Year ROI" value={fmtPct(result.fiveYrRoi - 1)} explanation="Total return relative to 5-year total cost" colorClass="border-blue-500" />
        <MetricCard label="5-Year NPV" value={fmt$(result.npv)} explanation="Net present value of all cash flows at your WACC" colorClass="border-green-500" />
        <MetricCard label="IRR (Annual)" value={fmtPct(result.irrAnnual)} explanation="Internal rate of return on the full investment" colorClass="border-purple-500" />
        <MetricCard label="Payback Period" value={fmtWks(result.paybackWeeks)} explanation="Weeks until cumulative cash flows turn positive" colorClass="border-orange-500" />
        <MetricCard label="Net Annual Value" value={fmt$(result.netAnnualValue)} explanation="Annual savings minus annual platform cost" colorClass="border-teal-500" />
        <MetricCard label="Annual SaaS ROI" value={fmtPct(result.saasRoi)} explanation="Net annual value as a multiple of the platform fee" colorClass="border-indigo-500" />
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-2.5 rounded-lg border border-gray-300 transition-colors">
          ← Back
        </button>
        <button onClick={onNext} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors">
          Get Your Full Report →
        </button>
      </div>
    </div>
  );
}
