import React from 'react';
import xemelgoLogo from '../assets/xemelgo-logo.png';
import { groupUseCaseTotalsBySolution, getRampFactor, SOLUTION_ORDER, getSolutionForUcKey } from '../utils/calculations';
import { fmt$, fmtPct, fmtWks } from '../utils/format';
import { UC_NAMES } from '../utils/useCaseNames';
import { getSolutionColor } from '../utils/solutionColors';

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

const SKIP_KEYS = new Set(['key', 'enabled', 'customDrivers', 'roleRows', 'justification',
  'driver1Justification', 'driver2Justification', 'reviewed', 'id']);

const PCT_FIELDS = new Set(['reductionPct', 'contingencyRate', 'wacc']);

function toLabel(key) {
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase()).trim();
}

function formatValue(v, key = '') {
  if (PCT_FIELDS.has(key)) return (Number(v) * 100).toFixed(1) + '%';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (v === '' || v === null || v === undefined) return '—';
  return String(v);
}

function FieldGrid3Col({ obj }) {
  const entries = Object.entries(obj || {}).filter(([k]) => !SKIP_KEYS.has(k));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '5px 20px', marginTop: 14, marginBottom: 22 }}>
      {entries.map(([k, v]) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '5px 0', borderBottom: '1px solid #f3f4f6' }}>
          <span style={{ color: '#6b7280' }}>{toLabel(k)}</span>
          <span style={{ color: '#111827', fontWeight: 600 }}>{formatValue(v, k)}</span>
        </div>
      ))}
    </div>
  );
}

function UcCard({ ucKey, uc, color }) {
  const displayName = UC_NAMES[ucKey.split('__')[0]] || ucKey;
  const roleRows = uc.roleRows || [];
  const customDrivers = uc.customDrivers || [];
  const justification = uc.justification || uc.driver1Justification || '';
  const rawFields = Object.entries(uc).filter(([k]) => !SKIP_KEYS.has(k));

  return (
    <div data-keep-together="true" style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '12px 14px', borderTop: `3px solid ${color.border}` }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#111827', marginBottom: 6 }}>{displayName}</p>
      {rawFields.map(([k, v]) => (
        <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, padding: '3px 0', color: '#4b5563' }}>
          <span>{toLabel(k)}</span>
          <span style={{ color: '#111827', fontWeight: 600 }}>{formatValue(v, k)}</span>
        </div>
      ))}
      {roleRows.length > 0 && roleRows.map((row, i) => (
        <div key={i} style={{ fontSize: 10.5, padding: '3px 0', color: '#4b5563' }}>
          Role: {row.customRoleName || row.role} · {row.headcount} · {row.hoursLostPerDay} hrs/day · ${row.burdenedRate}/hr
        </div>
      ))}
      {customDrivers.length > 0 && customDrivers.map((d, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, padding: '3px 0', color: '#4b5563' }}>
          <span>{d.label || d.name || 'Custom Driver'}</span>
          {d.annualValue !== undefined && <span style={{ color: '#111827', fontWeight: 600 }}>{fmt$(Number(d.annualValue))}</span>}
        </div>
      ))}
      {justification && (
        <p style={{ fontSize: 9.5, color: '#9ca3af', fontStyle: 'italic', marginTop: 6, paddingTop: 6, borderTop: '1px dashed #e5e7eb' }}>
          "{justification}"
        </p>
      )}
    </div>
  );
}

export default function PrintableReport({ ops, useCases, fin, result, customCategories, contactInfo = {} }) {
  const hasInvestment = fin.hardwareCapex !== 0 || fin.setupCapex !== 0 || fin.annualPlatformFee !== 0;
  const { buckets } = groupUseCaseTotalsBySolution(useCases, ops, customCategories, fin);
  const preparedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const firstName = (contactInfo.firstName || '').trim();
  const lastName  = (contactInfo.lastName  || '').trim();
  const fullName  = [firstName, lastName].filter(Boolean).join(' ');
  const email     = (contactInfo.email || '').trim();
  const showContactBlock = Boolean(fullName) || Boolean(email);
  const activeCount = Object.values(useCases).filter(uc => uc?.enabled).length;

  const roiValue = hasInvestment ? result.fiveYrRoi - 1 : null;
  const laborBucket = result.buckets.find((b) => b.name === 'Labor Efficiency');
  const totalHoursSaved = laborBucket?.totalHoursSaved ?? 0;
  const irrDisplay = !hasInvestment ? '—' : result.irrAnnual > 3.0 ? '>300%' : fmtPct(result.irrAnnual);

  const metrics = [
    { label: '5-Year ROI',         value: hasInvestment ? fmtPct(roiValue) : '—',            caption: 'Total return over 5 years',          border: '#185FA5' },
    { label: '5-Year NPV',         value: hasInvestment ? fmt$(result.npv) : '—',             caption: 'Net present value at your WACC',     border: '#0F6E56' },
    { label: 'IRR (Annual)',        value: irrDisplay,                                          caption: 'Internal rate of return',            border: '#534AB7' },
    { label: 'Payback Period',      value: hasInvestment ? fmtWks(result.paybackWeeks) : '—', caption: 'Weeks to recover investment',         border: '#854F0B' },
    { label: 'Annual SaaS ROI',    value: hasInvestment ? fmtPct(result.saasRoi) : '—',       caption: 'Return per dollar of platform fee',  border: '#534AB7' },
    { label: 'Annual Hours Saved', value: totalHoursSaved > 0 ? `${Math.round(totalHoursSaved).toLocaleString()} hrs` : '—', caption: 'Labor hours returned each year', border: '#0F6E56' },
  ];

  const s = {
    root: { width: 800, background: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', color: '#111827', padding: 40 },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, paddingBottom: 20, borderBottom: '1px solid #e5e7eb' },
    companyBlock: { textAlign: 'right' },
    heroBox: { background: 'linear-gradient(135deg, #1a4fb0, #2f6fe0)', borderRadius: 14, padding: '32px 28px', marginBottom: 20, color: '#ffffff' },
    heroLabel: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#bfdbfe', marginBottom: 8 },
    heroValue: { fontSize: 44, fontWeight: 700, marginBottom: 8 },
    heroSub: { fontSize: 13, color: '#bfdbfe', lineHeight: 1.5 },
    metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, marginBottom: 24 },
    metricCard: (border) => ({ background: '#fafbfc', borderRadius: 10, padding: '12px 10px', borderTop: `3px solid ${border}` }),
    metricLabel: { fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#6b7280', marginBottom: 4 },
    metricValue: { fontSize: 17, fontWeight: 700, color: '#111827' },
    metricCaption: { fontSize: 9, color: '#9ca3af', marginTop: 3 },
    panel: { background: '#ffffff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' },
    panelTitle: { fontSize: 14, fontWeight: 600, color: '#1f2937', marginBottom: 16 },
    disclaimer: { marginTop: 24, fontSize: 10, color: '#9ca3af', textAlign: 'center', lineHeight: 1.5 },
  };

  const activeUcEntries = Object.entries(useCases).filter(([, uc]) => uc?.enabled !== false && uc?.enabled);

  return (
    <div style={s.root}>
      {/* Header */}
      <div data-keep-together="true" style={s.header}>
        <img src={xemelgoLogo} alt="Xemelgo" style={{ height: 32, width: 'auto' }} />
        <div style={s.companyBlock}>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#111827' }}>{ops.companyName || 'Your Facility'}</p>
          <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>ROI Analysis Report</p>
          {ops.projectTitle && <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{ops.projectTitle}</p>}
          {showContactBlock && (
            <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid #f0f0f0' }}>
              <p style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: 2 }}>
                Prepared for
              </p>
              {fullName && (
                <p style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{fullName}</p>
              )}
              {email && (
                <p style={{ fontSize: 11, color: '#6b7280', marginTop: 1 }}>{email}</p>
              )}
            </div>
          )}
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Prepared {preparedDate}</p>
        </div>
      </div>

      {/* Hero */}
      <div data-keep-together="true" style={s.heroBox}>
        <p style={s.heroLabel}>{hasInvestment ? 'Net Annual Value' : 'Total Estimated Annual Savings'}</p>
        <p style={{ display: 'inline-block', marginTop: 10, fontSize: 11, background: 'rgba(255,255,255,0.16)', padding: '4px 10px', borderRadius: 100, color: '#eaf1ff' }}>
          Validated estimate · {activeCount} use case{activeCount === 1 ? '' : 's'} active
        </p>
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
      <div data-keep-together="true" style={s.metricsGrid}>
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
        <p style={{ ...s.panelTitle, color: '#0F2A4A' }}>Savings summary by solution</p>
        {buckets.filter((b) => b.lineItems.length > 0).map((bucket) => {
          const color = getSolutionColor(bucket.name);
          return (
            <div key={bucket.name} data-keep-together="true" style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 14px', borderLeft: `4px solid ${color.border}`, background: color.tint }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: color.text }}>{bucket.name}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: color.text }}>{fmt$(bucket.subtotal)}</span>
              </div>
              {bucket.lineItems.map((li) => (
                <div key={li.key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 14px 6px 18px', fontSize: 11.5, color: '#374151', borderTop: '1px solid #f3f4f6' }}>
                  <span>{li.name}</span>
                  <span style={{ color: '#111827', fontWeight: 500 }}>{fmt$(li.annualValue)}</span>
                </div>
              ))}
            </div>
          );
        })}
        <div data-keep-together="true" style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 12.5, padding: '8px 14px' }}>
            <span>Total Gross Annual</span>
            <span>{fmt$(result.totalGrossAnnual)}</span>
          </div>
          {result.annualSaasFee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderTop: '1px solid #f3f4f6', fontSize: 12.5 }}>
              <span style={{ color: '#6b7280' }}>Annual Platform Cost</span>
              <span style={{ color: '#dc2626' }}>({fmt$(result.annualSaasFee)})</span>
            </div>
          )}
          {result.annualSaasFee > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', borderTop: '1px solid #f3f4f6', color: '#1d4ed8', fontWeight: 700 }}>
              <span>Net Annual Value</span>
              <span style={{ fontSize: 14 }}>{fmt$(result.netAnnualValue)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 5-Year Outlook */}
      <div style={s.panel}>
        <p style={s.panelTitle}>5-Year Cumulative Outlook</p>
        <MilestoneOutlook fin={fin} totalGrossAnnual={result.totalGrossAnnual} />
      </div>

      {/* Appendix */}
      <div>
        <div style={{ borderBottom: '2px solid #0F2A4A', paddingBottom: 12, marginTop: 24 }}>
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#185FA5', fontWeight: 700 }}>Report inputs</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#0F2A4A', marginTop: 4 }}>Appendix A — detailed assumptions</p>
          <p style={{ fontSize: 11.5, color: '#6b7280', marginTop: 4 }}>Every input used to calculate the figures on the preceding pages.</p>
        </div>

        {/* Operation Profile */}
        <p style={{ fontSize: 14, fontWeight: 700, color: '#0F2A4A', marginTop: 20 }}>Operation profile</p>
        <FieldGrid3Col obj={ops} />

        {/* Use Case Assumptions grouped by solution */}
        {(() => {
          const knownSolutions = [...SOLUTION_ORDER, 'Custom'];
          const activeByKey = activeUcEntries;
          const unresolvedEntries = activeByKey.filter(([key]) => !knownSolutions.includes(getSolutionForUcKey(key)));
          const groups = [
            ...[...SOLUTION_ORDER, 'Custom'].map((solName) => ({
              solName,
              entries: activeByKey.filter(([k]) => getSolutionForUcKey(k) === (solName === 'Custom' ? null : solName)),
            })),
            ...(unresolvedEntries.length > 0 ? [{ solName: 'Other', entries: unresolvedEntries }] : []),
          ];
          return groups.filter((g) => g.entries.length > 0).map(({ solName, entries }) => {
            const color = getSolutionColor(solName);
            return (
              <React.Fragment key={solName}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color.border }} />
                  <span style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#374151' }}>{solName}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {entries.map(([k, uc]) => (
                    <UcCard key={k} ucKey={k} uc={uc} color={color} />
                  ))}
                </div>
              </React.Fragment>
            );
          });
        })()}

        {/* Financial Assumptions */}
        <p style={{ fontSize: 14, fontWeight: 700, color: '#0F2A4A', marginTop: 22 }}>Financial assumptions</p>
        <div style={{ marginTop: 8, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          {Object.entries(fin).filter(([k]) => !SKIP_KEYS.has(k)).map(([k, v], i) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', fontSize: 11.5, ...(i > 0 ? { borderTop: '1px solid #f3f4f6' } : {}) }}>
              <span style={{ color: '#6b7280' }}>{toLabel(k)}</span>
              <span style={{ color: '#111827', fontWeight: 600 }}>{formatValue(v, k)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p style={s.disclaimer}>
        These figures are estimates based on inputs provided during this session. Actual results will vary based on your specific implementation and operational factors.
      </p>
    </div>
  );
}
