import React, { useState } from 'react';
import { calcFinancials } from '../../utils/calculations';
import { fmt$, fmtPct, fmtWks } from '../../utils/format';
import Tooltip from '../Tooltip';

function CumulativeChart({ fin, totalGrossAnnual }) {
  const W = 600, H = 300;
  const PADDING = { top: 30, right: 30, bottom: 40, left: 70 };

  const capex = Number(fin.capex) || 0;
  const monthlyFee = Number(fin.monthlyPlatformFee) || 0;
  const totalCapex = capex * (1 + fin.contingencyRate);
  const monthlyBase = totalGrossAnnual / 12;
  const ramp = [0, 0.25, 0.50, 0.75, 1.0];

  const cumSavings = [0];
  const netPosition = [-totalCapex];

  for (let m = 1; m <= 60; m++) {
    const mSavings = monthlyBase * (m <= 4 ? ramp[m] : 1.0);
    cumSavings.push(cumSavings[m - 1] + mSavings);
    netPosition.push(netPosition[m - 1] + mSavings - monthlyFee);
  }

  let breakEvenMonth = null;
  for (let m = 1; m <= 60; m++) {
    if (netPosition[m - 1] < 0 && netPosition[m] >= 0) {
      breakEvenMonth = m;
      break;
    }
  }

  const yMin = Math.min(...netPosition, 0);
  const yMax = Math.max(...cumSavings, 0);
  const chartW = W - PADDING.left - PADDING.right;
  const chartH = H - PADDING.top - PADDING.bottom;

  const xScale = (m) => PADDING.left + (m / 60) * chartW;
  const yScale = (v) => PADDING.top + chartH - ((v - yMin) / (yMax - yMin || 1)) * chartH;

  const savingsPath = cumSavings.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(' ');
  const netPath = netPosition.map((v, i) => `${i === 0 ? 'M' : 'L'}${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(' ');

  const yTicks = [0, 1, 2, 3, 4].map((i) => yMin + (i / 4) * (yMax - yMin));
  const xLabels = [12, 24, 36, 48, 60];
  const zero_y = yScale(0);

  function fmtAxis(v) {
    if (Math.abs(v) >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
    if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 300 }}>
      {xLabels.map((m) => (
        <line key={m} x1={xScale(m)} y1={PADDING.top} x2={xScale(m)} y2={H - PADDING.bottom} stroke="#EDF5FF" strokeWidth="1" />
      ))}
      <line x1={PADDING.left} y1={zero_y} x2={W - PADDING.right} y2={zero_y} stroke="#999999" strokeWidth="1" />
      <path d={netPath} fill="none" stroke="#999999" strokeWidth="2" strokeDasharray="6,4" />
      <path d={savingsPath} fill="none" stroke="#004FDB" strokeWidth="2" />
      {breakEvenMonth != null && (
        <>
          <line x1={xScale(breakEvenMonth)} y1={PADDING.top} x2={xScale(breakEvenMonth)} y2={H - PADDING.bottom} stroke="#0D8CFF" strokeWidth="1.5" strokeDasharray="4,3" />
          <text x={xScale(breakEvenMonth) + 4} y={PADDING.top + 14} fill="#0D8CFF" fontSize="10" fontWeight="600">
            Breakeven — Wk {Math.round(breakEvenMonth * (52 / 12))}
          </text>
        </>
      )}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={PADDING.left - 4} y1={yScale(v)} x2={PADDING.left} y2={yScale(v)} stroke="#999" strokeWidth="1" />
          <text x={PADDING.left - 6} y={yScale(v) + 4} textAnchor="end" fill="#999" fontSize="10">{fmtAxis(v)}</text>
        </g>
      ))}
      {xLabels.map((m, i) => (
        <text key={m} x={xScale(m)} y={H - PADDING.bottom + 16} textAnchor="middle" fill="#999" fontSize="10">Yr {i + 1}</text>
      ))}
      {/* Legend — top-right to avoid overlapping breakeven label */}
      <g transform={`translate(${W - PADDING.right - 193}, ${PADDING.top + 10})`}>
        <line x1="0" y1="6" x2="20" y2="6" stroke="#004FDB" strokeWidth="2" />
        <text x="24" y="10" fill="#555" fontSize="10">Cumulative Savings</text>
        <line x1="130" y1="6" x2="150" y2="6" stroke="#999" strokeWidth="2" strokeDasharray="5,3" />
        <text x="154" y="10" fill="#555" fontSize="10">Net Position</text>
      </g>
    </svg>
  );
}

function SecondaryMetricCard({ label, value, caption, colorClass, badge }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-4 border-l-4 ${colorClass}`}>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-400 mt-1">{caption}</p>
      {badge && (
        <p className="mt-1.5 text-xs text-teal-600 font-medium bg-teal-50 rounded px-1.5 py-0.5 inline-block">{badge}</p>
      )}
    </div>
  );
}

export default function Step3_FinancialResults({ ops, useCases, fin, setFin, customCategories, onNext, onBack }) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const set = (key) => (val) => setFin((prev) => ({ ...prev, [key]: val }));
  const result = calcFinancials(ops, useCases, fin, customCategories);

  const inputsReady = fin.capex !== '' && fin.monthlyPlatformFee !== '';

  const roiValue = inputsReady ? result.fiveYrRoi - 1 : null;
  const paybackValue = inputsReady ? result.paybackWeeks : null;
  const roiBadge = roiValue != null && roiValue >= 2.0 ? 'Xemelgo avg: 200–400%' : null;
  const paybackBadge = paybackValue != null && paybackValue <= 24 ? 'Xemelgo avg: 18–24 wks' : null;
  const irrDisplay = !inputsReady ? '—' : result.irrAnnual > 3.0 ? '>300%' : fmtPct(result.irrAnnual);

  const secondaryMetrics = [
    { label: '5-Year ROI',      value: inputsReady ? fmtPct(roiValue) : '—',              caption: 'Total return over 5 years',           colorClass: 'border-blue-500',   badge: roiBadge },
    { label: '5-Year NPV',      value: inputsReady ? fmt$(result.npv) : '—',              caption: 'Net present value at your WACC',      colorClass: 'border-green-500' },
    { label: 'IRR (Annual)',    value: irrDisplay,                                          caption: 'Internal rate of return',             colorClass: 'border-purple-500' },
    { label: 'Payback Period',  value: inputsReady ? fmtWks(result.paybackWeeks) : '—',   caption: 'Weeks to recover investment',         colorClass: 'border-orange-500', badge: paybackBadge },
    { label: 'Annual SaaS ROI', value: inputsReady ? fmtPct(result.saasRoi) : '—',        caption: 'Return per dollar of platform fee',   colorClass: 'border-indigo-400' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Your ROI at a glance</h2>
      <p className="text-sm text-gray-500 mb-6">Based on your inputs, here's what Xemelgo is worth to your facility.</p>

      {/* Hero: Net Annual Value */}
      <div className="bg-gradient-to-r from-blue-700 to-blue-600 rounded-2xl shadow-lg px-6 py-8 mb-5 text-white">
        <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-2">Net Annual Value</p>
        {inputsReady ? (
          <>
            <p className="text-5xl font-bold mb-3">{fmt$(result.netAnnualValue)}</p>
            <p className="text-sm text-blue-100 leading-relaxed">
              At these inputs,{' '}
              <strong className="text-white">{ops.companyName || 'your facility'}</strong>{' '}
              recovers its full investment in{' '}
              <strong className="text-white">{fmtWks(result.paybackWeeks)}</strong>{' '}
              and generates{' '}
              <strong className="text-white">{fmt$(result.npv)}</strong>{' '}
              in net value over 5 years.
            </p>
          </>
        ) : (
          <>
            <p className="text-5xl font-bold mb-3 text-blue-300">—</p>
            <p className="text-sm text-blue-200">Enter CapEx and platform fee below to unlock your results.</p>
          </>
        )}
      </div>

      {/* 5 secondary metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {secondaryMetrics.map((m) => (
          <SecondaryMetricCard key={m.label} {...m} />
        ))}
      </div>

      {/* Investment inputs + Savings summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-base font-semibold text-gray-800 mb-4">Investment Inputs</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                CapEx (hardware, installation)
                <Tooltip content="Includes RFID hardware (readers, antennas, tags) and installation labor. Get the exact quote from your Xemelgo rep before entering this number.">
                  <span className="text-blue-400 cursor-help text-sm">ⓘ</span>
                </Tooltip>
              </label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-1">$</span>
                <input
                  type="number"
                  min={0}
                  value={fin.capex}
                  placeholder="Enter your quoted hardware and installation cost"
                  onChange={(e) => set('capex')(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Use the exact figure quoted by your Xemelgo rep. This is the number your finance team will need.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Xemelgo Monthly Platform Fee</label>
              <div className="flex items-center">
                <span className="text-gray-500 mr-1">$</span>
                <input
                  type="number"
                  min={0}
                  value={fin.monthlyPlatformFee}
                  placeholder="Enter your monthly platform fee"
                  onChange={(e) => set('monthlyPlatformFee')(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Use the exact fee confirmed with your Xemelgo rep. Actual pricing varies by deployment scope and modules selected.</p>
            </div>

            {/* Advanced assumptions */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced((v) => !v)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg
                  className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-90' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Customize assumptions
              </button>
              {showAdvanced && (
                <div className="mt-3 space-y-4 pl-4 border-l-2 border-gray-100">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                      Contingency Rate (%)
                      <Tooltip content="A buffer added to CapEx to cover unforeseen installation costs. Typical range is 0–5%.">
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
                    <p className="mt-1 text-xs text-gray-500">Buffer for unexpected installation costs. Typical range is 0–5%. Applied to CapEx.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total CapEx with Contingency</label>
                    <div className="bg-gray-50 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">
                      {fin.capex !== '' ? fmt$(result.totalCapex) : '—'}
                    </div>
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
              )}
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
                <td className={`text-right ${inputsReady ? 'text-red-600' : 'text-gray-400'}`}>
                  {inputsReady ? `(${fmt$(result.annualSaasFee)})` : '—'}
                </td>
              </tr>
              <tr className="border-t-2 border-gray-400 font-bold">
                <td className="py-2 pr-2 text-gray-900">Net Annual Value</td>
                <td className={`text-right text-base ${inputsReady ? 'text-blue-700' : 'text-gray-400'}`}>
                  {inputsReady ? fmt$(result.netAnnualValue) : '—'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 5-Year Cumulative Outlook Chart */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <h3 className="text-base font-semibold text-gray-800 mb-1">5-Year Cumulative Outlook</h3>
        <p className="text-xs text-gray-500 mb-4">Cumulative savings and net position over 5 years.</p>
        {!inputsReady ? (
          <div className="bg-gray-100 rounded-xl flex items-center justify-center" style={{ height: 300 }}>
            <p className="text-sm text-gray-400 text-center max-w-xs">
              Enter your CapEx and monthly platform fee above to see your 5-year cumulative outlook.
            </p>
          </div>
        ) : (
          <CumulativeChart fin={fin} totalGrossAnnual={result.totalGrossAnnual} />
        )}
      </div>

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
