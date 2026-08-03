import React from 'react';
import xemelgoLogo from '../assets/xemelgo-logo.png';
import { groupUseCaseTotalsBySolution, getRampFactor } from '../utils/calculations';
import { fmt$, fmtPct, fmtWks } from '../utils/format';

function buildCumulativeData(fin, totalGrossAnnual) {
  const rawCapex = (Number(fin.hardwareCapex) || 0) + (Number(fin.setupCapex) || 0);
  const monthlyFee = (Number(fin.annualPlatformFee) || 0) / 12;
  const totalCapex = rawCapex * (1 + fin.contingencyRate);
  const monthlyBase = totalGrossAnnual / 12;

  const netPosition = [-totalCapex];
  for (let m = 1; m <= 60; m++) {
    const mSavings = monthlyBase * getRampFactor(m);
    netPosition.push(netPosition[m - 1] + mSavings - monthlyFee);
  }

  let breakEvenMonth = null;
  for (let m = 1; m <= 60; m++) {
    if (netPosition[m - 1] < 0 && netPosition[m] >= 0) { breakEvenMonth = m; break; }
  }

  return { netPosition, breakEvenMonth };
}

function MilestoneOutlook({ fin, totalGrossAnnual }) {
  const { netPosition, breakEvenMonth } = buildCumulativeData(fin, totalGrossAnnual);

  const chartPoints = [0, 12, 24, 36, 48, 60].map((m) => netPosition[m]);
  const yMin = Math.min(...chartPoints, 0);
  const yMax = Math.max(...chartPoints, 0);
  const range = yMax - yMin || 1;

  const SVG_W = 700, SVG_H = 130;
  const PAD_L = 8, PAD_R = 8, PAD_T = 12, PAD_B = 8;
  const cw = SVG_W - PAD_L - PAD_R;
  const ch = SVG_H - PAD_T - PAD_B;

  const px = (i) => PAD_L + (i / 5) * cw;
  const py = (v) => PAD_T + ch - ((v - yMin) / range) * ch;
  const pathD = chartPoints.map((v, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)},${py(v).toFixed(1)}`).join(' ');
  const zero_y = py(0);

  function fmtShort(v) {
    if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
    if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
    return `$${v.toFixed(0)}`;
  }

  const breakEvenWeeks = breakEvenMonth != null ? Math.round(breakEvenMonth * (52 / 12)) : null;

  const milestones = [
    { label: 'Year 1', value: netPosition[12], emphasis: false },
    { label: 'Year 3', value: netPosition[36], emphasis: false },
    { label: 'Year 5', value: netPosition[60], emphasis: true },
  ];

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
        {milestones.map(({ label, value, emphasis }) => (
          <div key={label} style={{
            borderRadius: 12,
            padding: 16,
            borderLeft: `4px solid ${emphasis ? '#1e40af' : '#93c5fd'}`,
            background: emphasis ? '#2563eb' : '#ffffff',
            boxShadow: emphasis ? '0 4px 12px rgba(0,0,0,0.15)' : '0 1px 4px rgba(0,0,0,0.08)',
          }}>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4, color: emphasis ? '#bfdbfe' : '#6b7280' }}>{label}</p>
            <p style={{ fontWeight: 700, fontSize: emphasis ? 22 : 18, color: emphasis ? '#ffffff' : '#111827' }}>{fmtShort(value)}</p>
            <p style={{ fontSize: 11, marginTop: 4, color: emphasis ? '#bfdbfe' : '#9ca3af' }}>Net position</p>
          </div>
        ))}
      </div>

      <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', overflow: 'visible', height: SVG_H }}>
        {zero_y >= PAD_T && zero_y <= PAD_T + ch && (
          <line x1={PAD_L} y1={zero_y} x2={SVG_W - PAD_R} y2={zero_y} stroke="#e5e7eb" strokeWidth="1" />
        )}
        <path d={pathD} fill="none" stroke="#004FDB" strokeWidth="2.5" strokeLinejoin="round" />
        {chartPoints.map((v, i) => (
          <circle key={i} cx={px(i)} cy={py(v)} r="4" fill={v >= 0 ? '#004FDB' : '#9ca3af'} />
        ))}
      </svg>

      <p style={{ fontSize: 11, color: '#9ca3af', textAlign: 'center', marginTop: 8 }}>
        {breakEvenWeeks != null
          ? `Break-even at week ${breakEvenWeeks} — net position turns positive and grows from there.`
          : 'Net position over 5 years.'}
      </p>
    </div>
  );
}

export default function PrintableReport({ ops, useCases, fin, result, customCategories }) {
  const hasInvestment = fin.hardwareCapex !== 0 || fin.setupCapex !== 0 || fin.annualPlatformFee !== 0;
  const { buckets } = groupUseCaseTotalsBySolution(useCases, ops, customCategories, fin);

  const roiValue = hasInvestment ? result.fiveYrRoi - 1 : null;
  const laborBucket = result.buckets.find((b) => b.name === 'Labor Efficiency');
  const totalHoursSaved = laborBucket?.totalHoursSaved ?? 0;
  const irrDisplay = !hasInvestment ? '—' : result.irrAnnual > 3.0 ? '>300%' : fmtPct(result.irrAnnual);

  const metrics = [
    { label: '5-Year ROI',         value: hasInvestment ? fmtPct(roiValue) : '—',            caption: 'Total return over 5 years',             border: '#3b82f6' },
    { label: '5-Year NPV',         value: hasInvestment ? fmt$(result.npv) : '—',             caption: 'Net present value at your WACC',        border: '#22c55e' },
    { label: 'IRR (Annual)',        value: irrDisplay,                                          caption: 'Internal rate of return',               border: '#a855f7' },
    { label: 'Payback Period',      value: hasInvestment ? fmtWks(result.paybackWeeks) : '—', caption: 'Weeks to recover investment',            border: '#f97316' },
    { label: 'Annual SaaS ROI',    value: hasInvestment ? fmtPct(result.saasRoi) : '—',       caption: 'Return per dollar of platform fee',     border: '#6366f1' },
    { label: 'Annual Hours Saved', value: totalHoursSaved > 0 ? `${Math.round(totalHoursSaved).toLocaleString()} hrs` : '—', caption: 'Labor hours returned each year', border: '#14b8a6' },
  ];

  const s = {
    root: { width: 800, background: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', color: '#111827', padding: 40 },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid #e5e7eb' },
    companyBlock: { textAlign: 'right' },
    heroBox: { background: 'linear-gradient(to right, #1d4ed8, #2563eb)', borderRadius: 16, padding: '32px 28px', marginBottom: 20, color: '#ffffff' },
    heroLabel: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#bfdbfe', marginBottom: 8 },
    heroValue: { fontSize: 44, fontWeight: 700, marginBottom: 8 },
    heroSub: { fontSize: 13, color: '#bfdbfe', lineHeight: 1.5 },
    metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 24 },
    metricCard: (border) => ({ background: '#ffffff', borderRadius: 12, padding: '12px 14px', borderLeft: `4px solid ${border}`, boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }),
    metricLabel: { fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: 4 },
    metricValue: { fontSize: 16, fontWeight: 700, color: '#111827' },
    metricCaption: { fontSize: 10, color: '#9ca3af', marginTop: 3 },
    panel: { background: '#ffffff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' },
    panelTitle: { fontSize: 14, fontWeight: 600, color: '#1f2937', marginBottom: 16 },
    table: { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
    th: { textAlign: 'left', padding: '6px 8px', fontWeight: 600, color: '#4b5563', borderBottom: '1px solid #e5e7eb' },
    thR: { textAlign: 'right', padding: '6px 8px', fontWeight: 600, color: '#4b5563', borderBottom: '1px solid #e5e7eb' },
    td: { padding: '7px 8px 7px 16px', color: '#374151', borderBottom: '1px solid #f3f4f6' },
    tdR: { padding: '7px 8px', textAlign: 'right', color: '#374151', borderBottom: '1px solid #f3f4f6' },
    subtotalRow: { background: '#f9fafb' },
    subtotalTd: { padding: '5px 8px 5px 16px', fontSize: 11, fontWeight: 600, color: '#6b7280' },
    subtotalTdR: { padding: '5px 8px', fontSize: 11, fontWeight: 600, color: '#6b7280', textAlign: 'right' },
    totalRow: { borderTop: '2px solid #d1d5db' },
    totalTd: { padding: '8px 8px', fontWeight: 700, color: '#111827' },
    totalTdR: { padding: '8px 8px', fontWeight: 700, color: '#111827', textAlign: 'right' },
    disclaimer: { marginTop: 24, fontSize: 10, color: '#9ca3af', textAlign: 'center', lineHeight: 1.5 },
  };

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <img src={xemelgoLogo} alt="Xemelgo" style={{ height: 32, width: 'auto' }} />
        <div style={s.companyBlock}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{ops.companyName || 'Your Facility'}</p>
          {ops.projectTitle && <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{ops.projectTitle}</p>}
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>ROI Analysis Report</p>
        </div>
      </div>

      {/* Hero */}
      <div style={s.heroBox}>
        <p style={s.heroLabel}>{hasInvestment ? 'Net Annual Value' : 'Total Estimated Annual Savings'}</p>
        <p style={s.heroValue}>{hasInvestment ? fmt$(result.netAnnualValue) : fmt$(result.totalGrossAnnual)}</p>
        {hasInvestment && (
          <p style={s.heroSub}>
            At these inputs, <strong style={{ color: '#ffffff' }}>{ops.companyName || 'your facility'}</strong> recovers its full investment in{' '}
            <strong style={{ color: '#ffffff' }}>{fmtWks(result.paybackWeeks)}</strong> and generates{' '}
            <strong style={{ color: '#ffffff' }}>{fmt$(result.npv)}</strong> in net value over 5 years.
          </p>
        )}
      </div>

      {/* Metric cards */}
      <div style={s.metricsGrid}>
        {metrics.map((m) => (
          <div key={m.label} style={s.metricCard(m.border)}>
            <p style={s.metricLabel}>{m.label}</p>
            <p style={s.metricValue}>{m.value}</p>
            <p style={s.metricCaption}>{m.caption}</p>
          </div>
        ))}
      </div>

      {/* Savings summary */}
      <div style={s.panel}>
        <p style={s.panelTitle}>Savings Summary — By Solution</p>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Solution / Use Case</th>
              <th style={s.thR}>Annual Value</th>
            </tr>
          </thead>
          <tbody>
            {buckets.map((bucket) =>
              bucket.lineItems.length > 0 ? (
                <React.Fragment key={bucket.name}>
                  {bucket.lineItems.map((li) => (
                    <tr key={li.key}>
                      <td style={s.td}>{li.name}</td>
                      <td style={s.tdR}>{fmt$(li.annualValue)}</td>
                    </tr>
                  ))}
                  <tr style={s.subtotalRow}>
                    <td style={s.subtotalTd}>{bucket.name} subtotal</td>
                    <td style={s.subtotalTdR}>{fmt$(bucket.subtotal)}</td>
                  </tr>
                </React.Fragment>
              ) : null
            )}
            <tr style={s.totalRow}>
              <td style={s.totalTd}>Total Gross Annual</td>
              <td style={{ ...s.totalTdR }}>{fmt$(result.totalGrossAnnual)}</td>
            </tr>
            {result.annualSaasFee > 0 && (
              <tr>
                <td style={{ ...s.td, color: '#6b7280' }}>Annual Platform Cost</td>
                <td style={{ ...s.tdR, color: '#dc2626' }}>({fmt$(result.annualSaasFee)})</td>
              </tr>
            )}
            {result.annualSaasFee > 0 && (
              <tr style={{ borderTop: '2px solid #9ca3af' }}>
                <td style={{ ...s.totalTd, color: '#1d4ed8' }}>Net Annual Value</td>
                <td style={{ ...s.totalTdR, color: '#1d4ed8', fontSize: 15 }}>{fmt$(result.netAnnualValue)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 5-Year Outlook */}
      <div style={s.panel}>
        <p style={s.panelTitle}>5-Year Cumulative Outlook</p>
        <MilestoneOutlook fin={fin} totalGrossAnnual={result.totalGrossAnnual} />
      </div>

      {/* Disclaimer */}
      <p style={s.disclaimer}>
        These figures are estimates based on inputs provided during this session. Actual results will vary based on your specific implementation and operational factors.
      </p>
    </div>
  );
}
