import React from 'react';
import xemelgoLogo from '../assets/xemelgo-logo.png';
import { groupUseCaseTotalsBySolution, getRampFactor, SOLUTION_ORDER, getSolutionForUcKey, formatFrequency } from '../utils/calculations';
import { fmt$, fmtPct, fmtWks } from '../utils/format';
import { UC_NAMES } from '../utils/useCaseNames';
import { getSolutionColor } from '../utils/solutionColors';

// ─── Cumulative chart helpers ────────────────────────────────────────────────

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

function fmtShort(v) {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v.toFixed(0)}`;
}

function MilestoneOutlook({ fin, totalGrossAnnual }) {
  const { netPosition, breakEvenMonth } = buildCumulativeData(fin, totalGrossAnnual);

  const allMonths = Array.from({ length: 61 }, (_, i) => i);
  const yMin = Math.min(...netPosition, 0);
  const yMax = Math.max(...netPosition, 0);
  const range = yMax - yMin || 1;

  const SVG_W = 700, SVG_H = 150;
  const PAD_L = 8, PAD_R = 8, PAD_T = 16, PAD_B = 20;
  const cw = SVG_W - PAD_L - PAD_R;
  const ch = SVG_H - PAD_T - PAD_B;

  const px = (m) => PAD_L + (m / 60) * cw;
  const py = (v) => PAD_T + ch - ((v - yMin) / range) * ch;
  const zero_y = py(0);

  const linePts = allMonths.map((m) => `${px(m).toFixed(1)},${py(netPosition[m]).toFixed(1)}`).join(' ');

  // Build filled area path (trace line then back along baseline)
  const areaAbove = allMonths.filter((m) => netPosition[m] >= 0);
  const areaBelow = allMonths.filter((m) => netPosition[m] < 0);

  function segmentPath(months) {
    if (months.length === 0) return '';
    const pts = months.map((m) => `${px(m).toFixed(1)},${py(netPosition[m]).toFixed(1)}`);
    return `M${pts[0]} L${pts.slice(1).join(' L')} L${px(months[months.length - 1]).toFixed(1)},${zero_y.toFixed(1)} L${px(months[0]).toFixed(1)},${zero_y.toFixed(1)} Z`;
  }

  // Breakeven marker
  const beMonth = breakEvenMonth;
  const beWeeks = beMonth != null ? Math.round(beMonth * (52 / 12)) : null;
  const be_x = beMonth != null ? px(beMonth) : null;
  const be_y = beMonth != null ? py(0) : null;

  // Year dots at 0, 12, 24, 36, 48, 60
  const yearDots = [0, 12, 24, 36, 48, 60];

  const milestones = [
    { label: 'Year 1', value: netPosition[12], emphasis: false },
    { label: 'Year 3', value: netPosition[36], emphasis: false },
    { label: 'Year 5', value: netPosition[60], emphasis: true },
  ];

  return (
    <div>
      <p style={{ fontSize: 15, fontWeight: 700, color: '#0F2A4A', marginBottom: 4 }}>
        Value compounds every year it runs
      </p>
      <p style={{ fontSize: 11.5, color: '#6b7280', marginBottom: 16, lineHeight: 1.5 }}>
        The chart below shows cumulative net position month by month over five years, accounting for the ramp-up period and ongoing platform cost. Year 1, 3, and 5 are validated from your inputs; Year 2 and 4 are interpolated.
      </p>

      <div data-keep-together="true" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
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

      <div data-keep-together="true">
        <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ width: '100%', overflow: 'visible', height: SVG_H }}>
          {/* Zero baseline */}
          {zero_y >= PAD_T && zero_y <= PAD_T + ch && (
            <line x1={PAD_L} y1={zero_y} x2={SVG_W - PAD_R} y2={zero_y} stroke="#d1d5db" strokeWidth="1" />
          )}

          {/* Pre-breakeven amber wedge */}
          {areaBelow.length > 0 && (
            <path d={segmentPath(areaBelow)} fill="#FAC775" fillOpacity="0.55" />
          )}

          {/* Post-breakeven blue area */}
          {areaAbove.length > 0 && (
            <path d={segmentPath(areaAbove)} fill="#378ADD" fillOpacity="0.2" />
          )}

          {/* Main line */}
          <polyline points={linePts} fill="none" stroke="#004FDB" strokeWidth="2.5" strokeLinejoin="round" />

          {/* Breakeven dashed guide + marker */}
          {be_x != null && be_y != null && (
            <>
              <line x1={be_x} y1={PAD_T} x2={be_x} y2={PAD_T + ch} stroke="#f59e0b" strokeWidth="1.2" strokeDasharray="4,3" />
              <circle cx={be_x} cy={be_y} r="5" fill="#f59e0b" />
              <text x={be_x + 7} y={be_y - 6} fontSize="9" fill="#92400e" fontWeight="600">
                Wk {beWeeks} / break even
              </text>
            </>
          )}

          {/* Year dots — differentiated by validation status */}
          {yearDots.map((m, i) => {
            const v = netPosition[m];
            const cx = px(m);
            const cy = py(v);
            if (i === 0) {
              // Year 0: small muted gray
              return <circle key={m} cx={cx} cy={cy} r="3" fill="#9ca3af" />;
            }
            if (i === 1 || i === 3 || i === 5) {
              // Year 1, 3, 5: validated — large solid blue
              return <circle key={m} cx={cx} cy={cy} r="4.5" fill="#004FDB" />;
            }
            // Year 2, 4: interpolated — hollow
            return <circle key={m} cx={cx} cy={cy} r="3.5" fill="#ffffff" stroke="#004FDB" strokeWidth="1.5" />;
          })}

          {/* X-axis labels */}
          {yearDots.map((m, i) => (
            <text key={m} x={px(m)} y={PAD_T + ch + 14} fontSize="9" fill="#9ca3af" textAnchor="middle">
              {i === 0 ? 'Now' : `Yr ${i}`}
            </text>
          ))}
        </svg>
      </div>

      {/* How-to-read block */}
      <div data-keep-together="true" style={{ marginTop: 14, padding: '10px 14px', background: '#f8fafc', borderRadius: 8, border: '1px solid #e5e7eb' }}>
        <p style={{ fontSize: 9.5, fontWeight: 700, color: '#374151', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>How to read this</p>
        <ul style={{ margin: 0, padding: '0 0 0 14px', listStyle: 'disc' }}>
          {[
            'Blue area — cumulative net savings above the investment line.',
            'Amber area — pre-breakeven period; the program is recovering its upfront cost.',
            beWeeks != null
              ? `Orange dot — break-even at week ${beWeeks}, where cumulative savings equal total investment.`
              : 'Break-even point not reached within the 5-year window at these inputs.',
            'Solid blue dots mark Year 1, 3, and 5 (validated from your inputs); hollow dots mark Year 2 and 4 (interpolated).',
          ].map((line, i) => (
            <li key={i} style={{ fontSize: 10, color: '#6b7280', lineHeight: 1.6 }}>{line}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Field manifest (compact stat line formatters) ───────────────────────────

const ROLE_LABELS = {
  materialHandler: 'Material Handler',
  planner: 'Planner',
  indirect: 'Indirect / Leadership',
  direct: 'Direct Employee',
};

const FIN_LABELS = {
  hardwareCapex: 'Hardware & Installation',
  setupCapex: 'Xemelgo Setup Cost',
  contingencyRate: 'Contingency Rate',
  annualPlatformFee: 'Annual Platform Fee',
  wacc: 'WACC',
};

const PCT_FIELDS = new Set(['reductionPct', 'contingencyRate', 'wacc']);

function fmtV(v, key = '') {
  if (PCT_FIELDS.has(key)) return `${(Number(v) * 100).toFixed(0)}%`;
  if (v === '' || v === null || v === undefined) return null;
  return String(v);
}

function joinStats(parts) {
  return parts.filter(Boolean).join(' · ');
}

// Returns a compact one-line string summarising the key inputs for a use case.
// Each entry covers every key in makeAllDisabledUseCases() for that base key.
const COMPACT_STATS = {
  cycleCount: (uc) => joinStats([
    `${uc.hoursPerSession} hrs/session`,
    formatFrequency(uc.cycleFrequencyValue, uc.cycleFrequencyUnit),
    `${uc.peoplePerSession} people`,
    `$${uc.burdenedRate}/hr`,
    `${fmtV(uc.reductionPct, 'reductionPct')} efficiency`,
  ]),
  audit: (uc) => joinStats([
    `${uc.people} people`,
    `${uc.daysPerAudit} days/audit`,
    `${uc.hoursPerDay} hrs/day`,
    formatFrequency(uc.auditFrequencyValue, uc.auditFrequencyUnit),
    `$${uc.burdenedRate}/hr`,
    uc.downtimeCostPerDay ? `$${uc.downtimeCostPerDay} downtime/day` : null,
    `${fmtV(uc.reductionPct, 'reductionPct')} reduction`,
  ]),
  shipReceiveVerification: (uc) => joinStats([
    `${uc.minutesSavedPerTransaction} min saved/transaction`,
    `${uc.transactionsPerDay} transactions/day`,
    `$${uc.burdenedRate}/hr`,
    `${fmtV(uc.reductionPct, 'reductionPct')} reduction`,
  ]),
  internalDelivery: (uc) => joinStats([
    `${uc.minutesPerTransfer} min/transfer`,
    `${uc.transfersPerDay} transfers/day`,
    `${uc.peoplePerTransfer} people`,
    `$${uc.burdenedRate}/hr`,
    `${fmtV(uc.reductionPct, 'reductionPct')} reduction`,
  ]),
  expiredProducts: (uc) => joinStats([
    `${uc.incidentsPerYear} incidents/yr`,
    `$${uc.costPerIncident}/incident`,
    `${fmtV(uc.reductionPct, 'reductionPct')} reduction`,
  ]),
  calibrationReminders: (uc) => joinStats([
    `${uc.failuresPerYear} failures/yr`,
    `$${uc.costPerFailure}/failure`,
    `${fmtV(uc.reductionPct, 'reductionPct')} reduction`,
  ]),
  geofencing: (uc) => joinStats([
    `${uc.incidentsPerYear} incidents/yr`,
    `$${uc.costPerIncident}/incident`,
    `${fmtV(uc.reductionPct, 'reductionPct')} reduction`,
  ]),
  fasterFulfillment: (uc) => joinStats([
    `${uc.currentCycleTime}h → ${uc.targetCycleTime}h cycle time`,
    `${uc.ordersPerMonth} orders/mo`,
    `$${uc.revenuePerOrder}/order`,
  ]),
  misShipReduction: (uc) => joinStats([
    `${uc.misShipsPerMonth} mis-ships/mo`,
    `$${uc.costPerMisShip}/mis-ship`,
    `${fmtV(uc.reductionPct, 'reductionPct')} reduction`,
  ]),
  dockTurnSpeed: (uc) => joinStats([
    `${uc.minutesSaved} min saved/transaction`,
    `${uc.transactionsPerDay} transactions/day`,
    `${uc.dockStaff} staff`,
    `$${uc.burdenedRate}/hr`,
    `${fmtV(uc.reductionPct, 'reductionPct')} reduction`,
  ]),
  goodsReceipt: (uc) => joinStats([
    `${uc.minutesSavedPerTransaction} min saved/transaction`,
    `${uc.transactionsPerDay} transactions/day`,
    `${uc.dockStaff} dock staff`,
    `$${uc.burdenedRate}/hr`,
    `${fmtV(uc.reductionPct, 'reductionPct')} reduction`,
  ]),
  automatedPackCount: (uc) => joinStats([
    `${uc.minutesSavedPerTransaction} min saved/transaction`,
    `${uc.transactionsPerDay} transactions/day`,
    `${uc.dockStaff} dock staff`,
    `$${uc.burdenedRate}/hr`,
    `${fmtV(uc.reductionPct, 'reductionPct')} reduction`,
  ]),
  outboundAudit: (uc) => joinStats([
    `${uc.minutesSaved} min saved/transaction`,
    `${uc.transactionsPerDay} transactions/day`,
    `${uc.dockStaff} dock staff`,
    `$${uc.burdenedRate}/hr`,
    `${fmtV(uc.reductionPct, 'reductionPct')} reduction`,
  ]),
  returnsTransfers: (uc) => joinStats([
    `${uc.minutesPerTransfer} min/transfer`,
    `${uc.transfersPerDay} transfers/day`,
    `${uc.peoplePerTransfer} people`,
    `$${uc.burdenedRate}/hr`,
    `${fmtV(uc.reductionPct, 'reductionPct')} reduction`,
  ]),
  inventoryRequests: (uc) => joinStats([
    `${uc.hoursPerWeek} hrs/wk`,
    `${uc.peopleInvolved} people`,
    `$${uc.burdenedRate}/hr`,
    `${fmtV(uc.reductionPct, 'reductionPct')} reduction`,
  ]),
  shrinkage: (uc) => joinStats([
    `${uc.incidentsPerYear} incidents/yr`,
    `$${uc.materialValuePerIncident}/incident material value`,
    `${uc.laborHoursPerIncident} hrs investigation`,
    `$${uc.burdenedRate}/hr`,
    `${fmtV(uc.reductionPct, 'reductionPct')} reduction`,
  ]),
  productionEquipment: (uc) => joinStats([
    `${uc.incidentsPerYear} incidents/yr`,
    `$${uc.costPerIncident}/incident`,
    `${fmtV(uc.reductionPct, 'reductionPct')} reduction`,
  ]),
  rtiTracking: (uc) => joinStats([
    `${uc.incidentsPerYear} incidents/yr`,
    `$${uc.costPerIncident}/incident`,
    `${fmtV(uc.reductionPct, 'reductionPct')} reduction`,
  ]),
  proofOfDelivery: (uc) => joinStats([
    `${uc.incidentsPerYear} disputed claims/yr`,
    `$${uc.costPerIncident}/claim`,
    `${fmtV(uc.reductionPct, 'reductionPct')} reduction`,
  ]),
  qualityExceptionTracking: (uc) => joinStats([
    `${uc.exceptionsPerYear} exceptions/yr`,
    `$${uc.reworkCostPerException} rework cost`,
    uc.scrapCostPerException ? `$${uc.scrapCostPerException} scrap` : null,
    `${fmtV(uc.reductionPct, 'reductionPct')} reduction`,
  ]),
  expeditedExceptionTracking: (uc) => joinStats([
    `${uc.lateShipmentsPerMonth} late shipments/mo`,
    `$${uc.costPerLateShipment}/late shipment`,
    `${fmtV(uc.reductionPct, 'reductionPct')} reduction`,
  ]),
  workingCapitalImprovement: (uc) => joinStats([
    `$${Number(uc.wipInventoryValue).toLocaleString()} WIP inventory value`,
    `${fmtV(uc.reductionPct, 'reductionPct')} reduction`,
  ]),
  // Multi-driver use cases: handled separately in UcCard
  locateItems: null,
  workOrderTracking: null,
  picklistVerification: null,
};

// Compact stat lines for role-row drivers
function roleRowStats(roleRows) {
  return (roleRows || []).map((row, i) => (
    <p key={i} style={{ fontSize: 10, color: '#4b5563', margin: '1px 0' }}>
      {ROLE_LABELS[row.role] || row.customRoleName || row.role} — {row.headcount} HC · {row.hoursLostPerDay} hrs/day · ${row.burdenedRate}/hr
    </p>
  ));
}

const statLineStyle = { fontSize: 10, color: '#4b5563', margin: '2px 0', fontVariantNumeric: 'tabular-nums' };
const noteLabelStyle = { fontSize: 9, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.04em' };
const noteTxtStyle = { fontSize: 9.5, color: '#6b7280', fontStyle: 'italic', marginTop: 2, lineHeight: 1.45 };
const driverLabelStyle = { fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#9ca3af', margin: '7px 0 2px' };

function NoteBlock({ text }) {
  if (!text) return null;
  return (
    <div style={{ marginTop: 5, paddingTop: 5, borderTop: '1px dashed #e5e7eb' }}>
      <span style={noteLabelStyle}>NOTE </span>
      <span style={noteTxtStyle}>"{text}"</span>
    </div>
  );
}

function estimateNoteLength(uc) {
  return [uc.justification, uc.driver1Justification, uc.driver2Justification]
    .filter(Boolean)
    .reduce((sum, t) => sum + String(t).length, 0);
}

function UcCard({ ucKey, uc, color, annualValue }) {
  const baseKey = ucKey.split('__')[0];
  const displayName = UC_NAMES[baseKey] || ucKey;
  const customDrivers = uc.customDrivers || [];
  const compactFn = COMPACT_STATS[baseKey];
  // Cards with unusually long combined note text can end up taller than a full PDF
  // page, so a keep-together block can never actually be honored for them — forcing
  // atomicity in that case only wastes a blank page before still cutting the note
  // midway. Past this rough length, let the card flow naturally instead. This is a
  // rendering/pagination decision only; it never truncates or limits what a rep can
  // type into the justification field.
  const isUnusuallyLong = estimateNoteLength(uc) > 650;

  let body;

  if (baseKey === 'locateItems' || baseKey === 'workOrderTracking') {
    // Two drivers: driver1 = roleRows, driver2 = supervisor
    body = (
      <>
        {uc.driver1Enabled && (
          <>
            <p style={driverLabelStyle}>Driver 1 — {baseKey === 'locateItems' ? 'Floor Worker Search Time' : 'Time Spent Manually Tracking'}</p>
            {roleRowStats(uc.roleRows)}
            <p style={statLineStyle}>{fmtV(uc.reductionPct, 'reductionPct')} efficiency improvement</p>
            <NoteBlock text={uc.driver1Justification} />
          </>
        )}
        {uc.driver2Enabled && (
          <>
            <p style={driverLabelStyle}>Driver 2 — Supervisory Visibility Time</p>
            <p style={statLineStyle}>
              {joinStats([
                `${uc.supervisorHoursPerWeek} hrs/wk`,
                `${uc.supervisorHeadcount} supervisors`,
                `$${uc.supervisorBurdenedRate}/hr`,
                `${fmtV(uc.reductionPct, 'reductionPct')} reduction`,
              ])}
            </p>
            <NoteBlock text={uc.driver2Justification} />
          </>
        )}
      </>
    );
  } else if (baseKey === 'picklistVerification') {
    body = (
      <>
        {uc.driver1Enabled && (
          <>
            <p style={driverLabelStyle}>Driver 1 — Pick Error Reduction</p>
            <p style={statLineStyle}>
              {joinStats([
                `${uc.picksPerDay} picks/day`,
                `${uc.errorRate}% error rate`,
                `$${uc.costPerError}/error`,
                `${fmtV(uc.reductionPct, 'reductionPct')} reduction`,
              ])}
            </p>
            <NoteBlock text={uc.driver1Justification} />
          </>
        )}
        {uc.driver2Enabled && (
          <>
            <p style={driverLabelStyle}>Driver 2 — Time Saved Per Pick</p>
            <p style={statLineStyle}>
              {joinStats([
                `${uc.picksPerDay} picks/day`,
                `${uc.minutesSavedPerPick} min saved/pick`,
                `$${uc.burdenedRate}/hr`,
              ])}
            </p>
            <NoteBlock text={uc.driver2Justification} />
          </>
        )}
      </>
    );
  } else if (compactFn) {
    body = (
      <>
        <p style={statLineStyle}>{compactFn(uc)}</p>
        <NoteBlock text={uc.justification} />
      </>
    );
  } else {
    // Fallback for any unmapped key
    body = (
      <>
        <p style={statLineStyle}>
          {joinStats(Object.entries(uc)
            .filter(([k]) => !new Set(['key','enabled','customDrivers','roleRows','justification','driver1Justification','driver2Justification','reviewed','id']).has(k))
            .map(([k, v]) => (v !== '' && v !== null && v !== undefined) ? `${v}` : null)
          )}
        </p>
        <NoteBlock text={uc.justification} />
      </>
    );
  }

  return (
    <div data-keep-together={isUnusuallyLong ? undefined : "true"} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: '10px 14px', borderTop: `3px solid ${color.border}`, marginBottom: 2 }}>
      <div data-keep-together="true" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <p style={{ fontSize: 11.5, fontWeight: 700, color: '#111827' }}>{displayName}</p>
        {annualValue != null && (
          <span style={{ fontSize: 11, fontWeight: 700, color: color.text }}>{fmt$(annualValue)}</span>
        )}
      </div>
      {body}
      {customDrivers.length > 0 && customDrivers.map((d, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '2px 0', color: '#4b5563' }}>
          <span>{d.name || d.label || 'Custom Driver'}</span>
          {d.annualValue !== undefined && <span style={{ color: '#111827', fontWeight: 600 }}>{fmt$(Number(d.annualValue))}</span>}
        </div>
      ))}
    </div>
  );
}

// ─── Proportion bar ──────────────────────────────────────────────────────────

function ProportionBar({ buckets, total }) {
  if (!total || total <= 0) return null;
  const activeBuckets = buckets.filter((b) => b.subtotal > 0);
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', height: 20, borderRadius: 6, overflow: 'hidden', width: '100%' }}>
        {activeBuckets.map((b) => {
          const color = getSolutionColor(b.name);
          const pct = (b.subtotal / total) * 100;
          return (
            <div
              key={b.name}
              style={{ width: `${pct}%`, background: color.border, minWidth: pct > 0 ? 2 : 0 }}
              title={`${b.name}: ${fmt$(b.subtotal)}`}
            />
          );
        })}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', marginTop: 8 }}>
        {activeBuckets.map((b) => {
          const color = getSolutionColor(b.name);
          return (
            <div key={b.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: color.border, flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: '#374151' }}>{b.name}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#111827' }}>{fmt$(b.subtotal)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main report ─────────────────────────────────────────────────────────────

const DISCLAIMER = 'All figures are calculated based on user provided inputs. Nothing is final until validated.';

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

  const projectTitle = ops.projectTitle || 'ROI Analysis';
  const companyName = ops.companyName || 'Your Facility';

  const metrics = [
    { label: '5-Year ROI',         value: hasInvestment ? fmtPct(roiValue) : '—',            caption: 'Total return over 5 years',          border: '#2F5FFF' },
    { label: '5-Year NPV',         value: hasInvestment ? fmt$(result.npv) : '—',             caption: 'Net present value at your WACC',     border: '#2F5FFF' },
    { label: 'IRR (Annual)',        value: irrDisplay,                                          caption: 'Internal rate of return',            border: '#2F5FFF' },
    { label: 'Payback Period',      value: hasInvestment ? fmtWks(result.paybackWeeks) : '—', caption: 'Weeks to recover investment',         border: '#0E8F6E' },
    { label: 'Annual SaaS ROI',    value: hasInvestment ? fmtPct(result.saasRoi) : '—',       caption: 'Return per dollar of platform fee',  border: '#0E8F6E' },
    { label: 'Annual Hours Saved', value: totalHoursSaved > 0 ? `${Math.round(totalHoursSaved).toLocaleString()} hrs` : '—', caption: 'Labor hours returned each year', border: '#0E8F6E' },
  ];

  const activeUcEntries = Object.entries(useCases).filter(([, uc]) => uc?.enabled);

  const s = {
    root: { width: 800, background: '#ffffff', fontFamily: 'Inter, system-ui, sans-serif', color: '#111827', padding: 40 },
    header: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid #e5e7eb' },
    heroBox: { background: 'linear-gradient(135deg, #1a4fb0, #2f6fe0)', borderRadius: 14, padding: '32px 28px', marginBottom: 20, color: '#ffffff' },
    heroLabel: { fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#bfdbfe', marginBottom: 8 },
    heroValue: { fontSize: 44, fontWeight: 700, lineHeight: 1.15, marginBottom: 14, fontVariantNumeric: 'tabular-nums' },
    heroSub: { fontSize: 13, color: '#bfdbfe', lineHeight: 1.5 },
    metricsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 24 },
    metricCard: (border) => ({ background: '#fafbfc', borderRadius: 10, padding: '12px 10px', borderTop: `3px solid ${border}` }),
    metricLabel: { fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#6b7280', marginBottom: 4 },
    metricValue: { fontSize: 17, fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' },
    metricCaption: { fontSize: 9, color: '#9ca3af', marginTop: 3 },
    panel: { background: '#ffffff', borderRadius: 12, padding: 24, marginBottom: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.08)' },
    panelTitle: { fontSize: 14, fontWeight: 600, color: '#1f2937', marginBottom: 16 },
    disclaimer: { marginTop: 16, fontSize: 10, color: '#9ca3af', textAlign: 'center', lineHeight: 1.5, fontStyle: 'italic' },
  };

  return (
    <div style={s.root}>

      {/* ── Header ── */}
      <div data-keep-together="true" style={s.header}>
        <img src={xemelgoLogo} alt="Xemelgo" style={{ height: 32, width: 'auto' }} />
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>
            {activeCount} use case{activeCount === 1 ? '' : 's'} active
          </p>
          <p style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>
            Prepared for {companyName} · {preparedDate}
          </p>
          {showContactBlock && (
            <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
              {fullName && <p style={{ fontSize: 11.5, fontWeight: 600, color: '#374151' }}>{fullName}</p>}
              {email && <p style={{ fontSize: 10.5, color: '#6b7280', marginTop: 1 }}>{email}</p>}
            </div>
          )}
        </div>
      </div>

      {/* ── Title block ── */}
      <div data-keep-together="true" style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#185FA5', marginBottom: 6 }}>
          ROI Analysis
        </p>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: '#0F2A4A', margin: 0, lineHeight: 1.15 }}>
          {projectTitle}
        </h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>
          {companyName} · validated estimate across {activeCount} active use case{activeCount === 1 ? '' : 's'}
        </p>
        <p style={{ fontSize: 13, fontStyle: 'italic', color: '#374151', marginTop: 10, paddingLeft: 14, borderLeft: '3px solid #93c5fd', lineHeight: 1.5 }}>
          "Every competitor sells visibility. Xemelgo sells execution."
        </p>
      </div>

      {/* ── Hero ── */}
      <div data-keep-together="true" style={s.heroBox}>
        <p style={s.heroLabel}>{hasInvestment ? 'Net Annual Value' : 'Total Estimated Annual Savings'}</p>
        <p style={s.heroValue}>{hasInvestment ? fmt$(result.netAnnualValue) : fmt$(result.totalGrossAnnual)}</p>
        {hasInvestment && (
          <p style={s.heroSub}>
            At these inputs, <strong style={{ color: '#ffffff' }}>{companyName}</strong> recovers its full investment in{' '}
            <strong style={{ color: '#ffffff' }}>{fmtWks(result.paybackWeeks)}</strong> and generates{' '}
            <strong style={{ color: '#ffffff' }}>{fmt$(result.npv)}</strong> in net value over 5 years.
          </p>
        )}
      </div>

      {/* ── Metric cards ── */}
      <div data-keep-together="true" style={s.metricsGrid}>
        {metrics.map((m) => (
          <div key={m.label} style={s.metricCard(m.border)}>
            <p style={s.metricLabel}>{m.label}</p>
            <p style={s.metricValue}>{m.value}</p>
            <p style={s.metricCaption}>{m.caption}</p>
          </div>
        ))}
      </div>

      {/* ── Savings summary ── */}
      <div style={s.panel}>
        <p style={{ ...s.panelTitle, color: '#0F2A4A' }}>Savings summary by solution</p>

        {/* Proportion bar */}
        <ProportionBar buckets={buckets} total={result.totalGrossAnnual} />

        {buckets.filter((b) => b.lineItems.length > 0).map((bucket) => {
          const color = getSolutionColor(bucket.name);
          return (
            <div key={bucket.name} data-keep-together="true" style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #e5e7eb', marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, padding: '8px 14px', borderLeft: `4px solid ${color.border}`, background: color.tint }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: color.text }}>{bucket.name}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: color.text }}>·</span>
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

      {/* ── 5-Year Outlook ── */}
      <div style={s.panel}>
        <MilestoneOutlook fin={fin} totalGrossAnnual={result.totalGrossAnnual} />
      </div>

      {/* ── Appendix ── */}
      <div>
        <div style={{ borderBottom: '2px solid #0F2A4A', paddingBottom: 12, marginTop: 24 }}>
          <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#185FA5', fontWeight: 700 }}>Report inputs</p>
          <p style={{ fontSize: 20, fontWeight: 700, color: '#0F2A4A', marginTop: 4 }}>Appendix A — detailed assumptions</p>
          <p style={{ fontSize: 11.5, color: '#6b7280', marginTop: 4 }}>Every input used to calculate the figures on the preceding pages.</p>
        </div>

        {/* Use case cards grouped by solution, with bucket dollar total in section header */}
        {(() => {
          const knownSolutions = [...SOLUTION_ORDER, 'Custom'];
          const unresolvedEntries = activeUcEntries.filter(([key]) => !knownSolutions.includes(getSolutionForUcKey(key)));

          const groups = [
            ...[...SOLUTION_ORDER, 'Custom'].map((solName) => ({
              solName,
              entries: activeUcEntries.filter(([k]) => getSolutionForUcKey(k) === (solName === 'Custom' ? null : solName)),
            })),
            ...(unresolvedEntries.length > 0 ? [{ solName: 'Other', entries: unresolvedEntries }] : []),
          ];

          return groups.filter((g) => g.entries.length > 0).map(({ solName, entries }) => {
            const color = getSolutionColor(solName);
            // Find the matching bucket to get its dollar subtotal
            const matchingBucket = buckets.find((b) => b.name === solName);
            const bucketTotal = matchingBucket?.subtotal ?? 0;

            return (
              <React.Fragment key={solName}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color.border }} />
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#374151' }}>
                    {solName}
                  </span>
                  {bucketTotal > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: color.text }}>
                      {fmt$(bucketTotal)} / year
                    </span>
                  )}
                </div>
                <div>
                  {(() => {
                    const LONG_UC_KEYS = new Set(['locateItems', 'workOrderTracking', 'picklistVerification']);
                    const rows = [];
                    let buffer = null;
                    entries.forEach(([k, uc]) => {
                      const isLong = LONG_UC_KEYS.has(k.split('__')[0]);
                      if (isLong) {
                        if (buffer) { rows.push([buffer]); buffer = null; }
                        rows.push([[k, uc]]);
                      } else if (buffer) {
                        rows.push([buffer, [k, uc]]);
                        buffer = null;
                      } else {
                        buffer = [k, uc];
                      }
                    });
                    if (buffer) rows.push([buffer]);
                    return rows.map((row, ri) => (
                      <div key={ri} style={{ display: 'grid', gridTemplateColumns: row.length === 2 ? '1fr 1fr' : '1fr', gap: 10, marginBottom: 10 }}>
                        {row.map(([k, uc]) => {
                          const li = matchingBucket?.lineItems.find((item) => item.key === k);
                          return (
                            <UcCard key={k} ucKey={k} uc={uc} color={color} annualValue={li?.annualValue} />
                          );
                        })}
                      </div>
                    ));
                  })()}
                </div>
              </React.Fragment>
            );
          });
        })()}

        {/* Financial assumptions */}
        <p style={{ fontSize: 14, fontWeight: 700, color: '#0F2A4A', marginTop: 22 }}>Financial assumptions</p>
        <div style={{ marginTop: 8, border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden' }}>
          {Object.entries(fin).filter(([k]) => !new Set(['key','enabled','customDrivers','reviewed']).has(k)).map(([k, v], i) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 14px', fontSize: 11.5, ...(i > 0 ? { borderTop: '1px solid #f3f4f6' } : {}) }}>
              <span style={{ color: '#6b7280' }}>{FIN_LABELS[k] || k}</span>
              <span style={{ color: '#111827', fontWeight: 600 }}>
                {PCT_FIELDS.has(k) ? `${(Number(v) * 100).toFixed(1)}%` : (v === '' ? '—' : String(v))}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom line ── */}
      <div data-keep-together="true" style={{ marginTop: 28, padding: '18px 20px', background: '#0a1938', borderRadius: 12 }}>
        <p style={{ fontSize: 12.7, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>Bottom line</p>
        <p style={{ fontSize: 10.9, color: '#ffffff', lineHeight: 1.65 }}>
          {activeCount} use case{activeCount === 1 ? '' : 's'} were modeled for {projectTitle},
          generating a net annual value of{' '}
          <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{hasInvestment ? fmt$(result.netAnnualValue) : fmt$(result.totalGrossAnnual)}</strong>
          {hasInvestment && result.paybackWeeks != null
            ? ` with a projected payback period of ${fmtWks(result.paybackWeeks)}.`
            : '.'}
          {' '}All figures reflect the inputs entered in this session and are subject to validation against your actual operating data.
        </p>
      </div>
    </div>
  );
}
