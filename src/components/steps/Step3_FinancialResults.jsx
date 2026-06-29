import React from 'react';
import { calcFinancials } from '../../utils/calculations';
import { fmt$, fmtPct, fmtWks } from '../../utils/format';
import MetricCard from '../MetricCard';
import Tooltip from '../Tooltip';

function SavingsBarChart({ result }) {
  const { cashFlows, totalCapex, annualSaasFee, netAnnualValue } = result;

  const monthlySaasFee = annualSaasFee / 12;
  let year1Gross = 0;
  for (let m = 1; m <= 12; m++) year1Gross += cashFlows[m] + monthlySaasFee;

  const yearlyGross = [year1Gross, netAnnualValue, netAnnualValue, netAnnualValue, netAnnualValue];
  const cumulativeSavings = yearlyGross.reduce((acc, v, i) => {
    acc.push((acc[i - 1] || 0) + v);
    return acc;
  }, []);
  const cumulativeCost = [1, 2, 3, 4, 5].map((y) => totalCapex + annualSaasFee * y);

  const maxVal = Math.max(...cumulativeSavings, ...cumulativeCost);
  const chartH = 140;
  const chartW = 480;
  const barW = 30;
  const groupGap = 16;
  const groupW = barW * 2 + groupGap;
  const totalGroupsW = groupW * 5 + 20 * 4;
  const offsetX = (chartW - totalGroupsW) / 2;

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-4">
      <h3 className="text-base font-semibold text-gray-800 mb-1">5-Year Cumulative Outlook</h3>
      <p className="text-xs text-gray-500 mb-4">Cumulative savings vs. total investment over 5 years.</p>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${chartW} ${chartH + 40}`} className="w-full max-w-lg mx-auto">
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
            const y = chartH - tick * chartH;
            return (
              <line key={tick} x1={0} y1={y} x2={chartW} y2={y} stroke="#f3f4f6" strokeWidth="1" />
            );
          })}
          {[0, 1, 2, 3, 4].map((i) => {
            const gx = offsetX + i * (groupW + 20);
            const savH = Math.max(2, (cumulativeSavings[i] / maxVal) * chartH);
            const costH = Math.max(2, (cumulativeCost[i] / maxVal) * chartH);
            return (
              <g key={i}>
                <rect x={gx} y={chartH - savH} width={barW} height={savH} fill="#2563eb" rx="3" />
                <rect x={gx + barW + groupGap} y={chartH - costH} width={barW} height={costH} fill="#d1d5db" rx="3" />
                <text x={gx + groupW / 2} y={chartH + 16} textAnchor="middle" fontSize="11" fill="#6b7280">
                  Yr {i + 1}
                </text>
              </g>
            );
          })}
          <line x1={0} y1={chartH} x2={chartW} y2={chartH} stroke="#e5e7eb" strokeWidth="1" />
        </svg>
      </div>
      <div className="flex items-center gap-6 justify-center mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-blue-600" />
          <span className="text-xs text-gray-500">Cumulative Savings</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-gray-300" />
          <span className="text-xs text-gray-500">Cumulative Cost</span>
        </div>
      </div>
    </div>
  );
}

export default function Step3_FinancialResults({ ops, useCases, fin, setFin, onNext, onBack }) {
  const set = (key) => (val) => setFin((prev) => ({ ...prev, [key]: val }));
  const result = calcFinancials(ops, useCases, fin);

  // Fix 6: Dynamic CapEx tooltip
  const estimatedZones = Math.max(3, Math.min(12, Math.ceil(ops.unitsPerMonth / 2000)));
  const estimatedCapex = estimatedZones * 8000 * 1.25;
  const capexTooltip = `Estimated based on your throughput volume: ${estimatedZones} zones × $8,000 + 25% installation = ${fmt$(estimatedCapex)}`;

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Your ROI at a glance</h2>
      <p className="text-sm text-gray-500 mb-6">Based on your inputs, here's what Xemelgo is worth to your facility.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Investment Inputs</h3>
          <div className="space-y-4">
            <div>
              {/* Fix 6: CapEx with tooltip showing estimate breakdown */}
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                CapEx (hardware, installation)
                <Tooltip content={capexTooltip}>
                  <span className="text-blue-400 cursor-help text-sm">ⓘ</span>
                </Tooltip>
              </label>
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
              <p className="mt-1 text-xs text-gray-500">This is an estimate based on your operation size. Your Xemelgo rep will confirm exact hardware requirements and pricing.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                Contingency Rate (%)
                <Tooltip content="A buffer added to CapEx to cover unforeseen installation costs. Typically 10–15%.">
                  <span className="text-blue-400 cursor-help text-sm">ⓘ</span>
                </Tooltip>
              </label>
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
              {/* Fix 7: Platform fee helper text */}
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
              <p className="mt-1 text-xs text-gray-500">Typical starting price for an operation your size. Actual pricing is confirmed with your Xemelgo rep based on deployment scope, number of readers, and modules selected.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                WACC (%)
                <Tooltip content="Weighted Average Cost of Capital — the minimum return your company requires on investments. Typically 8–12% for manufacturers.">
                  <span className="text-blue-400 cursor-help text-sm">ⓘ</span>
                </Tooltip>
              </label>
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
              {result.buckets.map((bucket) =>
                bucket.lineItems.length > 0 ? (
                  <React.Fragment key={bucket.name}>
                    {bucket.lineItems.map((li) => (
                      <tr key={li.key}>
                        <td className="py-1.5 pr-2 text-gray-700 pl-2">{li.name}</td>
                        <td className="text-right text-gray-700">{fmt$(li.annualValue)}</td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50">
                      <td className="py-1 pr-2 pl-2 text-xs font-medium text-gray-500">{bucket.name} subtotal</td>
                      <td className="text-right text-xs font-medium text-gray-500 pr-1">{fmt$(bucket.subtotal)}</td>
                    </tr>
                  </React.Fragment>
                ) : null
              )}
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

      {/* Fix 8: Main 5 metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-2">
        <MetricCard label="5-Year ROI" rawValue={result.fiveYrRoi - 1} formatter={fmtPct} explanation="Total return relative to 5-year total cost" colorClass="border-blue-500" benchmark="Xemelgo avg: 200–400%" />
        <MetricCard label="5-Year NPV" rawValue={result.npv} formatter={fmt$} explanation="Net present value of all cash flows at your WACC" colorClass="border-green-500" />
        <MetricCard label="IRR (Annual)" rawValue={result.irrAnnual} formatter={fmtPct} explanation="Internal rate of return on the full investment" colorClass="border-purple-500" benchmark="Exceeds typical WACC by 10–30×" />
        <MetricCard label="Payback Period" rawValue={result.paybackWeeks} formatter={fmtWks} explanation="Weeks until cumulative cash flows turn positive" colorClass="border-orange-500" benchmark="Xemelgo avg: 18–24 weeks" />
        <MetricCard label="Net Annual Value" rawValue={result.netAnnualValue} formatter={fmt$} explanation="Annual savings minus annual platform cost" colorClass="border-teal-500" />
      </div>

      {/* Fix 8: Demoted Annual SaaS ROI card */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-sm border-l-4 border-indigo-200 p-4 max-w-xs">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Annual SaaS ROI</p>
          <p className="text-xl font-bold text-gray-600">{fmtPct(result.saasRoi)}</p>
          <p className="text-xs text-gray-400 mt-1">Net Annual Value ÷ Annual Platform Fee — dollars recovered per dollar spent on software, before hardware costs.</p>
        </div>
      </div>

      <SavingsBarChart result={result} />

      {/* Fix 10: Ramp-up callout */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl px-5 py-4 mb-6">
        <p className="text-sm text-amber-800 leading-relaxed">
          <span className="font-semibold">Year 1 reflects a 4-month ramp-up period</span> as your team gets up to speed with the platform. Savings reach full run rate from Month 4 onward — consistent with what Xemelgo customers experience during standard deployment.
        </p>
      </div>

      {/* Fix 9: Teaser copy before Next */}
      <p className="text-sm text-gray-500 text-center mb-4">
        Next: get your full personalized report — includes a line-by-line breakdown by use case, all your inputs saved, and a 5-year cash flow table formatted for your finance team.
      </p>

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
