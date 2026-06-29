import { useState } from 'react';
import RangeSlider from '../RangeSlider';
import Tooltip from '../Tooltip';
import { fmt$ } from '../../utils/format';
import { calcUseCaseValue, calcUseCaseTotals, BUCKET_CONFIG } from '../../utils/calculations';

const REDUCTION_NOTES = {
  auditCycleCount: 'Xemelgo customers report 70–90% reduction in count time. Default set to 80% — adjust to be conservative.',
  locateItems: 'Based on 60+ deployments, search time drops 60–80% in Year 1. Default set to 70%.',
  picklistVerification: 'Customers see 65–80% reduction in pick errors after 90 days. Default set to 70%.',
  shipReceiveVerification: 'Dock verification time drops 50–70% with portal-based RFID reads. Default set to 60%.',
  internalDelivery: 'Transfer confirmation time drops 40–60% with zone-level RFID. Default set to 50%.',
  expiredProducts: 'Customers with expiration tracking see 70–85% reduction in write-offs. Default set to 75%.',
  calibrationReminders: 'Automated alerts reduce missed calibrations by 75–90%. Default set to 80%.',
  geofencing: 'Zone breach incidents drop 60–80% with real-time geofence alerts. Default set to 70%.',
  misShipReduction: 'Outbound verification cuts mis-ship rates by 70–85%. Default set to 75%.',
};

// Fix 4: static value ranges for disabled use cases
const DISABLED_RANGES = {
  expiredProducts: 'Typically worth $10K–$50K/yr for operations tracking perishables or date-sensitive inventory',
  calibrationReminders: 'Typically worth $15K–$75K/yr for regulated or equipment-intensive environments',
  geofencing: 'Typically worth $5K–$30K/yr for multi-zone or high-value asset environments',
  fasterFulfillment: 'Typically worth $20K–$100K/yr depending on order volume and revenue per order',
  misShipReduction: 'Typically worth $10K–$40K/yr for high-SKU or high-return-rate operations',
  dockTurnSpeed: 'Typically worth $15K–$60K/yr for high-dock-volume facilities',
};

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 flex-shrink-0
        ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
        ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function ReductionInput({ ucKey, uc, onUpdate }) {
  const note = REDUCTION_NOTES[ucKey];
  return (
    <div>
      <div className="flex items-center gap-3">
        <RangeSlider
          min={0}
          max={100}
          value={Math.round(uc.reductionPct * 100)}
          onChange={(val) => onUpdate(ucKey, 'reductionPct', val / 100)}
          className="flex-1"
        />
        <input
          type="number"
          min={0}
          max={100}
          value={Math.round(uc.reductionPct * 100)}
          onChange={(e) => onUpdate(ucKey, 'reductionPct', Number(e.target.value) / 100)}
          className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-500">%</span>
      </div>
      {note && <p className="mt-1.5 text-xs text-gray-400 italic">{note}</p>}
    </div>
  );
}

function UseCaseInputs({ ucKey, uc, ops, onUpdate }) {
  const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';
  const grid = 'grid grid-cols-1 sm:grid-cols-2 gap-4';
  const daysPerYear = ops.workDaysPerWeek * ops.workWeeksPerYear;

  if (ucKey === 'auditCycleCount') return (
    <div className={grid}>
      <div><label className={labelCls}>Hours per cycle count</label><input type="number" value={uc.hoursPerCount} onChange={(e) => onUpdate(ucKey, 'hoursPerCount', Number(e.target.value))} className={inputCls} /></div>
      <div><label className={labelCls}>Cycle counts per year</label><input type="number" value={uc.countsPerYear} onChange={(e) => onUpdate(ucKey, 'countsPerYear', Number(e.target.value))} className={inputCls} /></div>
      <div><label className={labelCls}>Planners involved per count</label><input type="number" value={uc.plannersPerCount} onChange={(e) => onUpdate(ucKey, 'plannersPerCount', Number(e.target.value))} className={inputCls} /></div>
      <div><label className={labelCls}>Expected time reduction with RFID</label><ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} /></div>
    </div>
  );

  if (ucKey === 'locateItems') return (
    <div className={grid}>
      <div><label className={labelCls}>Avg search time per incident (min)</label><input type="number" value={uc.searchMinutes} onChange={(e) => onUpdate(ucKey, 'searchMinutes', Number(e.target.value))} className={inputCls} /></div>
      <div><label className={labelCls}>Search incidents per day</label><input type="number" value={uc.incidentsPerDay} onChange={(e) => onUpdate(ucKey, 'incidentsPerDay', Number(e.target.value))} className={inputCls} /></div>
      <div>
        <label className={labelCls}>Primary role searching</label>
        <select value={uc.role} onChange={(e) => onUpdate(ucKey, 'role', e.target.value)} className={inputCls}>
          <option value="materialHandler">Material Handlers</option>
          <option value="planner">Planners</option>
          <option value="indirect">Indirect / Leadership</option>
          <option value="direct">Direct Employees</option>
        </select>
      </div>
      <div><label className={labelCls}>Expected reduction with RFID</label><ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} /></div>
    </div>
  );

  if (ucKey === 'picklistVerification') return (
    <div className={grid}>
      <div><label className={labelCls}>Picks per day</label><input type="number" value={uc.picksPerDay} onChange={(e) => onUpdate(ucKey, 'picksPerDay', Number(e.target.value))} className={inputCls} /></div>
      <div><label className={labelCls}>Error rate today (%)</label><input type="number" value={Math.round(uc.errorRate * 100)} onChange={(e) => onUpdate(ucKey, 'errorRate', Number(e.target.value) / 100)} className={inputCls} /></div>
      <div><label className={labelCls}>Cost per error ($)</label><div className="flex items-center"><span className="text-gray-500 mr-1 text-sm">$</span><input type="number" value={uc.costPerError} onChange={(e) => onUpdate(ucKey, 'costPerError', Number(e.target.value))} className={inputCls} /></div></div>
      <div><label className={labelCls}>Expected error reduction with RFID</label><ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} /></div>
    </div>
  );

  if (ucKey === 'shipReceiveVerification') return (
    <div className={grid}>
      <div><label className={labelCls}>Shipments & receipts per day</label><input type="number" value={uc.transactionsPerDay} onChange={(e) => onUpdate(ucKey, 'transactionsPerDay', Number(e.target.value))} className={inputCls} /></div>
      <div><label className={labelCls}>Time per transaction (min)</label><input type="number" value={uc.minutesPerTransaction} onChange={(e) => onUpdate(ucKey, 'minutesPerTransaction', Number(e.target.value))} className={inputCls} /></div>
      <div><label className={labelCls}>Dock headcount</label><input type="number" value={uc.dockHeadcount} onChange={(e) => onUpdate(ucKey, 'dockHeadcount', Number(e.target.value))} className={inputCls} /></div>
      <div><label className={labelCls}>Expected time reduction with RFID</label><ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} /></div>
    </div>
  );

  if (ucKey === 'internalDelivery') return (
    <div className={grid}>
      <div><label className={labelCls}>Internal transfers per day</label><input type="number" value={uc.transfersPerDay} onChange={(e) => onUpdate(ucKey, 'transfersPerDay', Number(e.target.value))} className={inputCls} /></div>
      <div><label className={labelCls}>Time per transfer (min)</label><input type="number" value={uc.minutesPerTransfer} onChange={(e) => onUpdate(ucKey, 'minutesPerTransfer', Number(e.target.value))} className={inputCls} /></div>
      <div><label className={labelCls}>Headcount involved</label><input type="number" value={uc.headcount} onChange={(e) => onUpdate(ucKey, 'headcount', Number(e.target.value))} className={inputCls} /></div>
      <div><label className={labelCls}>Expected time reduction with RFID</label><ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} /></div>
    </div>
  );

  if (ucKey === 'expiredProducts') return (
    <div className={grid}>
      <div><label className={labelCls}>Expired product incidents / year</label><input type="number" value={uc.incidentsPerYear} onChange={(e) => onUpdate(ucKey, 'incidentsPerYear', Number(e.target.value))} className={inputCls} /></div>
      <div><label className={labelCls}>Avg write-off cost per incident ($)</label><div className="flex items-center"><span className="text-gray-500 mr-1 text-sm">$</span><input type="number" value={uc.costPerIncident} onChange={(e) => onUpdate(ucKey, 'costPerIncident', Number(e.target.value))} className={inputCls} /></div></div>
      <div className="sm:col-span-2"><label className={labelCls}>Expected reduction with RFID</label><ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} /></div>
    </div>
  );

  if (ucKey === 'calibrationReminders') return (
    <div className={grid}>
      <div><label className={labelCls}>Compliance failures / year</label><input type="number" value={uc.failuresPerYear} onChange={(e) => onUpdate(ucKey, 'failuresPerYear', Number(e.target.value))} className={inputCls} /></div>
      <div><label className={labelCls}>Cost per failure ($)</label><div className="flex items-center"><span className="text-gray-500 mr-1 text-sm">$</span><input type="number" value={uc.costPerFailure} onChange={(e) => onUpdate(ucKey, 'costPerFailure', Number(e.target.value))} className={inputCls} /></div></div>
      <div className="sm:col-span-2"><label className={labelCls}>Expected reduction with RFID</label><ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} /></div>
    </div>
  );

  if (ucKey === 'geofencing') return (
    <div className={grid}>
      <div><label className={labelCls}>Out-of-zone incidents / year</label><input type="number" value={uc.incidentsPerYear} onChange={(e) => onUpdate(ucKey, 'incidentsPerYear', Number(e.target.value))} className={inputCls} /></div>
      <div><label className={labelCls}>Cost per incident ($)</label><div className="flex items-center"><span className="text-gray-500 mr-1 text-sm">$</span><input type="number" value={uc.costPerIncident} onChange={(e) => onUpdate(ucKey, 'costPerIncident', Number(e.target.value))} className={inputCls} /></div></div>
      <div className="sm:col-span-2"><label className={labelCls}>Expected reduction with RFID</label><ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} /></div>
    </div>
  );

  if (ucKey === 'fasterFulfillment') return (
    <div className={grid}>
      <div><label className={labelCls}>Current fulfillment cycle time (hrs)</label><input type="number" value={uc.currentCycleTime} onChange={(e) => onUpdate(ucKey, 'currentCycleTime', Number(e.target.value))} className={inputCls} /></div>
      <div><label className={labelCls}>Target cycle time with RFID (hrs)</label><input type="number" value={uc.targetCycleTime} onChange={(e) => onUpdate(ucKey, 'targetCycleTime', Number(e.target.value))} className={inputCls} /></div>
      <div><label className={labelCls}>Orders per month</label><input type="number" value={uc.ordersPerMonth} onChange={(e) => onUpdate(ucKey, 'ordersPerMonth', Number(e.target.value))} className={inputCls} /></div>
      <div><label className={labelCls}>Avg revenue per order ($)</label><div className="flex items-center"><span className="text-gray-500 mr-1 text-sm">$</span><input type="number" value={uc.revenuePerOrder} onChange={(e) => onUpdate(ucKey, 'revenuePerOrder', Number(e.target.value))} className={inputCls} /></div></div>
      <p className="text-xs text-gray-500 col-span-2 mt-1">
        Uses a conservative 10% revenue capture rate.{' '}
        <Tooltip content="Not all cycle time improvement translates directly to revenue. A 10% conservative capture rate accounts for utilization limits and demand constraints.">
          <span className="text-blue-400 cursor-help">ⓘ</span>
        </Tooltip>
      </p>
    </div>
  );

  if (ucKey === 'misShipReduction') return (
    <div className={grid}>
      <div><label className={labelCls}>Mis-ships per month</label><input type="number" value={uc.misShipsPerMonth} onChange={(e) => onUpdate(ucKey, 'misShipsPerMonth', Number(e.target.value))} className={inputCls} /></div>
      <div><label className={labelCls}>Cost per mis-ship ($)</label><div className="flex items-center"><span className="text-gray-500 mr-1 text-sm">$</span><input type="number" value={uc.costPerMisShip} onChange={(e) => onUpdate(ucKey, 'costPerMisShip', Number(e.target.value))} className={inputCls} /></div></div>
      <div className="sm:col-span-2"><label className={labelCls}>Expected reduction with RFID</label><ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} /></div>
    </div>
  );

  if (ucKey === 'dockTurnSpeed') {
    const annualValue = calcUseCaseValue(ucKey, uc, ops);
    return (
      <div className={grid}>
        <div className="sm:col-span-2">
          <p className="text-xs text-gray-500 mb-3">This covers both inbound receipts and outbound shipments. RFID portal reads replace manual scanning at the dock door, reducing transaction time and carrier wait costs.</p>
        </div>
        <div><label className={labelCls}>Dock transactions per day</label><input type="number" value={uc.transactionsPerDay} onChange={(e) => onUpdate(ucKey, 'transactionsPerDay', Number(e.target.value))} className={inputCls} /></div>
        <div><label className={labelCls}>Cost of delay per transaction ($)</label><div className="flex items-center"><span className="text-gray-500 mr-1 text-sm">$</span><input type="number" value={uc.delayCostPerTransaction} onChange={(e) => onUpdate(ucKey, 'delayCostPerTransaction', Number(e.target.value))} className={inputCls} /></div></div>
        <div><label className={labelCls}>Time savings per transaction (min)</label><input type="number" value={uc.savingsMinutesPerTransaction} onChange={(e) => onUpdate(ucKey, 'savingsMinutesPerTransaction', Number(e.target.value))} className={inputCls} /></div>
        <div className="sm:col-span-2">
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600">
            Your estimate: <span className="font-medium">{uc.savingsMinutesPerTransaction} min saved</span> × <span className="font-medium">{uc.transactionsPerDay} txns/day</span> × <span className="font-medium">{daysPerYear} days/yr</span> = <span className="font-semibold text-green-700">{fmt$(annualValue)}</span> saved annually
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Fix 9: styled outlined button instead of text link
function ExpandButton({ expanded, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-xs font-medium border border-blue-400 text-blue-600 hover:bg-blue-50 hover:border-blue-600 px-2.5 py-1 rounded-md transition-colors whitespace-nowrap flex items-center gap-1 flex-shrink-0"
    >
      {expanded ? 'Hide inputs ▴' : 'Edit inputs ▾'}
    </button>
  );
}

function UseCaseRow({ ucKey, label, uc, ops, onToggle, onUpdate, expanded, onToggleExpanded }) {
  const annualValue = uc.enabled ? calcUseCaseValue(ucKey, uc, ops) : 0;
  const disabledRange = DISABLED_RANGES[ucKey];

  return (
    <div className={`border-b border-gray-100 last:border-0 ${uc.enabled ? 'bg-white' : 'bg-gray-50/50'}`}>
      <div className="flex items-center gap-3 px-6 py-4">
        <ToggleSwitch checked={uc.enabled} onChange={() => onToggle(ucKey)} />
        <div className="flex-1 min-w-0">
          <span className={`text-sm font-medium ${uc.enabled ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
          {/* Fix 4: show static range when disabled */}
          {!uc.enabled && disabledRange && (
            <p className="text-xs text-gray-400 italic mt-0.5">{disabledRange}</p>
          )}
        </div>
        {uc.enabled && (
          <div className="flex items-center gap-3 flex-shrink-0">
            <span className="text-lg font-bold text-green-600">{fmt$(annualValue)}</span>
            <ExpandButton expanded={expanded} onClick={() => onToggleExpanded(ucKey)} />
          </div>
        )}
      </div>

      {uc.enabled && expanded && (
        <div className="px-6 pb-5 border-t border-blue-50 bg-blue-50/30">
          <div className="pt-4">
            <UseCaseInputs ucKey={ucKey} uc={uc} ops={ops} onUpdate={onUpdate} />
          </div>
          <div className="mt-4 inline-flex items-center gap-2 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
            <span className="text-xs text-green-700 font-medium">Annual Value:</span>
            <span className="text-base font-bold text-green-700">{fmt$(annualValue)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function BucketSection({ bucket, useCases, ops, onToggle, onUpdate, expandedKeys, onToggleExpanded }) {
  const [open, setOpen] = useState(true);
  const subtotal = bucket.keys
    .filter((key) => useCases[key]?.enabled)
    .reduce((sum, key) => sum + calcUseCaseValue(key, useCases[key], ops), 0);

  return (
    <div className="mb-4 bg-white rounded-xl shadow-md overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-0' : '-rotate-90'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="text-base font-semibold text-gray-800">{bucket.name}</span>
        </div>
        <span className={`text-sm font-semibold ${subtotal > 0 ? 'text-green-600' : 'text-gray-400'}`}>
          {subtotal > 0 ? `${fmt$(subtotal)} / yr` : '—'}
        </span>
      </button>
      {open && (
        <div className="border-t border-gray-100">
          {bucket.keys.map((key) => (
            <UseCaseRow
              key={key}
              ucKey={key}
              label={bucket.labels[key]}
              uc={useCases[key]}
              ops={ops}
              onToggle={onToggle}
              onUpdate={onUpdate}
              expanded={expandedKeys.has(key)}
              onToggleExpanded={onToggleExpanded}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Step2_UseCases({ ops, useCases, setUseCases, onNext, onBack }) {
  const [expandedKeys, setExpandedKeys] = useState(new Set());

  function toggle(key) {
    setUseCases((prev) => ({ ...prev, [key]: { ...prev[key], enabled: !prev[key].enabled } }));
  }
  function update(key, field, value) {
    setUseCases((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }
  function toggleExpanded(key) {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const { totalGrossAnnual } = calcUseCaseTotals(useCases, ops);
  const enabledCount = Object.values(useCases).filter((uc) => uc.enabled).length;
  const activeBuckets = BUCKET_CONFIG.filter((b) => b.keys.some((k) => useCases[k]?.enabled)).length;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Here's what we found for an operation like yours.</h2>
      <p className="text-sm text-gray-500 mb-6">
        These estimates are based on Xemelgo customer benchmarks for your operation size. Adjust any assumption that doesn't match your reality — or leave them as-is and continue.
      </p>

      {BUCKET_CONFIG.map((bucket) => (
        <BucketSection
          key={bucket.name}
          bucket={bucket}
          useCases={useCases}
          ops={ops}
          onToggle={toggle}
          onUpdate={update}
          expandedKeys={expandedKeys}
          onToggleExpanded={toggleExpanded}
        />
      ))}

      <div className="bg-blue-600 rounded-xl shadow-md p-5 mb-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-200">Your total estimated annual opportunity</p>
            <p className="text-3xl font-bold mt-0.5">{fmt$(totalGrossAnnual)}</p>
          </div>
          <div className="text-right text-sm text-blue-200">
            <p>Based on {enabledCount} use case{enabledCount !== 1 ? 's' : ''}</p>
            <p>across {activeBuckets} categor{activeBuckets !== 1 ? 'ies' : 'y'}</p>
          </div>
        </div>
      </div>

      <div className="flex justify-between pb-20 lg:pb-0">
        <button onClick={onBack} className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-2.5 rounded-lg border border-gray-300 transition-colors">
          ← Back
        </button>
        <button onClick={onNext} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-lg transition-colors">
          Review Financials →
        </button>
      </div>
    </div>
  );
}
