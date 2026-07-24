import { useState } from 'react';
import RangeSlider from '../RangeSlider';
import Tooltip from '../Tooltip';
import { fmt$ } from '../../utils/format';
import { calcUseCaseValue, BUCKET_CONFIG, getBaseUcKey } from '../../utils/calculations';

// ─── Shared style constants ───────────────────────────────────────────────
const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelCls = 'block text-xs font-medium text-gray-600 mb-1';
const grid2 = 'grid grid-cols-1 sm:grid-cols-2 gap-4';
const sourceNote = (text) => <p className="text-xs text-gray-400 italic mt-1">{text}</p>;

// ─── Solutions / use-case metadata ───────────────────────────────────────
const SOLUTIONS = [
  { id: 'inventory', name: 'Inventory management', description: 'Cycle counting, locate items, full audits, and expiry tracking.',
    defaults: ['cycleCount__inventory', 'locateItems__inventory', 'audit', 'shrinkage'],
    extras:   ['expiredProducts', 'goodsReceipt', 'inventoryRequests', 'returnsTransfers'] },
  { id: 'asset', name: 'Asset tracking', description: 'Locate assets, track calibration status, and enforce zone boundaries.',
    defaults: ['locateItems__asset', 'calibrationReminders', 'cycleCount__asset', 'productionEquipment', 'rtiTracking__asset'],
    extras:   ['geofencing'] },
  { id: 'wip', name: 'Work in process', description: 'Track work orders and in-progress materials across your facility.',
    defaults: ['cycleCount__wip', 'locateItems__wip', 'workOrderTracking', 'qualityExceptionTracking', 'expeditedExceptionTracking'],
    extras:   ['rtiTracking__wip', 'workingCapitalImprovement'] },
  { id: 'shipment', name: 'Shipment tracking', description: 'Verify picks, reduce mis-ships, and accelerate dock throughput.',
    defaults: ['picklistVerification', 'shipReceiveVerification', 'misShipReduction', 'fasterFulfillment', 'proofOfDelivery'],
    extras:   ['automatedPackCount', 'outboundAudit'] },
  { id: 'delivery', name: 'Package delivery', description: 'Automate internal delivery confirmation between zones.',
    defaults: ['internalDelivery'], extras: [], status: 'comingSoon' },
];

const UC_LABELS = {
  cycleCount: 'Cycle counting', locateItems: 'Locate items', audit: 'Full inventory audit',
  expiredProducts: 'Expired products', goodsReceipt: 'Goods receipt', inventoryRequests: 'Inventory requests',
  returnsTransfers: 'Returns and transfers', shrinkage: 'Shrinkage and loss prevention',
  calibrationReminders: 'Calibration reminders', geofencing: 'Geofencing',
  productionEquipment: 'Production equipment tracking', rtiTracking: 'RTI tracking',
  workOrderTracking: 'Work order cycle time tracking', qualityExceptionTracking: 'Quality exception path tracking',
  expeditedExceptionTracking: 'Expedited exception path tracking', workingCapitalImprovement: 'Working capital improvement',
  picklistVerification: 'Picklist verification', shipReceiveVerification: 'Shipment throughput',
  misShipReduction: 'Mis-ship reduction', automatedPackCount: 'Automated pack count',
  outboundAudit: 'Outbound shipment audit', fasterFulfillment: 'Faster order fulfillment',
  proofOfDelivery: 'Proof of delivery', internalDelivery: 'Internal delivery verification',
};

const UC_DESCRIPTIONS = {
  cycleCount: 'Reconcile system records against actual counts with automatic RFID reads.',
  locateItems: 'Find misplaced inventory instantly instead of searching manually.',
  audit: 'Complete a full stock count in hours instead of days.',
  expiredProducts: 'Flag near-expiration inventory before it becomes a write-off.',
  goodsReceipt: 'Confirm inbound shipments against purchase orders automatically.',
  inventoryRequests: 'Trigger replenishment automatically when stock runs low.',
  returnsTransfers: 'Track inventory moving between locations without manual logging.',
  shrinkage: 'Catch unexplained inventory loss as it happens.',
  calibrationReminders: 'Get notified before a calibrated asset falls out of compliance.',
  geofencing: 'Alert your team when an asset leaves an authorized zone.',
  productionEquipment: 'Track jigs, fixtures, and tooling to prevent downtime.',
  rtiTracking: 'Track totes and containers to cut loss and replacement costs.',
  workOrderTracking: 'Free up supervisor and planner hours spent manually checking on stalled work orders.',
  qualityExceptionTracking: 'Catch parts headed for rework or scrap before they reach the next step.',
  expeditedExceptionTracking: 'Flag priority orders at risk of missing their delivery window.',
  workingCapitalImprovement: 'Free up cash by carrying less work in process inventory.',
  picklistVerification: 'Catch picking errors before an order ships.',
  shipReceiveVerification: 'Move trucks through the dock faster with instant reads.',
  misShipReduction: 'Catch the wrong item before it leaves the building.',
  automatedPackCount: 'Verify case contents against the shipment notice without scanning each item.',
  outboundAudit: 'Certify every dock door before a truck leaves.',
  fasterFulfillment: "Cut order cycle time to capture orders you're currently turning away.",
  proofOfDelivery: 'Verify tag authenticity to cut fraudulent returns.',
  internalDelivery: 'Confirm internal deliveries with photo and signature proof.',
};

const UC_REDUCTION_DEFAULTS = {
  cycleCount: 98, audit: 90, locateItems: 90, workOrderTracking: 85, picklistVerification: 95,
  shipReceiveVerification: 95, internalDelivery: 90, goodsReceipt: 90, automatedPackCount: 90,
  outboundAudit: 90, returnsTransfers: 90, inventoryRequests: 90, expiredProducts: 95,
  calibrationReminders: 95, geofencing: 90, shrinkage: 85, productionEquipment: 85, rtiTracking: 85,
  proofOfDelivery: 90, misShipReduction: 95, dockTurnSpeed: 95, qualityExceptionTracking: 85,
  expeditedExceptionTracking: 90, workingCapitalImprovement: 15,
};

const d = UC_REDUCTION_DEFAULTS;
const SOURCE_NOTES = {
  cycleCount: `Xemelgo customers report 90–98% reduction in cycle count time. Default set to ${d.cycleCount}%.`,
  audit: `Xemelgo customers report 75–90% reduction in full audit labor. Default set to ${d.audit}%.`,
  locateItems: `Xemelgo customers report 70–90% reduction in search time across all roles. Default set to ${d.locateItems}%.`,
  workOrderTracking: `RFID dwell time flags remove most manual status checking. Customers report 75–90% reduction. Default set to ${d.workOrderTracking}%.`,
  picklistVerification: `Xemelgo customers see 80–95% reduction in pick errors. Default set to ${d.picklistVerification}%.`,
  shipReceiveVerification: `RFID portal reads replace manual dock scanning. Customers report 75–95% time reduction. Default set to ${d.shipReceiveVerification}%.`,
  internalDelivery: `RFID eliminates manual confirmation steps. Customers report 75–90% time reduction. Default set to ${d.internalDelivery}%.`,
  expiredProducts: `Proactive alerts eliminate most write-offs. Customers report 80–95% reduction. Default set to ${d.expiredProducts}%.`,
  calibrationReminders: `Automated alerts prevent most missed events. Customers report 80–95% reduction. Default set to ${d.calibrationReminders}%.`,
  geofencing: `Real-time zone alerts prevent most unauthorized movements. Customers report 75–90% reduction. Default set to ${d.geofencing}%.`,
  goodsReceipt: `RFID portal reads replace manual receiving checks. Customers report 75–90% time reduction. Default set to ${d.goodsReceipt}%.`,
  automatedPackCount: `RFID case reads replace manual scan-per-item counting. Customers report 75–90% time reduction. Default set to ${d.automatedPackCount}%.`,
  outboundAudit: `RFID portal reads certify shipments. Customers report 75–90% time reduction. Default set to ${d.outboundAudit}%.`,
  returnsTransfers: `RFID eliminates manual logging. Customers report 75–90% time reduction. Default set to ${d.returnsTransfers}%.`,
  inventoryRequests: `Automated triggers eliminate most manual request work. Customers report 75–90% reduction. Default set to ${d.inventoryRequests}%.`,
  shrinkage: `Real-time RFID visibility catches losses before write-off. Customers report 70–85% reduction. Default set to ${d.shrinkage}%.`,
  productionEquipment: `RFID location tracking prevents most tool downtime incidents. Customers report 70–85% reduction. Default set to ${d.productionEquipment}%.`,
  rtiTracking: `RFID tracking prevents most losses and replacement costs. Customers report 70–85% reduction. Default set to ${d.rtiTracking}%.`,
  proofOfDelivery: `RFID tag verification prevents most fraudulent return claims. Customers report 75–90% reduction. Default set to ${d.proofOfDelivery}%.`,
  misShipReduction: `Outbound RFID verification eliminates most mis-ships. Customers report 80–95% reduction. Default set to ${d.misShipReduction}%.`,
  dockTurnSpeed: `RFID portal reads accelerate dock throughput. Customers report 75–95% improvement. Default set to ${d.dockTurnSpeed}%.`,
  qualityExceptionTracking: `Xemelgo customers report 75–90% reduction in quality exceptions reaching rework. Default set to ${d.qualityExceptionTracking}%.`,
  expeditedExceptionTracking: `RFID exception flags catch at-risk priority orders early. Customers report 85–95% reduction. Default set to ${d.expeditedExceptionTracking}%.`,
  workingCapitalImprovement: `Facilities with real-time WIP visibility typically report 10–30% reductions in WIP inventory. Default set to ${d.workingCapitalImprovement}%.`,
};

const ROLE_DEFAULTS = {
  materialHandler: { hoursLostPerDay: 1.5, headcount: 10, rateKey: 'materialHandlerRate', countKey: 'materialHandlerCount' },
  planner:         { hoursLostPerDay: 0.5, headcount: 3,  rateKey: 'plannerRate', countKey: 'plannerCount' },
  indirect:        { hoursLostPerDay: 0.25, headcount: 5, rateKey: 'indirectRate', countKey: 'indirectCount' },
  direct:          { hoursLostPerDay: 1.0, headcount: 50, rateKey: 'directRate', countKey: 'directCount' },
};

const RATE_LABEL = 'Fully-loaded hourly rate (wages + benefits + overhead)';
const RATE_TOOLTIP = 'Your fully-loaded rate includes base wage plus benefits, payroll taxes, and overhead. Typically 1.3–1.5× base wage.';

// ─── Primitive input components ───────────────────────────────────────────
function Toggle({ checked, onChange }) {
  return (
    <button type="button" role="switch" aria-checked={checked}
      onClick={(e) => { e.stopPropagation(); onChange(!checked); }}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 flex-shrink-0 ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

function NumField({ label, value, onChange, prefix, suffix, tooltip }) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {tooltip && <Tooltip content={tooltip}><span className="ml-1 text-blue-400 cursor-help text-xs">ⓘ</span></Tooltip>}
      </label>
      <div className="flex items-center">
        {prefix && <span className="text-gray-400 mr-1 text-sm">{prefix}</span>}
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className={inputCls} />
        {suffix && <span className="text-gray-400 ml-1.5 text-xs">{suffix}</span>}
      </div>
    </div>
  );
}

function ReductionInput({ ucKey, uc, onUpdate }) {
  const note = SOURCE_NOTES[ucKey];
  return (
    <div>
      <div className="flex items-center gap-3">
        <RangeSlider min={0} max={100} value={Math.round(uc.reductionPct * 100)}
          onChange={(val) => onUpdate('reductionPct', val / 100)} className="flex-1" />
        <input type="number" min={0} max={100} value={Math.round(uc.reductionPct * 100)}
          onChange={(e) => onUpdate('reductionPct', Number(e.target.value) / 100)}
          className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <span className="text-sm text-gray-500">%</span>
      </div>
      {note && sourceNote(note)}
    </div>
  );
}

function JustificationField({ value, onChange, placeholder }) {
  return (
    <div>
      <label className={labelCls}>Justification <span className="text-gray-400 font-normal">(optional)</span></label>
      <textarea value={value || ''} onChange={(e) => onChange(e.target.value.slice(0, 150))}
        maxLength={150} rows={2} placeholder={placeholder || 'Based on observed operations…'} className={`${inputCls} resize-none`} />
      <div className="text-right text-xs text-gray-400 mt-0.5">{(value || '').length} / 150</div>
    </div>
  );
}

function CustomDriversSection({ drivers, onUpdate }) {
  function addDriver() {
    onUpdate([...drivers, { id: Date.now(), name: '', annualValue: '', justification: '' }]);
  }
  function removeDriver(id) {
    onUpdate(drivers.filter((d) => d.id !== id));
  }
  function updateDriver(id, field, value) {
    onUpdate(drivers.map((d) => d.id === id ? { ...d, [field]: value } : d));
  }
  return (
    <div>
      {drivers.map((drv) => (
        <div key={drv.id} className="border border-gray-200 rounded-lg p-3 mb-2 bg-gray-50 relative">
          <button type="button" onClick={() => removeDriver(drv.id)}
            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-sm leading-none" aria-label="Remove">×</button>
          <div className={grid2}>
            <div>
              <label className={labelCls}>Driver name</label>
              <input type="text" value={drv.name} placeholder="e.g. Overtime reduction"
                onChange={(e) => updateDriver(drv.id, 'name', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Annual value ($)</label>
              <div className="flex items-center">
                <span className="text-gray-400 mr-1 text-sm">$</span>
                <input type="number" value={drv.annualValue} placeholder="0"
                  onChange={(e) => updateDriver(drv.id, 'annualValue', e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} />
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Justification <span className="text-gray-400 font-normal">(optional)</span></label>
              <input type="text" value={drv.justification} placeholder="How was this value estimated?"
                onChange={(e) => updateDriver(drv.id, 'justification', e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>
      ))}
      <button type="button" onClick={addDriver}
        className="text-sm font-medium text-blue-600 hover:text-blue-700">+ Add custom driver</button>
    </div>
  );
}

// ─── Per-UC input bodies ──────────────────────────────────────────────────
function RoleTable({ rows, ops, onUpdate, labelHoursLost }) {
  function updateRow(id, field, value) {
    onUpdate('roleRows', rows.map((r) => r.id === id ? { ...r, [field]: value } : r));
  }
  function changeRole(id, role) {
    onUpdate('roleRows', rows.map((r) => {
      if (r.id !== id) return r;
      if (role === 'custom') return { ...r, role, customRoleName: r.customRoleName || '' };
      const rd = ROLE_DEFAULTS[role];
      return { ...r, role, headcount: ops[rd.countKey], burdenedRate: ops[rd.rateKey], hoursLostPerDay: rd.hoursLostPerDay };
    }));
  }
  function addRow(defaultRole, defaultHours) {
    onUpdate('roleRows', [...rows, { id: Date.now(), role: defaultRole, customRoleName: '', hoursLostPerDay: defaultHours, headcount: 10, burdenedRate: 25 }]);
  }
  function removeRow(id) {
    onUpdate('roleRows', rows.filter((r) => r.id !== id));
  }
  return (
    <div>
      {rows.map((row) => (
        <div key={row.id} className="relative border border-gray-100 rounded-lg p-3 bg-gray-50/50 mb-3">
          {rows.length > 1 && (
            <button type="button" onClick={() => removeRow(row.id)}
              className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-sm leading-none" aria-label="Remove role">×</button>
          )}
          <div className={grid2}>
            <div>
              <label className={labelCls}>Role</label>
              <select value={row.role} onChange={(e) => changeRole(row.id, e.target.value)} className={inputCls}>
                <option value="materialHandler">Material Handlers</option>
                <option value="planner">Planners</option>
                <option value="indirect">Indirect / Leadership</option>
                <option value="direct">Direct Employees</option>
                <option value="custom">Custom</option>
              </select>
              {row.role === 'custom' && (
                <input type="text" value={row.customRoleName} placeholder="Custom role name"
                  onChange={(e) => updateRow(row.id, 'customRoleName', e.target.value)} className={`${inputCls} mt-2`} />
              )}
            </div>
            <NumField label={labelHoursLost} value={row.hoursLostPerDay} onChange={(v) => updateRow(row.id, 'hoursLostPerDay', v)} />
            <NumField label="Number of people" value={row.headcount} onChange={(v) => updateRow(row.id, 'headcount', v)} />
            <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={row.burdenedRate} prefix="$" suffix="/hr" onChange={(v) => updateRow(row.id, 'burdenedRate', v)} />
          </div>
        </div>
      ))}
      <button type="button" onClick={() => addRow('materialHandler', 1.5)}
        className="text-sm font-medium text-blue-600 hover:text-blue-700">+ Add Role</button>
    </div>
  );
}

function UseCaseInputs({ ucKey, uc, ops, setOps, onUpdate, fin }) {
  const baseKey = getBaseUcKey(ucKey);
  if (baseKey === 'cycleCount') {
    const mode = uc.mode || 'reductionPct';
    return (
      <>
        <div className="mb-3">
          <label className={labelCls}>Calculation method</label>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden w-fit">
            <button type="button" onClick={() => onUpdate('mode', 'reductionPct')}
              className={`px-4 py-1.5 text-xs font-medium transition-colors ${mode === 'reductionPct' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Reduction %</button>
            <button type="button" onClick={() => onUpdate('mode', 'employeeDelta')}
              className={`px-4 py-1.5 text-xs font-medium transition-colors border-l border-gray-200 ${mode === 'employeeDelta' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>Employee Delta</button>
          </div>
        </div>
        {mode === 'reductionPct' ? (
          <>
            <div className={grid2}>
              <NumField label="Hours per count session" value={uc.hoursPerSession} onChange={(v) => onUpdate('hoursPerSession', v)} />
              <NumField label="Count sessions per week" value={uc.sessionsPerWeek} onChange={(v) => onUpdate('sessionsPerWeek', v)} />
              <NumField label="People counting simultaneously per session" value={uc.peoplePerSession} onChange={(v) => onUpdate('peoplePerSession', v)} />
              <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={uc.burdenedRate} prefix="$" suffix="/hr"
                onChange={(v) => { onUpdate('burdenedRate', v); setOps((p) => ({ ...p, plannerRate: v })); }} />
            </div>
            <div><label className={labelCls}>Expected time reduction with RFID</label><ReductionInput ucKey={baseKey} uc={uc} onUpdate={onUpdate} /></div>
          </>
        ) : (
          <div className={grid2}>
            <NumField label="Employees counting today (before)" value={uc.employeesBefore} onChange={(v) => onUpdate('employeesBefore', v)} />
            <NumField label="Hours per count (before)" value={uc.hoursPerCountBefore} onChange={(v) => onUpdate('hoursPerCountBefore', v)} />
            <NumField label="Employees after RFID" value={uc.employeesAfter} onChange={(v) => onUpdate('employeesAfter', v)} />
            <NumField label="Hours per count (after)" value={uc.hoursPerCountAfter} onChange={(v) => onUpdate('hoursPerCountAfter', v)} />
            <NumField label="Counts per year" value={uc.countsPerYear} onChange={(v) => onUpdate('countsPerYear', v)} />
            <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={uc.burdenedRate} prefix="$" suffix="/hr"
              onChange={(v) => { onUpdate('burdenedRate', v); setOps((p) => ({ ...p, plannerRate: v })); }} />
          </div>
        )}
      </>
    );
  }

  if (baseKey === 'audit') return (
    <>
      <div className={grid2}>
        <NumField label="People per audit" value={uc.people} onChange={(v) => onUpdate('people', v)} />
        <NumField label="Days per audit" value={uc.daysPerAudit} onChange={(v) => onUpdate('daysPerAudit', v)} />
        <NumField label="Hours per day" value={uc.hoursPerDay} onChange={(v) => onUpdate('hoursPerDay', v)} />
        <NumField label="Audits per year" value={uc.auditsPerYear} onChange={(v) => onUpdate('auditsPerYear', v)} />
        <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={uc.burdenedRate} prefix="$" suffix="/hr" onChange={(v) => onUpdate('burdenedRate', v)} />
        <div>
          <label className={labelCls}>Production downtime cost per audit day <span className="text-gray-400 font-normal">(optional)</span></label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span>
            <input type="number" value={uc.downtimeCostPerDay} placeholder="e.g. 5000"
              onChange={(e) => onUpdate('downtimeCostPerDay', e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} /></div>
        </div>
      </div>
      <div><label className={labelCls}>Expected labor reduction with RFID</label><ReductionInput ucKey={baseKey} uc={uc} onUpdate={onUpdate} /></div>
    </>
  );

  if (baseKey === 'locateItems') {
    const rows = uc.roleRows || [];
    const d1On = uc.driver1Enabled !== false;
    const d2On = uc.driver2Enabled !== false;
    return (
      <>
        <div className="space-y-3 mb-3">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
            <span className="text-xs font-medium text-gray-700">Driver 1 — Floor worker search time</span>
            <Toggle checked={d1On} onChange={(v) => onUpdate('driver1Enabled', v)} />
          </div>
          {d1On && (
            <div className="pl-3 border-l-2 border-blue-200 space-y-3">
              <RoleTable rows={rows} ops={ops} onUpdate={onUpdate} labelHoursLost="Hours lost searching per day" />
              <JustificationField value={uc.driver1Justification} onChange={(v) => onUpdate('driver1Justification', v)}
                placeholder="Based on observed floor walks with material handlers." />
            </div>
          )}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
            <span className="text-xs font-medium text-gray-700">Driver 2 — Supervisory visibility time</span>
            <Toggle checked={d2On} onChange={(v) => onUpdate('driver2Enabled', v)} />
          </div>
          {d2On && (
            <div className="pl-3 border-l-2 border-blue-200 space-y-3">
              {sourceNote('Hours supervisors spend manually checking on inventory locations each week. RFID dashboards eliminate most of this overhead.')}
              <div className={grid2}>
                <NumField label="Supervisor hours spent locating per week" value={uc.supervisorHoursPerWeek ?? 2} onChange={(v) => onUpdate('supervisorHoursPerWeek', v)} />
                <NumField label="Number of supervisors" value={uc.supervisorHeadcount ?? 2} onChange={(v) => onUpdate('supervisorHeadcount', v)} />
                <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={uc.supervisorBurdenedRate ?? 45} prefix="$" suffix="/hr" onChange={(v) => onUpdate('supervisorBurdenedRate', v)} />
              </div>
              <JustificationField value={uc.driver2Justification} onChange={(v) => onUpdate('driver2Justification', v)}
                placeholder="Supervisors confirm they spend ~2 hrs/week on manual location checks." />
            </div>
          )}
        </div>
        <div><label className={labelCls}>Expected reduction with RFID</label><ReductionInput ucKey={baseKey} uc={uc} onUpdate={onUpdate} /></div>
      </>
    );
  }

  if (baseKey === 'workOrderTracking') {
    const rows = uc.roleRows || [];
    const d1On = uc.driver1Enabled !== false;
    const d2On = uc.driver2Enabled !== false;
    return (
      <>
        <div className="space-y-3 mb-3">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
            <span className="text-xs font-medium text-gray-700">Driver 1 — Time spent manually tracking work orders</span>
            <Toggle checked={d1On} onChange={(v) => onUpdate('driver1Enabled', v)} />
          </div>
          {d1On && (
            <div className="pl-3 border-l-2 border-blue-200 space-y-3">
              <RoleTable rows={rows} ops={ops} onUpdate={onUpdate} labelHoursLost="Hours spent manually tracking status per day" />
              <JustificationField value={uc.driver1Justification} onChange={(v) => onUpdate('driver1Justification', v)}
                placeholder="Based on time studies with production planners." />
            </div>
          )}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
            <span className="text-xs font-medium text-gray-700">Driver 2 — Supervisor expediting visibility time</span>
            <Toggle checked={d2On} onChange={(v) => onUpdate('driver2Enabled', v)} />
          </div>
          {d2On && (
            <div className="pl-3 border-l-2 border-blue-200 space-y-3">
              {sourceNote('Hours supervisors spend manually checking on stalled or late work orders each week. RFID dwell-time flags automate this detection.')}
              <div className={grid2}>
                <NumField label="Supervisor hours spent expediting per week" value={uc.supervisorHoursPerWeek ?? 2} onChange={(v) => onUpdate('supervisorHoursPerWeek', v)} />
                <NumField label="Number of supervisors" value={uc.supervisorHeadcount ?? 2} onChange={(v) => onUpdate('supervisorHeadcount', v)} />
                <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={uc.supervisorBurdenedRate ?? 45} prefix="$" suffix="/hr" onChange={(v) => onUpdate('supervisorBurdenedRate', v)} />
              </div>
              <JustificationField value={uc.driver2Justification} onChange={(v) => onUpdate('driver2Justification', v)}
                placeholder="Supervisors confirm they spend ~2 hrs/week chasing late work orders." />
            </div>
          )}
        </div>
        <div><label className={labelCls}>Expected reduction in status checking time</label><ReductionInput ucKey={baseKey} uc={uc} onUpdate={onUpdate} /></div>
      </>
    );
  }

  if (baseKey === 'picklistVerification') {
    const d1On = uc.driver1Enabled !== false;
    const d2On = uc.driver2Enabled !== false;
    return (
      <>
        <div className={grid2}><NumField label="Picks per day" value={uc.picksPerDay} onChange={(v) => onUpdate('picksPerDay', v)} /></div>
        <div className="space-y-3 my-3">
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
            <span className="text-xs font-medium text-gray-700">Driver 1 — Error cost reduction</span>
            <Toggle checked={d1On} onChange={(v) => onUpdate('driver1Enabled', v)} />
          </div>
          {d1On && (
            <div className="pl-3 border-l-2 border-blue-200 space-y-3">
              <div className={grid2}>
                <NumField label="Error rate today (%)" value={uc.errorRate} onChange={(v) => onUpdate('errorRate', v)} />
                <div>
                  <label className={`${labelCls} flex items-center gap-1`}>Cost per error ($)
                    <Tooltip content="Include: labor to re-pick, return processing, replacement shipment cost, and any customer credit or chargeback.">
                      <span className="text-blue-400 cursor-help">ⓘ</span>
                    </Tooltip>
                  </label>
                  <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span>
                    <input type="number" value={uc.costPerError} onChange={(e) => onUpdate('costPerError', Number(e.target.value))} className={inputCls} /></div>
                </div>
              </div>
              <JustificationField value={uc.driver1Justification} onChange={(v) => onUpdate('driver1Justification', v)}
                placeholder="Error rate from last quarter's shipping audit." />
            </div>
          )}
          <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
            <span className="text-xs font-medium text-gray-700">Driver 2 — Time saved per pick</span>
            <Toggle checked={d2On} onChange={(v) => onUpdate('driver2Enabled', v)} />
          </div>
          {d2On && (
            <div className="pl-3 border-l-2 border-blue-200 space-y-3">
              {sourceNote('RFID scan-and-go verification removes manual barcode scanning per pick. Customers report 0.5–2 min saved per pick.')}
              <div className={grid2}>
                <NumField label="Minutes saved per pick" value={uc.minutesSavedPerPick ?? 1} onChange={(v) => onUpdate('minutesSavedPerPick', v)} />
                <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={uc.burdenedRate ?? 25} prefix="$" suffix="/hr" onChange={(v) => onUpdate('burdenedRate', v)} />
              </div>
              <JustificationField value={uc.driver2Justification} onChange={(v) => onUpdate('driver2Justification', v)}
                placeholder="Observed 90-second scan time per pick, target 30 seconds with RFID." />
            </div>
          )}
        </div>
        <div><label className={labelCls}>Expected error / time reduction with RFID</label><ReductionInput ucKey={baseKey} uc={uc} onUpdate={onUpdate} /></div>
      </>
    );
  }

  if (baseKey === 'shipReceiveVerification') return (
    <>
      <div className={grid2}>
        <NumField label="Minutes saved per dock transaction" value={uc.minutesSavedPerTransaction} onChange={(v) => onUpdate('minutesSavedPerTransaction', v)} />
        <NumField label="Dock transactions per day" value={uc.transactionsPerDay} onChange={(v) => onUpdate('transactionsPerDay', v)} />
        <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={uc.burdenedRate} prefix="$" suffix="/hr" onChange={(v) => onUpdate('burdenedRate', v)} />
      </div>
      <div><label className={labelCls}>Expected time reduction with RFID</label><ReductionInput ucKey={baseKey} uc={uc} onUpdate={onUpdate} /></div>
    </>
  );

  if (baseKey === 'internalDelivery') return (
    <>
      <div className={grid2}>
        <NumField label="Minutes per internal transfer" value={uc.minutesPerTransfer} onChange={(v) => onUpdate('minutesPerTransfer', v)} />
        <NumField label="Internal transfers per day" value={uc.transfersPerDay} onChange={(v) => onUpdate('transfersPerDay', v)} />
        <NumField label="People per transfer" value={uc.peoplePerTransfer} onChange={(v) => onUpdate('peoplePerTransfer', v)} />
        <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={uc.burdenedRate} prefix="$" suffix="/hr" onChange={(v) => onUpdate('burdenedRate', v)} />
      </div>
      <div><label className={labelCls}>Expected time reduction with RFID</label><ReductionInput ucKey={baseKey} uc={uc} onUpdate={onUpdate} /></div>
    </>
  );

  if (baseKey === 'expiredProducts') return (
    <>
      <div className={grid2}>
        <NumField label="Expired product incidents per year" value={uc.incidentsPerYear} onChange={(v) => onUpdate('incidentsPerYear', v)} />
        <div>
          <label className={`${labelCls} flex items-center gap-1`}>Avg write-off cost per incident ($)
            <Tooltip content="Include the cost of the expired product plus disposal fees, compliance costs, or production downtime."><span className="text-blue-400 cursor-help">ⓘ</span></Tooltip>
          </label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span>
            <input type="number" value={uc.costPerIncident} onChange={(e) => onUpdate('costPerIncident', Number(e.target.value))} className={inputCls} /></div>
        </div>
      </div>
      <div><label className={labelCls}>Expected reduction with RFID</label><ReductionInput ucKey={baseKey} uc={uc} onUpdate={onUpdate} /></div>
    </>
  );

  if (baseKey === 'calibrationReminders') return (
    <>
      <div className={grid2}>
        <NumField label="Missed calibrations per year" value={uc.failuresPerYear} onChange={(v) => onUpdate('failuresPerYear', v)} />
        <div>
          <label className={`${labelCls} flex items-center gap-1`}>Cost per missed calibration ($)
            <Tooltip content="Include equipment downtime, rework required, regulatory fine or audit penalty, and production delay."><span className="text-blue-400 cursor-help">ⓘ</span></Tooltip>
          </label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span>
            <input type="number" value={uc.costPerFailure} onChange={(e) => onUpdate('costPerFailure', Number(e.target.value))} className={inputCls} /></div>
        </div>
      </div>
      <div><label className={labelCls}>Expected reduction with RFID</label><ReductionInput ucKey={baseKey} uc={uc} onUpdate={onUpdate} /></div>
    </>
  );

  if (baseKey === 'geofencing') return (
    <>
      <div className={grid2}>
        <NumField label="Out-of-zone incidents per year" value={uc.incidentsPerYear} onChange={(v) => onUpdate('incidentsPerYear', v)} />
        <div>
          <label className={`${labelCls} flex items-center gap-1`}>Cost per incident ($)
            <Tooltip content="Include labor to locate and return the asset, compliance penalty, and production delay."><span className="text-blue-400 cursor-help">ⓘ</span></Tooltip>
          </label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span>
            <input type="number" value={uc.costPerIncident} onChange={(e) => onUpdate('costPerIncident', Number(e.target.value))} className={inputCls} /></div>
        </div>
      </div>
      <div><label className={labelCls}>Expected reduction with RFID</label><ReductionInput ucKey={baseKey} uc={uc} onUpdate={onUpdate} /></div>
    </>
  );

  if (baseKey === 'misShipReduction') return (
    <>
      <div className={grid2}>
        <NumField label="Mis-ships per month" value={uc.misShipsPerMonth} onChange={(v) => onUpdate('misShipsPerMonth', v)} />
        <div>
          <label className={`${labelCls} flex items-center gap-1`}>Cost per mis-ship ($)
            <Tooltip content="Include: return freight, replacement shipment, customer credit or chargeback, and labor to process the return."><span className="text-blue-400 cursor-help">ⓘ</span></Tooltip>
          </label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span>
            <input type="number" value={uc.costPerMisShip} onChange={(e) => onUpdate('costPerMisShip', Number(e.target.value))} className={inputCls} /></div>
        </div>
      </div>
      <div><label className={labelCls}>Expected reduction with RFID</label><ReductionInput ucKey={baseKey} uc={uc} onUpdate={onUpdate} /></div>
    </>
  );

  if (baseKey === 'dockTurnSpeed') return (
    <>
      <div className={grid2}>
        <NumField label="Minutes saved per dock transaction" value={uc.minutesSaved} onChange={(v) => onUpdate('minutesSaved', v)} />
        <NumField label="Dock transactions per day" value={uc.transactionsPerDay} onChange={(v) => onUpdate('transactionsPerDay', v)} />
        <NumField label="Number of dock staff" value={uc.dockStaff} onChange={(v) => onUpdate('dockStaff', v)} />
        <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={uc.burdenedRate} prefix="$" suffix="/hr" onChange={(v) => onUpdate('burdenedRate', v)} />
      </div>
      <div><label className={labelCls}>Expected improvement with RFID</label><ReductionInput ucKey={baseKey} uc={uc} onUpdate={onUpdate} /></div>
    </>
  );

  if (baseKey === 'goodsReceipt') return (
    <>
      <div className={grid2}>
        <NumField label="Minutes saved per receiving transaction" value={uc.minutesSavedPerTransaction} onChange={(v) => onUpdate('minutesSavedPerTransaction', v)} />
        <NumField label="Receiving transactions per day" value={uc.transactionsPerDay} onChange={(v) => onUpdate('transactionsPerDay', v)} />
        <NumField label="Number of receiving staff" value={uc.dockStaff} onChange={(v) => onUpdate('dockStaff', v)} />
        <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={uc.burdenedRate} prefix="$" suffix="/hr" onChange={(v) => onUpdate('burdenedRate', v)} />
      </div>
      <div><label className={labelCls}>Expected time reduction with RFID</label><ReductionInput ucKey={baseKey} uc={uc} onUpdate={onUpdate} /></div>
    </>
  );

  if (baseKey === 'automatedPackCount') return (
    <>
      <div className={grid2}>
        <NumField label="Minutes saved per pack count" value={uc.minutesSavedPerTransaction} onChange={(v) => onUpdate('minutesSavedPerTransaction', v)} />
        <NumField label="Pack counts per day" value={uc.transactionsPerDay} onChange={(v) => onUpdate('transactionsPerDay', v)} />
        <NumField label="Number of staff performing counts" value={uc.dockStaff} onChange={(v) => onUpdate('dockStaff', v)} />
        <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={uc.burdenedRate} prefix="$" suffix="/hr" onChange={(v) => onUpdate('burdenedRate', v)} />
      </div>
      <div><label className={labelCls}>Expected time reduction with RFID</label><ReductionInput ucKey={baseKey} uc={uc} onUpdate={onUpdate} /></div>
    </>
  );

  if (baseKey === 'outboundAudit') return (
    <>
      <div className={grid2}>
        <NumField label="Minutes saved per outbound shipment" value={uc.minutesSaved} onChange={(v) => onUpdate('minutesSaved', v)} />
        <NumField label="Outbound shipments per day" value={uc.transactionsPerDay} onChange={(v) => onUpdate('transactionsPerDay', v)} />
        <NumField label="Number of dock staff" value={uc.dockStaff} onChange={(v) => onUpdate('dockStaff', v)} />
        <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={uc.burdenedRate} prefix="$" suffix="/hr" onChange={(v) => onUpdate('burdenedRate', v)} />
      </div>
      <div><label className={labelCls}>Expected time reduction with RFID</label><ReductionInput ucKey={baseKey} uc={uc} onUpdate={onUpdate} /></div>
    </>
  );

  if (baseKey === 'returnsTransfers') return (
    <>
      <div className={grid2}>
        <NumField label="Minutes per return or transfer" value={uc.minutesPerTransfer} onChange={(v) => onUpdate('minutesPerTransfer', v)} />
        <NumField label="Returns and transfers per day" value={uc.transfersPerDay} onChange={(v) => onUpdate('transfersPerDay', v)} />
        <NumField label="People per transfer" value={uc.peoplePerTransfer} onChange={(v) => onUpdate('peoplePerTransfer', v)} />
        <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={uc.burdenedRate} prefix="$" suffix="/hr" onChange={(v) => onUpdate('burdenedRate', v)} />
      </div>
      <div><label className={labelCls}>Expected time reduction with RFID</label><ReductionInput ucKey={baseKey} uc={uc} onUpdate={onUpdate} /></div>
    </>
  );

  if (baseKey === 'inventoryRequests') return (
    <>
      <div className={grid2}>
        <NumField label="Hours per week spent managing requests" value={uc.hoursPerWeek} onChange={(v) => onUpdate('hoursPerWeek', v)} />
        <NumField label="People involved" value={uc.peopleInvolved} onChange={(v) => onUpdate('peopleInvolved', v)} />
        <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={uc.burdenedRate} prefix="$" suffix="/hr" onChange={(v) => onUpdate('burdenedRate', v)} />
      </div>
      <div><label className={labelCls}>Expected reduction with RFID</label><ReductionInput ucKey={baseKey} uc={uc} onUpdate={onUpdate} /></div>
    </>
  );

  if (baseKey === 'shrinkage') return (
    <>
      <div className={grid2}>
        <NumField label="Unexplained loss incidents per year" value={uc.incidentsPerYear} onChange={(v) => onUpdate('incidentsPerYear', v)} />
        <div>
          <label className={`${labelCls} flex items-center gap-1`}>Material / inventory value per incident ($)
            <Tooltip content="The replacement or book value of the lost or stolen inventory."><span className="text-blue-400 cursor-help">ⓘ</span></Tooltip>
          </label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span>
            <input type="number" value={uc.materialValuePerIncident} onChange={(e) => onUpdate('materialValuePerIncident', Number(e.target.value))} className={inputCls} /></div>
        </div>
        <NumField label="Investigation labor per incident (hrs)" value={uc.laborHoursPerIncident} onChange={(v) => onUpdate('laborHoursPerIncident', v)} />
        <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={uc.burdenedRate} prefix="$" suffix="/hr" onChange={(v) => onUpdate('burdenedRate', v)} />
        <div>
          <label className={labelCls}>Scrap or disposal cost per incident ($) <span className="text-gray-400 font-normal">(optional)</span></label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span>
            <input type="number" value={uc.scrapCostPerIncident} placeholder="e.g. 200"
              onChange={(e) => onUpdate('scrapCostPerIncident', e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} /></div>
        </div>
        <div>
          <label className={labelCls}>Schedule / production impact per incident ($) <span className="text-gray-400 font-normal">(optional)</span></label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span>
            <input type="number" value={uc.scheduleImpactPerIncident} placeholder="e.g. 1000"
              onChange={(e) => onUpdate('scheduleImpactPerIncident', e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} /></div>
        </div>
      </div>
      <div><label className={labelCls}>Expected reduction with RFID</label><ReductionInput ucKey={baseKey} uc={uc} onUpdate={onUpdate} /></div>
    </>
  );

  if (baseKey === 'productionEquipment') return (
    <>
      <div className={grid2}>
        <NumField label="Tool downtime incidents per year" value={uc.incidentsPerYear} onChange={(v) => onUpdate('incidentsPerYear', v)} />
        <div>
          <label className={`${labelCls} flex items-center gap-1`}>Avg cost per incident ($)
            <Tooltip content="Include production downtime cost, labor to locate the missing tool, and any expedite or rework costs."><span className="text-blue-400 cursor-help">ⓘ</span></Tooltip>
          </label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span>
            <input type="number" value={uc.costPerIncident} onChange={(e) => onUpdate('costPerIncident', Number(e.target.value))} className={inputCls} /></div>
        </div>
      </div>
      <div><label className={labelCls}>Expected reduction with RFID</label><ReductionInput ucKey={baseKey} uc={uc} onUpdate={onUpdate} /></div>
    </>
  );

  if (baseKey === 'rtiTracking') return (
    <>
      <div className={grid2}>
        <NumField label="Lost or untracked container incidents per year" value={uc.incidentsPerYear} onChange={(v) => onUpdate('incidentsPerYear', v)} />
        <div>
          <label className={`${labelCls} flex items-center gap-1`}>Avg cost per incident ($)
            <Tooltip content="Include the cost to replace the container plus any disruption to production flow."><span className="text-blue-400 cursor-help">ⓘ</span></Tooltip>
          </label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span>
            <input type="number" value={uc.costPerIncident} onChange={(e) => onUpdate('costPerIncident', Number(e.target.value))} className={inputCls} /></div>
        </div>
      </div>
      <div><label className={labelCls}>Expected reduction with RFID</label><ReductionInput ucKey={baseKey} uc={uc} onUpdate={onUpdate} /></div>
    </>
  );

  if (baseKey === 'proofOfDelivery') return (
    <>
      <div className={grid2}>
        <NumField label="Disputed or fraudulent delivery claims per year" value={uc.incidentsPerYear} onChange={(v) => onUpdate('incidentsPerYear', v)} />
        <div>
          <label className={`${labelCls} flex items-center gap-1`}>Avg cost per claim ($)
            <Tooltip content="Include the cost of replacement shipment, customer credit or chargeback, and labor to investigate."><span className="text-blue-400 cursor-help">ⓘ</span></Tooltip>
          </label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span>
            <input type="number" value={uc.costPerIncident} onChange={(e) => onUpdate('costPerIncident', Number(e.target.value))} className={inputCls} /></div>
        </div>
      </div>
      <div><label className={labelCls}>Expected reduction with RFID</label><ReductionInput ucKey={baseKey} uc={uc} onUpdate={onUpdate} /></div>
    </>
  );

  if (baseKey === 'qualityExceptionTracking') return (
    <>
      <div className={grid2}>
        <NumField label="Quality exceptions per year" value={uc.exceptionsPerYear} onChange={(v) => onUpdate('exceptionsPerYear', v)} />
        <NumField label="Avg rework cost per exception ($)" value={uc.reworkCostPerException} prefix="$" onChange={(v) => onUpdate('reworkCostPerException', v)} />
        <div>
          <label className={labelCls}>Avg scrap cost per exception ($) <span className="text-gray-400 font-normal">(optional)</span></label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span>
            <input type="number" value={uc.scrapCostPerException} placeholder="e.g. 500"
              onChange={(e) => onUpdate('scrapCostPerException', e.target.value === '' ? '' : Number(e.target.value))} className={inputCls} /></div>
        </div>
      </div>
      <div><label className={labelCls}>Expected reduction with RFID</label><ReductionInput ucKey={baseKey} uc={uc} onUpdate={onUpdate} /></div>
    </>
  );

  if (baseKey === 'expeditedExceptionTracking') return (
    <>
      <div className={grid2}>
        <NumField label="Late or missed shipments per month" value={uc.lateShipmentsPerMonth} onChange={(v) => onUpdate('lateShipmentsPerMonth', v)} />
        <div>
          <label className={`${labelCls} flex items-center gap-1`}>Avg cost per late shipment ($)
            <Tooltip content="Include expedited freight cost, customer penalty or chargeback, and labor to reroute or expedite."><span className="text-blue-400 cursor-help">ⓘ</span></Tooltip>
          </label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span>
            <input type="number" value={uc.costPerLateShipment} onChange={(e) => onUpdate('costPerLateShipment', Number(e.target.value))} className={inputCls} /></div>
        </div>
      </div>
      <div><label className={labelCls}>Expected reduction with RFID</label><ReductionInput ucKey={baseKey} uc={uc} onUpdate={onUpdate} /></div>
    </>
  );

  if (baseKey === 'workingCapitalImprovement') return (
    <>
      <div className={grid2}>
        <NumField label="Average WIP inventory value ($)" value={uc.wipInventoryValue} prefix="$" onChange={(v) => onUpdate('wipInventoryValue', v)} />
      </div>
      <div><label className={labelCls}>Expected WIP reduction with RFID</label><ReductionInput ucKey={baseKey} uc={uc} onUpdate={onUpdate} /></div>
      <p className="text-xs text-gray-400 italic mt-1">
        Uses your cost of capital assumption from Step 3 (currently {fin?.wacc != null ? `${(fin.wacc * 100).toFixed(1)}%` : '8.5%'}).
      </p>
    </>
  );

  if (baseKey === 'fasterFulfillment') return (
    <div className={grid2}>
      <NumField label="Current fulfillment cycle time (hrs)" value={uc.currentCycleTime} onChange={(v) => onUpdate('currentCycleTime', v)} />
      <NumField label="Target cycle time with RFID (hrs)" value={uc.targetCycleTime} onChange={(v) => onUpdate('targetCycleTime', v)} />
      <NumField label="Orders per month" value={uc.ordersPerMonth} onChange={(v) => onUpdate('ordersPerMonth', v)} />
      <NumField label="Avg revenue per order ($)" value={uc.revenuePerOrder} prefix="$" onChange={(v) => onUpdate('revenuePerOrder', v)} />
      <p className="text-xs text-gray-400 sm:col-span-2 mt-1">
        Uses a conservative 10% revenue capture rate.{' '}
        <Tooltip content="Not all cycle time improvement translates directly to revenue. A 10% conservative capture rate accounts for utilization limits and demand constraints.">
          <span className="text-blue-400 cursor-help">ⓘ</span>
        </Tooltip>
      </p>
    </div>
  );

  return null;
}

// ─── Main component ───────────────────────────────────────────────────────
export default function Step2_UseCases({ ops, setOps, fin, useCases, setUseCases, customCategories, setCustomCategories, onNext, onBack }) {
  const [selectedSolutions, setSelectedSolutions] = useState(new Set());
  const [osExpanded, setOsExpanded] = useState(false);
  const [collapsedUCs, setCollapsedUCs] = useState(new Set());

  function toggleCollapsed(key) {
    setCollapsedUCs((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function updateUC(key, field, value) {
    setUseCases((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  function toggleSolution(sol) {
    const next = new Set(selectedSolutions);
    if (next.has(sol.id)) {
      next.delete(sol.id);
      setSelectedSolutions(next);
      setUseCases((ucs) => {
        const updated = { ...ucs };
        sol.defaults.forEach((key) => { if (updated[key]) updated[key] = { ...updated[key], enabled: false }; });
        return updated;
      });
    } else {
      next.add(sol.id);
      setSelectedSolutions(next);
      setUseCases((ucs) => {
        const updated = { ...ucs };
        sol.defaults.forEach((key) => { if (updated[key]) updated[key] = { ...updated[key], enabled: true }; });
        return updated;
      });
    }
  }

  function toggleUseCase(key) {
    setUseCases((prev) => ({ ...prev, [key]: { ...prev[key], enabled: !prev[key]?.enabled } }));
  }

  const anySelected = selectedSolutions.size > 0;
  const selectedCount = Object.values(useCases).filter((uc) => uc?.enabled).length;
  const enabledCount = selectedCount + (customCategories || []).length;

  // Multi-driver UC keys (have per-driver justification)
  const MULTI_DRIVER_KEYS = new Set(['locateItems', 'workOrderTracking', 'picklistVerification']);

  return (
    <div className="max-w-2xl mx-auto pb-20 lg:pb-0">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Which Xemelgo solutions apply to you?</h2>
      <p className="text-sm text-gray-500 mb-6">Select all that apply. We'll pre-select the most relevant use cases and pre-fill inputs with Xemelgo benchmarks.</p>

      {/* Solution toggles */}
      <div className="space-y-3 mb-8">
        {SOLUTIONS.map((sol) => {
          const on = selectedSolutions.has(sol.id);
          const disabled = sol.status === 'comingSoon';
          return (
            <div key={sol.id} onClick={() => !disabled && toggleSolution(sol)} title={disabled ? 'Coming soon.' : undefined}
              className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${disabled ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed' : on ? 'border-blue-300 bg-blue-50 cursor-pointer' : 'border-gray-200 bg-white cursor-pointer'}`}>
              <Toggle checked={on} onChange={() => !disabled && toggleSolution(sol)} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${on ? 'text-gray-900' : 'text-gray-700'}`}>{sol.name}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{sol.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Operating Schedule — collapsible */}
      {anySelected && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm mb-6 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 cursor-pointer" onClick={() => setOsExpanded((v) => !v)}>
            <div>
              <p className="text-sm font-semibold text-gray-800">Operating Schedule</p>
              <p className="text-xs text-gray-400">{ops.workDaysPerWeek} days/wk · {ops.workWeeksPerYear} wks/yr · {ops.workDaysPerWeek * ops.workWeeksPerYear} days/yr</p>
            </div>
            <button type="button" className="text-xs text-blue-600 font-medium flex items-center gap-1">
              {osExpanded ? <>Collapse <span>▲</span></> : <>Adjust <span>▼</span></>}
            </button>
          </div>
          {osExpanded && (
            <div className="px-5 pb-5 border-t border-gray-100">
              <p className="text-xs text-gray-500 mt-3 mb-3">Applies to all use cases.</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={labelCls}>Working Days / Week</label>
                  <input type="number" value={ops.workDaysPerWeek} min={1} max={7}
                    onChange={(e) => setOps((p) => ({ ...p, workDaysPerWeek: Number(e.target.value) }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Working Weeks / Year</label>
                  <input type="number" value={ops.workWeeksPerYear} min={1} max={52}
                    onChange={(e) => setOps((p) => ({ ...p, workWeeksPerYear: Number(e.target.value) }))} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Days / Year (calculated)</label>
                  <div className="bg-gray-50 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">{ops.workDaysPerWeek * ops.workWeeksPerYear}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Use case groups */}
      {anySelected && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Customize your use cases</h3>
          <div className="space-y-6">
            {SOLUTIONS.filter((sol) => selectedSolutions.has(sol.id)).map((sol) => {
              const allKeys = [...sol.defaults, ...sol.extras];
              return (
                <div key={sol.id}>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{sol.name}</p>
                  <div className="space-y-2">
                    {allKeys.map((key) => {
                      const uc = useCases[key];
                      const enabled = uc?.enabled ?? false;
                      const reviewed = uc?.reviewed ?? false;
                      const isDefault = sol.defaults.includes(key);
                      const showInputs = enabled;
                      const annualValue = enabled ? calcUseCaseValue(key, uc, ops, fin) : null;
                      const baseKey = getBaseUcKey(key);

                      const isCollapsed = collapsedUCs.has(key);
                      return (
                        <div key={key} className={`rounded-lg border transition-colors ${reviewed && enabled ? 'border-green-300 bg-green-50' : enabled ? 'border-blue-200 bg-blue-50/40' : 'border-gray-200 bg-white'}`}>
                          {/* Toggle row */}
                          <div className="flex items-center gap-3 px-4 py-3">
                            <div className="cursor-pointer" onClick={() => toggleUseCase(key)}>
                              <Toggle checked={enabled} onChange={() => toggleUseCase(key)} />
                            </div>
                            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleUseCase(key)}>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-sm font-medium ${enabled ? 'text-gray-900' : 'text-gray-700'}`}>{UC_LABELS[baseKey] || key}</span>
                                {reviewed && enabled && <span className="text-xs font-medium text-green-600 bg-green-100 rounded px-1.5 py-0.5">Reviewed</span>}
                                {isDefault && <span className="text-xs text-blue-500 font-medium flex-shrink-0">default</span>}
                              </div>
                              {!showInputs && UC_DESCRIPTIONS[baseKey] && (
                                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{UC_DESCRIPTIONS[baseKey]}</p>
                              )}
                            </div>
                            {annualValue !== null && (
                              <span className="text-sm font-bold text-green-700 flex-shrink-0">{fmt$(annualValue)}</span>
                            )}
                            {showInputs && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); toggleCollapsed(key); }}
                                className="ml-1 p-1 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex-shrink-0 transition-colors"
                                aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                              >
                                <svg
                                  className={`w-4 h-4 transition-transform duration-150 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
                                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            )}
                          </div>

                          {/* Inline inputs — only under owning solution */}
                          {showInputs && !isCollapsed && (
                            <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-4">
                              <UseCaseInputs ucKey={key} uc={uc} ops={ops} setOps={setOps}
                                onUpdate={(field, value) => updateUC(key, field, value)} fin={fin} />

                              {/* Justification — single or per-driver */}
                              {!MULTI_DRIVER_KEYS.has(baseKey) && (
                                <JustificationField value={uc.justification}
                                  onChange={(v) => updateUC(key, 'justification', v)}
                                  placeholder="Based on 3 FTEs doing weekly cycle counts across 2 warehouses." />
                              )}

                              {/* Custom drivers */}
                              <CustomDriversSection
                                drivers={uc.customDrivers || []}
                                onUpdate={(drivers) => updateUC(key, 'customDrivers', drivers)} />

                              {/* Mark reviewed */}
                              <div className="pt-1 border-t border-gray-100 flex items-center justify-between">
                                {reviewed
                                  ? <span className="text-xs text-green-600 font-medium">✓ Marked as reviewed</span>
                                  : <span />}
                                <button type="button"
                                  onClick={() => updateUC(key, 'reviewed', !reviewed)}
                                  className={`text-xs font-medium ${reviewed ? 'text-gray-400 hover:text-gray-600' : 'text-blue-600 hover:text-blue-800'}`}>
                                  {reviewed ? 'Unmark reviewed' : 'Mark reviewed'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom savings categories */}
      {customCategories.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Custom Savings Categories</h3>
          <div className="space-y-3">
            {customCategories.map((cat) => (
              <div key={cat.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-gray-800">Custom Category</p>
                  <button type="button" onClick={() => setCustomCategories((prev) => prev.filter((c) => c.id !== cat.id))}
                    className="text-gray-400 hover:text-red-500 text-sm">✕ Remove</button>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className={labelCls}>Category name</label>
                    <input type="text" placeholder="e.g. Overtime reduction" value={cat.name}
                      onChange={(e) => setCustomCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, name: e.target.value } : c))} className={inputCls} />
                  </div>
                  <div>
                    <label className={labelCls}>Estimated annual savings ($)</label>
                    <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span>
                      <input type="number" value={cat.annualSavings} placeholder="0"
                        onChange={(e) => setCustomCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, annualSavings: e.target.value === '' ? '' : Number(e.target.value) } : c))} className={inputCls} /></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {anySelected && (
        <div className="mb-6">
          <button type="button"
            onClick={() => setCustomCategories((prev) => [...prev, { id: Date.now(), name: '', description: '', annualSavings: '' }])}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 border border-blue-300 hover:bg-blue-50 rounded-lg px-4 py-2 transition-colors">
            <span className="text-base leading-none">+</span> Add Custom Savings Category
          </button>
        </div>
      )}

      {/* Selected count summary */}
      <div className={`rounded-xl px-5 py-3 mb-6 border ${enabledCount > 0 ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
        <p className="text-sm text-gray-700">
          <span className={`font-semibold ${enabledCount > 0 ? 'text-blue-600' : 'text-gray-400'}`}>{enabledCount}</span>{' '}
          use case{enabledCount !== 1 ? 's' : ''} selected
        </p>
        {enabledCount === 0 && <p className="text-xs text-gray-400 mt-0.5">Select at least one solution to continue.</p>}
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-2.5 rounded-lg border border-gray-300 transition-colors">← Back</button>
        <button onClick={onNext} disabled={enabledCount === 0}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-2.5 rounded-lg transition-colors">
          Next: Financial Inputs →
        </button>
      </div>
    </div>
  );
}
