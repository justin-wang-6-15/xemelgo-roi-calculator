import React, { useState } from 'react';
import { calcFinancials } from '../utils/calculations';
import { fmt$, fmtPct, fmtWks } from '../utils/format';
import MetricCard from './MetricCard';
import { generatePDF } from '../utils/generatePDF';
import { generateExcel } from '../utils/generateExcel';

export default function ThankYou({ ops, useCases, fin, contactInfo }) {
  const result = calcFinancials(ops, useCases, fin);
  const [pdfState, setPdfState] = useState('idle');
  const [xlsxState, setXlsxState] = useState('idle');

  async function handlePDF() {
    setPdfState('loading');
    try {
      await generatePDF(ops, useCases, fin, result);
      setPdfState('idle');
    } catch (e) {
      console.error(e);
      setPdfState('error');
    }
  }

  async function handleExcel() {
    setXlsxState('loading');
    try {
      await generateExcel(ops, useCases, fin, result);
      setXlsxState('idle');
    } catch (e) {
      console.error(e);
      setXlsxState('error');
    }
  }

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

      {/* Download section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Take your results with you</h3>
        <p className="text-sm text-gray-500 mb-4">Share with your finance team or leadership — choose your format below.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PDF Card */}
          <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="6" fill="#0B1028"/>
                <path d="M9 8h9l5 5v11a1 1 0 01-1 1H9a1 1 0 01-1-1V9a1 1 0 011-1z" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="1.2"/>
                <path d="M18 8v5h5" stroke="white" strokeWidth="1.2" strokeLinejoin="round"/>
                <path d="M11 17h10M11 20h7" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              <p className="font-bold text-gray-900">Executive Summary PDF</p>
            </div>
            <ul className="text-sm text-gray-500 space-y-1 mb-4 flex-1">
              <li>• Branded 1–2 page report with your logo</li>
              <li>• Headline metrics and savings breakdown</li>
              <li>• Your full input assumptions</li>
              <li>• Ready to share with leadership</li>
            </ul>
            <button
              onClick={handlePDF}
              disabled={pdfState === 'loading'}
              className="w-full text-white font-semibold py-2.5 rounded-lg transition-opacity disabled:opacity-60"
              style={{ backgroundColor: '#004FDB' }}
            >
              {pdfState === 'loading' ? 'Generating...' : 'Download PDF'}
            </button>
            {pdfState === 'error' && (
              <p className="mt-2 text-xs text-red-600">Download failed — please try again or contact support@xemelgo.com.</p>
            )}
          </div>
          {/* Excel Card */}
          <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100 flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <svg className="w-8 h-8 flex-shrink-0" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="6" fill="#217346"/>
                <path d="M7 9h18v14H7z" fill="white" fillOpacity="0.12" stroke="white" strokeWidth="1.2"/>
                <path d="M7 13h18M7 17h18M13 9v14" stroke="white" strokeWidth="1" strokeOpacity="0.6"/>
                <text x="9" y="21" fontSize="7" fill="white" fontWeight="bold" fontFamily="sans-serif">XLS</text>
              </svg>
              <p className="font-bold text-gray-900">Detailed Financial Model</p>
            </div>
            <ul className="text-sm text-gray-500 space-y-1 mb-4 flex-1">
              <li>• 2-sheet Excel workbook (.xlsx)</li>
              <li>• Yellow input cells for sensitivity analysis</li>
              <li>• 5-year cash flow model with live formulas</li>
              <li>• NPV, IRR, cumulative cash flow table</li>
            </ul>
            <button
              onClick={handleExcel}
              disabled={xlsxState === 'loading'}
              className="w-full text-white font-semibold py-2.5 rounded-lg transition-opacity disabled:opacity-60"
              style={{ backgroundColor: '#217346' }}
            >
              {xlsxState === 'loading' ? 'Generating...' : 'Download Excel'}
            </button>
            {xlsxState === 'error' && (
              <p className="mt-2 text-xs text-red-600">Download failed — please try again or contact support@xemelgo.com.</p>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-400 text-center mt-3">Both files include your company name and are generated from your exact inputs.</p>
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
      </div>
    </div>
  );
}
