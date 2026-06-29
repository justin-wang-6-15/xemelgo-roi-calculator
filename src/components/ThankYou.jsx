import { calcFinancials } from '../utils/calculations';
import { fmt$, fmtPct, fmtWks } from '../utils/format';
import MetricCard from './MetricCard';

export default function ThankYou({ ops, savings, fin, contactInfo }) {
  const result = calcFinancials(ops, savings, fin);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Your facility could recover{' '}
          <span className="text-blue-600">{fmt$(result.netAnnualValue)}</span>{' '}
          per year.
        </h2>
        <p className="text-gray-500">
          {contactInfo?.firstName ? `Thanks, ${contactInfo.firstName}! ` : ''}
          Here's your complete Xemelgo ROI analysis{ops.companyName ? ` for ${ops.companyName}` : ''}.
        </p>
      </div>

      {/* Savings summary */}
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

      {/* Metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <MetricCard label="5-Year ROI" rawValue={result.fiveYrRoi - 1} formatter={fmtPct} explanation="Total return relative to 5-year total cost" colorClass="border-blue-500" benchmark="Xemelgo avg: 200–400%" />
        <MetricCard label="5-Year NPV" rawValue={result.npv} formatter={fmt$} explanation="Net present value of all cash flows at your WACC" colorClass="border-green-500" />
        <MetricCard label="IRR (Annual)" rawValue={result.irrAnnual} formatter={fmtPct} explanation="Internal rate of return on the full investment" colorClass="border-purple-500" benchmark="Exceeds typical WACC by 10–30×" />
        <MetricCard label="Payback Period" rawValue={result.paybackWeeks} formatter={fmtWks} explanation="Weeks until cumulative cash flows turn positive" colorClass="border-orange-500" benchmark="Xemelgo avg: 18–24 weeks" />
        <MetricCard label="Net Annual Value" rawValue={result.netAnnualValue} formatter={fmt$} explanation="Annual savings minus annual platform cost" colorClass="border-teal-500" />
        <MetricCard label="Annual SaaS ROI" rawValue={result.saasRoi} formatter={fmtPct} explanation="Net annual value as a multiple of the platform fee" colorClass="border-indigo-500" />
      </div>

      {/* What happens next */}
      <div className="bg-blue-50 rounded-xl p-5 mb-6">
        <h3 className="font-semibold text-blue-900 mb-3">What happens next?</h3>
        <ol className="space-y-2 text-sm text-blue-800">
          <li>✅ Your personalized report is ready to download below</li>
          <li>📅 Schedule a 30-minute demo — we'll walk through your numbers live</li>
          <li>🚀 Most customers go live within 6–8 weeks of signing</li>
        </ol>
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center print:hidden">
        <div className="flex flex-col items-center">
          <a
            href="#"
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-3.5 rounded-lg text-center transition-colors text-base"
          >
            Schedule a Demo
          </a>
          <p className="mt-1.5 text-xs text-gray-400">Free 30-min call with a solutions engineer</p>
        </div>
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
