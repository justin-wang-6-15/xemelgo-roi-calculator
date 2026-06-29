import { useState } from 'react';
import RangeSlider from '../RangeSlider';
import Tooltip from '../Tooltip';
import { fmt$ } from '../../utils/format';
import { calcUseCaseValue, BUCKET_CONFIG } from '../../utils/calculations';

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
  return (
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
  );
}

function UseCaseInputs({ ucKey, uc, ops, onUpdate }) {
  const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1';
  const grid = 'grid grid-cols-1 sm:grid-cols-2 gap-4';

  if (ucKey === 'auditCycleCount') {
    return (
      <div className={grid}>
        <div>
          <label className={labelCls}>Hours per cycle count</label>
          <input type="number" value={uc.hoursPerCount} onChange={(e) => onUpdate(ucKey, 'hoursPerCount', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Cycle counts per year</label>
          <input type="number" value={uc.countsPerYear} onChange={(e) => onUpdate(ucKey, 'countsPerYear', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Planners involved per count</label>
          <input type="number" value={uc.plannersPerCount} onChange={(e) => onUpdate(ucKey, 'plannersPerCount', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Expected time reduction with RFID</label>
          <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
        </div>
      </div>
    );
  }

  if (ucKey === 'locateItems') {
    return (
      <div className={grid}>
        <div>
          <label className={labelCls}>Avg search time per incident (min)</label>
          <input type="number" value={uc.searchMinutes} onChange={(e) => onUpdate(ucKey, 'searchMinutes', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Search incidents per day</label>
          <input type="number" value={uc.incidentsPerDay} onChange={(e) => onUpdate(ucKey, 'incidentsPerDay', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Primary role searching</label>
          <select value={uc.role} onChange={(e) => onUpdate(ucKey, 'role', e.target.value)} className={inputCls}>
            <option value="materialHandler">Material Handlers</option>
            <option value="planner">Planners</option>
            <option value="indirect">Indirect / Leadership</option>
            <option value="direct">Direct Employees</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Expected reduction with RFID</label>
          <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
        </div>
      </div>
    );
  }

  if (ucKey === 'picklistVerification') {
    return (
      <div className={grid}>
        <div>
          <label className={labelCls}>Picks per day</label>
          <input type="number" value={uc.picksPerDay} onChange={(e) => onUpdate(ucKey, 'picksPerDay', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Error rate today (%)</label>
          <input type="number" value={Math.round(uc.errorRate * 100)} onChange={(e) => onUpdate(ucKey, 'errorRate', Number(e.target.value) / 100)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Cost per error ($)</label>
          <div className="flex items-center">
            <span className="text-gray-500 mr-1 text-sm">$</span>
            <input type="number" value={uc.costPerError} onChange={(e) => onUpdate(ucKey, 'costPerError', Number(e.target.value))} className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Expected error reduction with RFID</label>
          <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
        </div>
      </div>
    );
  }

  if (ucKey === 'shipReceiveVerification') {
    return (
      <div className={grid}>
        <div>
          <label className={labelCls}>Shipments & receipts per day</label>
          <input type="number" value={uc.transactionsPerDay} onChange={(e) => onUpdate(ucKey, 'transactionsPerDay', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Time per transaction (min)</label>
          <input type="number" value={uc.minutesPerTransaction} onChange={(e) => onUpdate(ucKey, 'minutesPerTransaction', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Dock headcount</label>
          <input type="number" value={uc.dockHeadcount} onChange={(e) => onUpdate(ucKey, 'dockHeadcount', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Expected time reduction with RFID</label>
          <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
        </div>
      </div>
    );
  }

  if (ucKey === 'internalDelivery') {
    return (
      <div className={grid}>
        <div>
          <label className={labelCls}>Internal transfers per day</label>
          <input type="number" value={uc.transfersPerDay} onChange={(e) => onUpdate(ucKey, 'transfersPerDay', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Time per transfer (min)</label>
          <input type="number" value={uc.minutesPerTransfer} onChange={(e) => onUpdate(ucKey, 'minutesPerTransfer', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Headcount involved</label>
          <input type="number" value={uc.headcount} onChange={(e) => onUpdate(ucKey, 'headcount', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Expected time reduction with RFID</label>
          <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
        </div>
      </div>
    );
  }

  if (ucKey === 'expiredProducts') {
    return (
      <div className={grid}>
        <div>
          <label className={labelCls}>Expired product incidents / year</label>
          <input type="number" value={uc.incidentsPerYear} onChange={(e) => onUpdate(ucKey, 'incidentsPerYear', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Avg write-off cost per incident ($)</label>
          <div className="flex items-center">
            <span className="text-gray-500 mr-1 text-sm">$</span>
            <input type="number" value={uc.costPerIncident} onChange={(e) => onUpdate(ucKey, 'costPerIncident', Number(e.target.value))} className={inputCls} />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Expected reduction with RFID</label>
          <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
        </div>
      </div>
    );
  }

  if (ucKey === 'calibrationReminders') {
    return (
      <div className={grid}>
        <div>
          <label className={labelCls}>Compliance failures / year</label>
          <input type="number" value={uc.failuresPerYear} onChange={(e) => onUpdate(ucKey, 'failuresPerYear', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Cost per failure ($)</label>
          <div className="flex items-center">
            <span className="text-gray-500 mr-1 text-sm">$</span>
            <input type="number" value={uc.costPerFailure} onChange={(e) => onUpdate(ucKey, 'costPerFailure', Number(e.target.value))} className={inputCls} />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Expected reduction with RFID</label>
          <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
        </div>
      </div>
    );
  }

  if (ucKey === 'geofencing') {
    return (
      <div className={grid}>
        <div>
          <label className={labelCls}>Out-of-zone incidents / year</label>
          <input type="number" value={uc.incidentsPerYear} onChange={(e) => onUpdate(ucKey, 'incidentsPerYear', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Cost per incident ($)</label>
          <div className="flex items-center">
            <span className="text-gray-500 mr-1 text-sm">$</span>
            <input type="number" value={uc.costPerIncident} onChange={(e) => onUpdate(ucKey, 'costPerIncident', Number(e.target.value))} className={inputCls} />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Expected reduction with RFID</label>
          <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
        </div>
      </div>
    );
  }

  if (ucKey === 'fasterFulfillment') {
    return (
      <div className={grid}>
        <div>
          <label className={labelCls}>Current fulfillment cycle time (hrs)</label>
          <input type="number" value={uc.currentCycleTime} onChange={(e) => onUpdate(ucKey, 'currentCycleTime', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Target cycle time with RFID (hrs)</label>
          <input type="number" value={uc.targetCycleTime} onChange={(e) => onUpdate(ucKey, 'targetCycleTime', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Orders per month</label>
          <input type="number" value={uc.ordersPerMonth} onChange={(e) => onUpdate(ucKey, 'ordersPerMonth', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Avg revenue per order ($)</label>
          <div className="flex items-center">
            <span className="text-gray-500 mr-1 text-sm">$</span>
            <input type="number" value={uc.revenuePerOrder} onChange={(e) => onUpdate(ucKey, 'revenuePerOrder', Number(e.target.value))} className={inputCls} />
          </div>
        </div>
        <p className="text-xs text-gray-500 col-span-2 mt-1">
          Uses a conservative 10% revenue capture rate.{' '}
          <Tooltip content="Not all cycle time improvement translates directly to revenue. A 10% conservative capture rate accounts for utilization limits and demand constraints.">
            <span className="text-blue-400 cursor-help">ⓘ</span>
          </Tooltip>
        </p>
      </div>
    );
  }

  if (ucKey === 'misShipReduction') {
    return (
      <div className={grid}>
        <div>
          <label className={labelCls}>Mis-ships per month</label>
          <input type="number" value={uc.misShipsPerMonth} onChange={(e) => onUpdate(ucKey, 'misShipsPerMonth', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Cost per mis-ship ($)</label>
          <div className="flex items-center">
            <span className="text-gray-500 mr-1 text-sm">$</span>
            <input type="number" value={uc.costPerMisShip} onChange={(e) => onUpdate(ucKey, 'costPerMisShip', Number(e.target.value))} className={inputCls} />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Expected reduction with RFID</label>
          <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
        </div>
      </div>
    );
  }

  if (ucKey === 'dockTurnSpeed') {
    return (
      <div className={grid}>
        <div>
          <label className={labelCls}>Dock transactions per day</label>
          <input type="number" value={uc.transactionsPerDay} onChange={(e) => onUpdate(ucKey, 'transactionsPerDay', Number(e.target.value))} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Cost of delay per transaction ($)</label>
          <div className="flex items-center">
            <span className="text-gray-500 mr-1 text-sm">$</span>
            <input type="number" value={uc.delayCostPerTransaction} onChange={(e) => onUpdate(ucKey, 'delayCostPerTransaction', Number(e.target.value))} className={inputCls} />
          </div>
        </div>
        <div>
          <label className={labelCls}>Expected time savings per transaction (min)</label>
          <input type="number" value={uc.savingsMinutesPerTransaction} onChange={(e) => onUpdate(ucKey, 'savingsMinutesPerTransaction', Number(e.target.value))} className={inputCls} />
        </div>
      </div>
    );
  }

  return null;
}

function UseCaseRow({ ucKey, label, uc, ops, onToggle, onUpdate }) {
  const annualValue = uc.enabled ? calcUseCaseValue(ucKey, uc, ops) : 0;
  return (
    <div className={`border-b border-gray-100 last:border-0 ${uc.enabled ? 'bg-blue-50/30' : ''}`}>
      <div className="flex items-center gap-3 px-6 py-3">
        <ToggleSwitch checked={uc.enabled} onChange={() => onToggle(ucKey)} />
        <span className={`text-sm font-medium flex-1 ${uc.enabled ? 'text-gray-900' : 'text-gray-500'}`}>{label}</span>
        {uc.enabled && (
          <span className="text-sm font-semibold text-blue-600">{fmt$(annualValue)}</span>
        )}
      </div>
      {uc.enabled && (
        <div className="px-6 pb-4">
          <UseCaseInputs ucKey={ucKey} uc={uc} ops={ops} onUpdate={onUpdate} />
          <div className="mt-3 flex gap-4 bg-blue-50 rounded-lg p-3">
            <div>
              <span className="text-xs text-blue-600 font-medium">Annual Value</span>
              <p className="text-lg font-bold text-blue-700">{fmt$(annualValue)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function BucketSection({ bucket, useCases, ops, onToggle, onUpdate }) {
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
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-0' : '-rotate-90'}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="text-base font-semibold text-gray-800">{bucket.name}</span>
        </div>
        <span className="text-sm font-semibold text-blue-600">{fmt$(subtotal)} / yr</span>
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
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Step2_UseCases({ ops, useCases, setUseCases, onNext, onBack }) {
  function toggle(key) {
    setUseCases((prev) => ({ ...prev, [key]: { ...prev[key], enabled: !prev[key].enabled } }));
  }
  function update(key, field, value) {
    setUseCases((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Here's where the time goes</h2>
      <p className="text-sm text-gray-500 mb-6">Toggle on the use cases that apply to your operation. Each one adds to your total opportunity.</p>

      {BUCKET_CONFIG.map((bucket) => (
        <BucketSection
          key={bucket.name}
          bucket={bucket}
          useCases={useCases}
          ops={ops}
          onToggle={toggle}
          onUpdate={update}
        />
      ))}

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
