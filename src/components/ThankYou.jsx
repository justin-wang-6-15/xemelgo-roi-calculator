import { calcFinancials } from '../utils/calculations';
import { fmt$, fmtPct, fmtWks } from '../utils/format';

function MetricCard({ label, value, explanation, colorClass }) {
  return (
    <div className={`bg-white rounded-xl shadow-md p-5 border-l-4 ${colorClass}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500">{explanation}</p>
    </div>
  );
}

export default function ThankYou({ ops, savings, fin, contactInfo }) {
  const result = calcFinancials(ops, savings, fin);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          {contactInfo?.firstName ? `Thanks, ${contactInfo.firstName}!` : 'Thank You!'}
        </h2>
        <p className="text-gray-500">Here is your personalized Xemelgo ROI analysis{ops.companyName ? ` for ${ops.companyName}` : ''}.</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Savings Summary</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-1 pr-2 font-medium text-gray-600">Category</th>
              <th className="text-right py-1 font-medium text-gray-600">Annual Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr><td className="py-1.5 pr-2 text-gray-700">Daily Production Meetings</td><td className="text-right">{fmt$(result.meeting.annualValue)}</td></tr>
            <tr><td className="py-1.5 pr-2 text-gray-700">Material Handler Search</td><td className="text-right">{fmt$(result.handlerSearch.annualValue)}</td></tr>
            <tr><td className="py-1.5 pr-2 text-gray-700">Production Control Search</td><td className="text-right">{fmt$(result.productionSearch.annualValue)}</td></tr>
            <tr><td className="py-1.5 pr-2 text-gray-700">Quarterly Cycle Counts</td><td className="text-right">{fmt$(result.cycleCountAnnual)}</td></tr>
            <tr><td className="py-1.5 pr-2 text-gray-700">Revenue Acceleration</td><td className="text-right">{fmt$(result.revenueAccelAnnual)}</td></tr>
            <tr className="border-t border-gray-300 font-semibold">
              <td className="py-1.5 pr-2">Total Gross Annual</td>
              <td className="text-right">{fmt$(result.totalGrossAnnual)}</td>
            </tr>
            <tr>
              <td className="py-1.5 pr-2 text-gray-600">Annual Platform Cost</td>
              <td className="text-right text-red-600">({fmt$(result.annualSaasFee)})</td>
            </tr>
            <tr className="border-t-2 border-gray-400 font-bold">
              <td className="py-2 pr-2">Net Annual Value</td>
              <td className="text-right text-blue-700 text-base">{fmt$(result.netAnnualValue)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <MetricCard label="5-Year ROI" value={fmtPct(result.fiveYrRoi - 1)} explanation="Total return relative to 5-year total cost" colorClass="border-blue-500" />
        <MetricCard label="5-Year NPV" value={fmt$(result.npv)} explanation="Net present value of all cash flows at your WACC" colorClass="border-green-500" />
        <MetricCard label="IRR (Annual)" value={fmtPct(result.irrAnnual)} explanation="Internal rate of return on the full investment" colorClass="border-purple-500" />
        <MetricCard label="Payback Period" value={fmtWks(result.paybackWeeks)} explanation="Weeks until cumulative cash flows turn positive" colorClass="border-orange-500" />
        <MetricCard label="Net Annual Value" value={fmt$(result.netAnnualValue)} explanation="Annual savings minus annual platform cost" colorClass="border-teal-500" />
        <MetricCard label="Annual SaaS ROI" value={fmtPct(result.saasRoi)} explanation="Net annual value as a multiple of the platform fee" colorClass="border-indigo-500" />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center print:hidden">
        <a
          href="#"
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-8 py-3 rounded-lg text-center transition-colors"
        >
          Schedule a Demo
        </a>
        <button
          onClick={() => window.print()}
          className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-8 py-3 rounded-lg border border-gray-300 transition-colors"
        >
          Download / Print Results
        </button>
      </div>
    </div>
  );
}
