import { useState } from 'react';
import RangeSlider from '../RangeSlider';
import Tooltip from '../Tooltip';
import { fmt$ } from '../../utils/format';
import { calcUseCaseValue, BUCKET_CONFIG } from '../../utils/calculations';

const REDUCTION_NOTES = {
  cycleCount:              'Xemelgo customers report 90–98% reduction in cycle count time. Default set to 95%.',
  audit:                   'Xemelgo customers report 75–90% reduction in full audit labor. Default set to 85%.',
  locateItems:             'Based on 60+ deployments, search time drops 60–80% in Year 1. Default set to 70%.',
  picklistVerification:    'Customers see 65–80% reduction in pick errors after 90 days. Default set to 70%.',
  shipReceiveVerification: 'Dock verification time drops 50–70% with portal-based RFID reads. Default set to 60%.',
  internalDelivery:        'Transfer confirmation time drops 40–60% with zone-level RFID. Default set to 50%.',
  expiredProducts:         'Customers with expiration tracking see 70–85% reduction in write-offs. Default set to 75%.',
  calibrationReminders:    'Automated alerts reduce missed calibrations by 75–90%. Default set to 80%.',
  geofencing:              'Zone breach incidents drop 60–80% with real-time geofence alerts. Default set to 70%.',
  misShipReduction:        'Outbound verification cuts mis-ship rates by 70–85%. Default set to 75%.',
};

const SHIFTS_LANG = {
  retail: 'Operating Hours Per Day',
};

const ROLE_RATE_MAP = {
  materialHandler: { rateKey: 'materialHandlerRate', label: 'Burdened hourly rate ($/hr)' },
  planner:         { rateKey: 'plannerRate',         label: 'Burdened hourly rate ($/hr)' },
  indirect:        { rateKey: 'indirectRate',        label: 'Burdened hourly rate ($/hr)' },
  direct:          { rateKey: 'directRate',          label: 'Burdened hourly rate ($/hr)' },
};

const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelCls = 'block text-xs font-medium text-gray-600 mb-1';
const grid2 = 'grid grid-cols-1 sm:grid-cols-2 gap-4';

function ReductionInput({ ucKey, uc, onUpdate }) {
  const note = REDUCTION_NOTES[ucKey];
  return (
    <div>
      <div className="flex items-center gap-3">
        <RangeSlider
          min={0}
          max={100}
          value={Math.round(uc.reductionPct * 100)}
          onChange={(val) => onUpdate('reductionPct', val / 100)}
          className="flex-1"
        />
        <input
          type="number"
          min={0}
          max={100}
          value={Math.round(uc.reductionPct * 100)}
          onChange={(e) => onUpdate('reductionPct', Number(e.target.value) / 100)}
          className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-500">%</span>
      </div>
      {note && <p className="mt-1.5 text-xs text-gray-400 italic">{note}</p>}
    </div>
  );
}

function RateRow({ label, rateKey, ops, setOps, mark }) {
  return (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex items-center">
        <span className="text-gray-400 mr-1 text-sm">$</span>
        <input
          type="number"
          value={ops[rateKey]}
          min={0}
          onChange={(e) => { mark(); setOps((prev) => ({ ...prev, [rateKey]: Number(e.target.value) })); }}
          className={inputCls}
        />
        <span className="text-gray-400 ml-1.5 text-xs">/hr</span>
      </div>
      <p className="mt-0.5 text-xs text-gray-400">Burdened = base wage + benefits, taxes, overhead.</p>
    </div>
  );
}

function OpDetailField({ label, helper, value, onChange, type = 'number', children }) {
  if (children) {
    return (
      <div>
        <label className={`${labelCls} text-blue-700`}>{label} <span className="text-gray-400 font-normal">(optional)</span></label>
        {children}
        {helper && <p className="mt-0.5 text-xs text-gray-400">{helper}</p>}
      </div>
    );
  }
  return (
    <div>
      <label className={`${labelCls} text-blue-700`}>{label} <span className="text-gray-400 font-normal">(optional)</span></label>
      <input
        type={type}
        value={value}
        min={0}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        className={inputCls}
      />
      {helper && <p className="mt-0.5 text-xs text-gray-400">{helper}</p>}
    </div>
  );
}

function UseCaseInputs({ ucKey, uc, ops, setOps, onUpdate, mark, operationDetails, setOperationDetails, industry }) {
  const daysPerYear = ops.workDaysPerWeek * ops.workWeeksPerYear;

  const setDet = (key) => (val) => {
    mark();
    setOperationDetails((prev) => ({ ...prev, [key]: val }));
  };
  const num = (v) => (v !== '' && Number(v) > 0 ? Number(v) : null);

  if (ucKey === 'cycleCount') return (
    <div className="space-y-4">
      <div className={grid2}>
        <div><label className={labelCls}>Hours per cycle count</label><input type="number" value={uc.hoursPerCount} onChange={(e) => onUpdate('hoursPerCount', Number(e.target.value))} className={inputCls} /></div>
        <div><label className={labelCls}>Cycle counts per week</label><input type="number" value={uc.countsPerWeek} onChange={(e) => onUpdate('countsPerWeek', Number(e.target.value))} className={inputCls} /></div>
        <div><label className={labelCls}>People per count</label><input type="number" value={uc.people} onChange={(e) => onUpdate('people', Number(e.target.value))} className={inputCls} /></div>
        <div>
          <label className={labelCls}>Burdened hourly rate ($/hr)</label>
          <div className="flex items-center">
            <span className="text-gray-400 mr-1 text-sm">$</span>
            <input type="number" value={uc.burdenedRate} onChange={(e) => onUpdate('burdenedRate', Number(e.target.value))} className={inputCls} />
            <span className="text-gray-400 ml-1.5 text-xs">/hr</span>
          </div>
        </div>
      </div>
      <div>
        <label className={labelCls}>Expected time reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
      </div>
    </div>
  );

  if (ucKey === 'audit') return (
    <div className="space-y-4">
      <div className={grid2}>
        <div><label className={labelCls}>People per audit</label><input type="number" value={uc.people} onChange={(e) => onUpdate('people', Number(e.target.value))} className={inputCls} /></div>
        <div><label className={labelCls}>Days per audit</label><input type="number" value={uc.daysPerAudit} onChange={(e) => onUpdate('daysPerAudit', Number(e.target.value))} className={inputCls} /></div>
        <div><label className={labelCls}>Hours per day during audit</label><input type="number" value={uc.hoursPerDay} onChange={(e) => onUpdate('hoursPerDay', Number(e.target.value))} className={inputCls} /></div>
        <div><label className={labelCls}>Full audits per year</label><input type="number" value={uc.auditsPerYear} onChange={(e) => onUpdate('auditsPerYear', Number(e.target.value))} className={inputCls} /></div>
        <div>
          <label className={labelCls}>Burdened hourly rate ($/hr)</label>
          <div className="flex items-center">
            <span className="text-gray-400 mr-1 text-sm">$</span>
            <input type="number" value={uc.burdenedRate} onChange={(e) => onUpdate('burdenedRate', Number(e.target.value))} className={inputCls} />
            <span className="text-gray-400 ml-1.5 text-xs">/hr</span>
          </div>
        </div>
      </div>
      <div>
        <label className={labelCls}>Expected labor reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
      </div>
    </div>
  );

  if (ucKey === 'locateItems') return (
    <div className="space-y-4">
      <div className={grid2}>
        <div><label className={labelCls}>Avg search time per incident (min)</label><input type="number" value={uc.searchMinutes} onChange={(e) => onUpdate('searchMinutes', Number(e.target.value))} className={inputCls} /></div>
        <div>
          <label className={labelCls}>Search incidents per day</label>
          <input
            type="number"
            value={uc.incidentsPerDay}
            onChange={(e) => onUpdate('incidentsPerDay', Number(e.target.value))}
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Primary role searching</label>
          <select value={uc.role} onChange={(e) => onUpdate('role', e.target.value)} className={inputCls}>
            <option value="materialHandler">Material Handlers</option>
            <option value="planner">Planners</option>
            <option value="indirect">Indirect / Leadership</option>
            <option value="direct">Direct Employees</option>
          </select>
        </div>
        <RateRow
          label={ROLE_RATE_MAP[uc.role]?.label ?? 'Burdened hourly rate ($/hr)'}
          rateKey={ROLE_RATE_MAP[uc.role]?.rateKey ?? 'materialHandlerRate'}
          ops={ops}
          setOps={setOps}
          mark={mark}
        />
      </div>

      {(industry === 'manufacturing') && (
        <div className="border-t border-blue-100 pt-3 mt-1">
          <p className="text-xs font-medium text-blue-700 mb-2">Operation context (optional — improves estimate accuracy)</p>
          <div className={grid2}>
            <OpDetailField
              label="Unique part numbers tracked"
              helper="Active part numbers in inventory. Drives locate items complexity."
              value={operationDetails.uniquePartNumbers}
              onChange={(v) => {
                setDet('uniquePartNumbers')(v);
                const n = num(v);
                if (n) onUpdate('incidentsPerDay', Math.min(50, Math.max(5, Math.ceil(n / 50))));
              }}
            />
          </div>
        </div>
      )}
      {(industry === 'retail') && (
        <div className="border-t border-blue-100 pt-3 mt-1">
          <p className="text-xs font-medium text-blue-700 mb-2">Operation context (optional — improves estimate accuracy)</p>
          <div className={grid2}>
            <OpDetailField
              label="Active SKUs in inventory"
              helper="Drives cycle count and locate items complexity."
              value={operationDetails.activeSkus}
              onChange={(v) => {
                setDet('activeSkus')(v);
                const n = num(v);
                if (n) onUpdate('incidentsPerDay', Math.min(80, Math.max(5, Math.ceil(n / 100))));
              }}
            />
          </div>
        </div>
      )}
      {(industry === 'supplychain') && (
        <div className="border-t border-blue-100 pt-3 mt-1">
          <p className="text-xs font-medium text-blue-700 mb-2">Operation context (optional — improves estimate accuracy)</p>
          <div className={grid2}>
            <OpDetailField
              label="Unique SKUs in warehouse"
              helper="Active SKU count in your distribution center."
              value={operationDetails.uniquePartNumbers}
              onChange={(v) => {
                setDet('uniquePartNumbers')(v);
                const n = num(v);
                if (n) onUpdate('incidentsPerDay', Math.min(60, Math.max(5, Math.ceil(n / 80))));
              }}
            />
          </div>
        </div>
      )}

      <div>
        <label className={labelCls}>Expected reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
      </div>
    </div>
  );

  if (ucKey === 'picklistVerification') return (
    <div className="space-y-4">
      <div className={grid2}>
        <div><label className={labelCls}>Picks per day</label><input type="number" value={uc.picksPerDay} onChange={(e) => onUpdate('picksPerDay', Number(e.target.value))} className={inputCls} /></div>
        <div><label className={labelCls}>Error rate today (%)</label><input type="number" value={Math.round(uc.errorRate * 100)} onChange={(e) => onUpdate('errorRate', Number(e.target.value) / 100)} className={inputCls} /></div>
        <div>
          <label className={labelCls}>Cost per error ($)</label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span><input type="number" value={uc.costPerError} onChange={(e) => onUpdate('costPerError', Number(e.target.value))} className={inputCls} /></div>
        </div>
      </div>

      {(industry === 'retail') && (
        <div className="border-t border-blue-100 pt-3">
          <p className="text-xs font-medium text-blue-700 mb-2">Operation context (optional — improves estimate accuracy)</p>
          <div className={grid2}>
            <OpDetailField
              label="Avg order lines per shipment"
              helper="Drives picklist verification savings."
              value={operationDetails.avgOrderLines}
              onChange={(v) => {
                setDet('avgOrderLines')(v);
                const n = num(v);
                if (n) onUpdate('picksPerDay', Math.round((ops.unitsPerMonth / 22) * n));
              }}
            />
          </div>
        </div>
      )}

      <div>
        <label className={labelCls}>Expected error reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
      </div>
    </div>
  );

  if (ucKey === 'shipReceiveVerification') return (
    <div className="space-y-4">
      <div className={grid2}>
        <div><label className={labelCls}>Shipments & receipts per day</label><input type="number" value={uc.transactionsPerDay} onChange={(e) => onUpdate('transactionsPerDay', Number(e.target.value))} className={inputCls} /></div>
        <div><label className={labelCls}>Time per transaction (min)</label><input type="number" value={uc.minutesPerTransaction} onChange={(e) => onUpdate('minutesPerTransaction', Number(e.target.value))} className={inputCls} /></div>
        <div><label className={labelCls}>Dock headcount</label><input type="number" value={uc.dockHeadcount} onChange={(e) => onUpdate('dockHeadcount', Number(e.target.value))} className={inputCls} /></div>
        <RateRow label="Material handler rate ($/hr)" rateKey="materialHandlerRate" ops={ops} setOps={setOps} mark={mark} />
      </div>

      {(industry === 'supplychain' || industry === 'manufacturing') && (
        <div className="border-t border-blue-100 pt-3">
          <p className="text-xs font-medium text-blue-700 mb-2">Operation context (optional — improves estimate accuracy)</p>
          <div className={grid2}>
            <OpDetailField
              label="Number of supplier docks / receiving doors"
              helper="Active inbound dock doors. Drives transaction volume estimate."
              value={operationDetails.supplierDocks}
              onChange={(v) => {
                setDet('supplierDocks')(v);
                const n = num(v);
                if (n) onUpdate('transactionsPerDay', n * 8);
              }}
            />
          </div>
        </div>
      )}

      <div>
        <label className={labelCls}>Expected time reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
      </div>
    </div>
  );

  if (ucKey === 'internalDelivery') return (
    <div className="space-y-4">
      <div className={grid2}>
        <div><label className={labelCls}>Internal transfers per day</label><input type="number" value={uc.transfersPerDay} onChange={(e) => onUpdate('transfersPerDay', Number(e.target.value))} className={inputCls} /></div>
        <div><label className={labelCls}>Time per transfer (min)</label><input type="number" value={uc.minutesPerTransfer} onChange={(e) => onUpdate('minutesPerTransfer', Number(e.target.value))} className={inputCls} /></div>
        <div><label className={labelCls}>Headcount involved</label><input type="number" value={uc.headcount} onChange={(e) => onUpdate('headcount', Number(e.target.value))} className={inputCls} /></div>
        <RateRow label="Material handler rate ($/hr)" rateKey="materialHandlerRate" ops={ops} setOps={setOps} mark={mark} />
      </div>

      {(industry === 'manufacturing' || industry === 'supplychain') && (
        <div className="border-t border-blue-100 pt-3">
          <p className="text-xs font-medium text-blue-700 mb-2">Operation context (optional — improves estimate accuracy)</p>
          <div className={grid2}>
            <OpDetailField
              label="Number of line-side inventory points"
              helper="Staging areas or point-of-use locations on your floor."
              value={operationDetails.lineSidePoints}
              onChange={(v) => {
                setDet('lineSidePoints')(v);
                const n = num(v);
                if (n) onUpdate('transfersPerDay', n * 3);
              }}
            />
          </div>
        </div>
      )}

      <div>
        <label className={labelCls}>Expected time reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
      </div>
    </div>
  );

  if (ucKey === 'expiredProducts') return (
    <div className="space-y-4">
      <div className={grid2}>
        <div><label className={labelCls}>Expired product incidents / year</label><input type="number" value={uc.incidentsPerYear} onChange={(e) => onUpdate('incidentsPerYear', Number(e.target.value))} className={inputCls} /></div>
        <div>
          <label className={labelCls}>Avg write-off cost per incident ($)</label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span><input type="number" value={uc.costPerIncident} onChange={(e) => onUpdate('costPerIncident', Number(e.target.value))} className={inputCls} /></div>
        </div>
      </div>

      {(industry === 'healthcare') && (
        <div className="border-t border-blue-100 pt-3">
          <p className="text-xs font-medium text-blue-700 mb-2">Operation context (optional — improves estimate accuracy)</p>
          <div className={grid2}>
            <OpDetailField
              label="Date-sensitive or expiring SKUs"
              helper="SKUs with expiration dates, lot control, or FIFO/FEFO compliance needs."
              value={operationDetails.dateSensitiveSkus}
              onChange={(v) => {
                setDet('dateSensitiveSkus')(v);
                const n = num(v);
                if (n) onUpdate('incidentsPerYear', Math.max(2, Math.ceil(n * 0.10)));
              }}
            />
          </div>
        </div>
      )}

      <div>
        <label className={labelCls}>Expected reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
      </div>
    </div>
  );

  if (ucKey === 'calibrationReminders') return (
    <div className="space-y-4">
      <div className={grid2}>
        <div><label className={labelCls}>Compliance failures / year</label><input type="number" value={uc.failuresPerYear} onChange={(e) => onUpdate('failuresPerYear', Number(e.target.value))} className={inputCls} /></div>
        <div>
          <label className={labelCls}>Cost per failure ($)</label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span><input type="number" value={uc.costPerFailure} onChange={(e) => onUpdate('costPerFailure', Number(e.target.value))} className={inputCls} /></div>
        </div>
      </div>

      {(industry === 'healthcare') && (
        <div className="border-t border-blue-100 pt-3">
          <p className="text-xs font-medium text-blue-700 mb-2">Operation context (optional — improves estimate accuracy)</p>
          <div className={grid2}>
            <OpDetailField
              label="Regulated components or calibrated tools"
              helper="Assets requiring scheduled calibration or compliance tracking."
              value={operationDetails.regulatedComponents}
              onChange={(v) => {
                setDet('regulatedComponents')(v);
                const n = num(v);
                if (n) onUpdate('failuresPerYear', Math.max(3, Math.ceil(n * 0.05)));
              }}
            />
          </div>
        </div>
      )}
      {(industry === 'manufacturing') && (
        <div className="border-t border-blue-100 pt-3">
          <p className="text-xs font-medium text-blue-700 mb-2">Operation context (optional — improves estimate accuracy)</p>
          <div className={grid2}>
            <OpDetailField
              label="Serialized assets tracked"
              helper="Tools, fixtures, test equipment, or jigs requiring calibration tracking."
              value={operationDetails.serializedAssets}
              onChange={(v) => {
                setDet('serializedAssets')(v);
                const n = num(v);
                if (n) onUpdate('failuresPerYear', Math.max(2, Math.ceil(n * 0.08)));
              }}
            />
          </div>
        </div>
      )}

      <div>
        <label className={labelCls}>Expected reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
      </div>
    </div>
  );

  if (ucKey === 'geofencing') return (
    <div className="space-y-4">
      <div className={grid2}>
        <div><label className={labelCls}>Out-of-zone incidents / year</label><input type="number" value={uc.incidentsPerYear} onChange={(e) => onUpdate('incidentsPerYear', Number(e.target.value))} className={inputCls} /></div>
        <div>
          <label className={labelCls}>Cost per incident ($)</label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span><input type="number" value={uc.costPerIncident} onChange={(e) => onUpdate('costPerIncident', Number(e.target.value))} className={inputCls} /></div>
        </div>
      </div>
      <div>
        <label className={labelCls}>Expected reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
      </div>
    </div>
  );

  if (ucKey === 'fasterFulfillment') return (
    <div className={grid2}>
      <div><label className={labelCls}>Current fulfillment cycle time (hrs)</label><input type="number" value={uc.currentCycleTime} onChange={(e) => onUpdate('currentCycleTime', Number(e.target.value))} className={inputCls} /></div>
      <div><label className={labelCls}>Target cycle time with RFID (hrs)</label><input type="number" value={uc.targetCycleTime} onChange={(e) => onUpdate('targetCycleTime', Number(e.target.value))} className={inputCls} /></div>
      <div><label className={labelCls}>Orders per month</label><input type="number" value={uc.ordersPerMonth} onChange={(e) => onUpdate('ordersPerMonth', Number(e.target.value))} className={inputCls} /></div>
      <div>
        <label className={labelCls}>Avg revenue per order ($)</label>
        <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span><input type="number" value={uc.revenuePerOrder} onChange={(e) => onUpdate('revenuePerOrder', Number(e.target.value))} className={inputCls} /></div>
      </div>
      <p className="text-xs text-gray-400 col-span-2 mt-1">
        Uses a conservative 10% revenue capture rate.{' '}
        <Tooltip content="Not all cycle time improvement translates directly to revenue. A 10% conservative capture rate accounts for utilization limits and demand constraints.">
          <span className="text-blue-400 cursor-help">ⓘ</span>
        </Tooltip>
      </p>
    </div>
  );

  if (ucKey === 'misShipReduction') return (
    <div className="space-y-4">
      <div className={grid2}>
        <div><label className={labelCls}>Mis-ships per month</label><input type="number" value={uc.misShipsPerMonth} onChange={(e) => onUpdate('misShipsPerMonth', Number(e.target.value))} className={inputCls} /></div>
        <div>
          <label className={labelCls}>Cost per mis-ship ($)</label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span><input type="number" value={uc.costPerMisShip} onChange={(e) => onUpdate('costPerMisShip', Number(e.target.value))} className={inputCls} /></div>
        </div>
      </div>
      <div>
        <label className={labelCls}>Expected reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
      </div>
    </div>
  );

  if (ucKey === 'dockTurnSpeed') {
    const annualValue = calcUseCaseValue(ucKey, uc, ops);
    return (
      <div className="space-y-4">
        <p className="text-xs text-gray-500">RFID portal reads replace manual scanning at the dock door, reducing transaction time and carrier wait costs.</p>
        <div className={grid2}>
          <div><label className={labelCls}>Dock transactions per day</label><input type="number" value={uc.transactionsPerDay} onChange={(e) => onUpdate('transactionsPerDay', Number(e.target.value))} className={inputCls} /></div>
          <div>
            <label className={labelCls}>Cost of delay per transaction ($)</label>
            <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span><input type="number" value={uc.delayCostPerTransaction} onChange={(e) => onUpdate('delayCostPerTransaction', Number(e.target.value))} className={inputCls} /></div>
          </div>
          <div><label className={labelCls}>Time savings per transaction (min)</label><input type="number" value={uc.savingsMinutesPerTransaction} onChange={(e) => onUpdate('savingsMinutesPerTransaction', Number(e.target.value))} className={inputCls} /></div>
          <div className="sm:col-span-2">
            <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-600">
              {uc.savingsMinutesPerTransaction} min saved × {uc.transactionsPerDay} txns/day × {daysPerYear} days/yr ={' '}
              <span className="font-semibold text-green-700">{fmt$(annualValue)}</span> saved annually
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

function UseCaseCard({ ucKey, label, uc, ops, setOps, setUseCases, interacted, onInteract, operationDetails, setOperationDetails, industry }) {
  const annualValue = calcUseCaseValue(ucKey, uc, ops);

  function onUpdate(field, value) {
    onInteract();
    setUseCases((prev) => ({ ...prev, [ucKey]: { ...prev[ucKey], [field]: value } }));
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-4">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {interacted && (
            <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-green-700 font-medium">Annual value:</span>
          <span className="text-base font-bold text-green-700">{fmt$(annualValue)}</span>
        </div>
      </div>
      <div className="px-5 py-4">
        <UseCaseInputs
          ucKey={ucKey}
          uc={uc}
          ops={ops}
          setOps={setOps}
          onUpdate={onUpdate}
          mark={onInteract}
          operationDetails={operationDetails}
          setOperationDetails={setOperationDetails}
          industry={industry}
        />
      </div>
    </div>
  );
}

export default function Step3_ValidateInputs({ ops, setOps, useCases, setUseCases, operationDetails, setOperationDetails, onNext, onBack }) {
  const [interacted, setInteracted] = useState(new Set());

  function markInteracted(key) {
    setInteracted((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }

  const industry = ops.industry || '';
  const shiftsLabel = SHIFTS_LANG[industry] || 'Shifts Per Day';
  const shiftsMax = industry === 'retail' ? 24 : 3;

  const enabledCards = BUCKET_CONFIG.flatMap((b) =>
    b.keys
      .filter((key) => useCases[key]?.enabled)
      .map((key) => ({ key, label: b.labels[key] }))
  );

  const totalGross = enabledCards.reduce(
    (sum, { key }) => sum + calcUseCaseValue(key, useCases[key], ops),
    0
  );

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Validate your inputs</h2>
      <p className="text-sm text-gray-500 mb-6">
        These are pre-filled with Xemelgo customer benchmarks. Adjust anything that doesn't match your reality.
      </p>

      {/* Operating Schedule */}
      <div className="bg-white rounded-xl shadow-md p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-3">Operating Schedule</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Work Weeks / Year</label>
            <input
              type="number"
              value={ops.workWeeksPerYear}
              min={1}
              max={52}
              onChange={(e) => setOps((prev) => ({ ...prev, workWeeksPerYear: Number(e.target.value) }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Working Days / Week</label>
            <input
              type="number"
              value={ops.workDaysPerWeek}
              min={1}
              max={7}
              onChange={(e) => setOps((prev) => ({ ...prev, workDaysPerWeek: Number(e.target.value) }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>{shiftsLabel}</label>
            <input
              type="number"
              value={ops.shiftsPerDay}
              min={1}
              max={shiftsMax}
              onChange={(e) => setOps((prev) => ({ ...prev, shiftsPerDay: Number(e.target.value) }))}
              className={inputCls}
            />
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          {ops.workDaysPerWeek * ops.workWeeksPerYear} working days / year · affects all labor-based calculations
        </p>
      </div>

      {/* Use Case Cards */}
      {enabledCards.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 mb-6 text-sm text-yellow-800">
          No use cases selected. Go back and select at least one.
        </div>
      )}

      {enabledCards.map(({ key, label }) => (
        <UseCaseCard
          key={key}
          ucKey={key}
          label={label}
          uc={useCases[key]}
          ops={ops}
          setOps={setOps}
          setUseCases={setUseCases}
          interacted={interacted.has(key)}
          onInteract={() => markInteracted(key)}
          operationDetails={operationDetails}
          setOperationDetails={setOperationDetails}
          industry={industry}
        />
      ))}

      {/* Running Total */}
      {enabledCards.length > 0 && (
        <div className="bg-blue-600 rounded-xl shadow-md p-5 mb-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-200">Total estimated annual opportunity</p>
              <p className="text-3xl font-bold mt-0.5">{fmt$(totalGross)}</p>
            </div>
            <div className="text-right text-sm text-blue-200">
              <p>{enabledCards.length} use case{enabledCards.length !== 1 ? 's' : ''}</p>
              <p>before platform cost</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between pb-20 lg:pb-0">
        <button
          onClick={onBack}
          className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-2.5 rounded-lg border border-gray-300 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={enabledCards.length === 0}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          Next: Financial Inputs →
        </button>
      </div>
    </div>
  );
}
