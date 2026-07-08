import { useState } from 'react';
import RangeSlider from '../RangeSlider';
import Tooltip from '../Tooltip';
import { fmt$ } from '../../utils/format';
import { calcUseCaseValue, BUCKET_CONFIG } from '../../utils/calculations';

const inputCls = 'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';
const labelCls = 'block text-xs font-medium text-gray-600 mb-1';
const grid2 = 'grid grid-cols-1 sm:grid-cols-2 gap-4';
const sourceNote = (text) => <p className="text-xs text-gray-400 italic mt-1">{text}</p>;

// Single source of truth for default reduction percentages (integer, 0–100).
// These must match the reductionPct values in makeAllDisabledUseCases() in App.jsx.
const UC_REDUCTION_DEFAULTS = {
  cycleCount:              98,
  audit:                   90,
  locateItems:             90,
  workOrderTracking:       85,
  picklistVerification:    95,
  shipReceiveVerification: 95,
  internalDelivery:        90,
  goodsReceipt:            90,
  automatedPackCount:      90,
  outboundAudit:           90,
  returnsTransfers:        90,
  inventoryRequests:       90,
  expiredProducts:         95,
  calibrationReminders:    95,
  geofencing:              90,
  shrinkage:               85,
  productionEquipment:     85,
  rtiTracking:             85,
  proofOfDelivery:         90,
  misShipReduction:        95,
  dockTurnSpeed:           95,
  qualityExceptionTracking:   85,
  expeditedExceptionTracking: 90,
  workingCapitalImprovement:  15,
};

const d = UC_REDUCTION_DEFAULTS;
const SOURCE_NOTES = {
  cycleCount:              `Xemelgo customers report 90–98% reduction in cycle count time. Default set to ${d.cycleCount}% — adjust down if you want to be conservative.`,
  audit:                   `Xemelgo customers report 75–90% reduction in full audit labor. Default set to ${d.audit}%.`,
  locateItems:             `Xemelgo customers report 70–90% reduction in search time across all roles. Default set to ${d.locateItems}%.`,
  workOrderTracking:       `RFID dwell time flags remove most manual status checking. Customers report 75–90% reduction. Default set to ${d.workOrderTracking}%.`,
  picklistVerification:    `Xemelgo customers see 80–95% reduction in pick errors. Default set to ${d.picklistVerification}%.`,
  shipReceiveVerification: `RFID portal reads replace manual dock scanning. Customers report 75–95% time reduction per transaction. Default set to ${d.shipReceiveVerification}%.`,
  internalDelivery:        `RFID eliminates manual confirmation steps at each hand-off point. Customers report 75–90% time reduction. Default set to ${d.internalDelivery}%.`,
  expiredProducts:         `Proactive expiration alerts eliminate most write-offs before they happen. Customers report 80–95% reduction. Default set to ${d.expiredProducts}%.`,
  calibrationReminders:    `Automated calibration alerts prevent most missed events. Customers report 80–95% reduction. Default set to ${d.calibrationReminders}%.`,
  geofencing:              `Real-time zone alerts prevent most unauthorized asset movements. Customers report 75–90% reduction. Default set to ${d.geofencing}%.`,
  goodsReceipt:            `RFID portal reads replace manual receiving checks. Customers report 75–90% time reduction per transaction. Default set to ${d.goodsReceipt}%.`,
  automatedPackCount:      `RFID case reads replace manual scan-per-item counting. Customers report 75–90% time reduction. Default set to ${d.automatedPackCount}%.`,
  outboundAudit:           `RFID portal reads certify shipments without manual scanning. Customers report 75–90% time reduction. Default set to ${d.outboundAudit}%.`,
  returnsTransfers:        `RFID eliminates manual logging at each transfer point. Customers report 75–90% time reduction. Default set to ${d.returnsTransfers}%.`,
  inventoryRequests:       `Automated replenishment triggers eliminate most manual request work. Customers report 75–90% reduction. Default set to ${d.inventoryRequests}%.`,
  shrinkage:               `Real-time RFID visibility catches unexplained losses before write-off. Customers report 70–85% reduction. Default set to ${d.shrinkage}%.`,
  productionEquipment:     `RFID location tracking prevents most tool downtime incidents. Customers report 70–85% reduction. Default set to ${d.productionEquipment}%.`,
  rtiTracking:             `RFID tracking of totes and containers prevents most losses and replacement costs. Customers report 70–85% reduction. Default set to ${d.rtiTracking}%.`,
  proofOfDelivery:         `RFID tag verification at delivery prevents most fraudulent return claims. Customers report 75–90% reduction. Default set to ${d.proofOfDelivery}%.`,
  misShipReduction:        `Outbound RFID verification eliminates most mis-ships at the dock door. Customers report 80–95% reduction. Default set to ${d.misShipReduction}%.`,
  dockTurnSpeed:           `RFID portal reads accelerate dock throughput. Customers report 75–95% improvement. Default set to ${d.dockTurnSpeed}%.`,
  qualityExceptionTracking:   `Xemelgo customers report 75–90% reduction in quality exceptions reaching rework. Default set to ${d.qualityExceptionTracking}%.`,
  expeditedExceptionTracking: `RFID exception flags catch at-risk priority orders before they miss their window. Customers report 85–95% reduction. Default set to ${d.expeditedExceptionTracking}%.`,
  workingCapitalImprovement:  `Facilities with real-time WIP visibility typically report 10–30% reductions in average work in process inventory. Default set to ${d.workingCapitalImprovement}%, the conservative end of that range.`,
};

const UC_DESCRIPTIONS = {
  cycleCount:              'Time saved on routine cycle counts via RFID.',
  audit:                   'Labor savings from faster full physical audits.',
  locateItems:             'Time eliminated searching for misplaced inventory or assets.',
  workOrderTracking:       'Supervisor and planner hours reclaimed by automating stalled job flagging.',
  picklistVerification:    'Pick error costs reduced with verification at point of pick.',
  shipReceiveVerification: 'Dock transaction time cut with portal-based RFID reads.',
  internalDelivery:        'Internal transfer confirmation time reduced across zones.',
  expiredProducts:         'Write-offs prevented with proactive expiration alerts.',
  calibrationReminders:    'Compliance failures avoided via automated calibration tracking.',
  geofencing:              'Asset loss prevented with real-time zone boundary alerts.',
  goodsReceipt:            'Receiving time reduced with portal-based RFID reads on inbound shipments.',
  automatedPackCount:      'Pack count time eliminated with RFID case-level reads.',
  outboundAudit:           'Outbound dock time cut with portal reads instead of manual scanning.',
  returnsTransfers:        'Transfer logging time eliminated across all internal hand-off points.',
  inventoryRequests:       'Manual replenishment request hours reclaimed with automated triggers.',
  qualityExceptionTracking:   'Rework labor, materials, and scrap avoided by catching quality issues at the source.',
  expeditedExceptionTracking: 'Rush freight and penalty costs avoided by catching at-risk priority orders early.',
  workingCapitalImprovement:  'Cash freed up by carrying less work in process inventory at any given moment.',
  shrinkage:               'Unexplained inventory loss reduced with real-time RFID visibility.',
  productionEquipment:     'Tool downtime incidents prevented with RFID location tracking.',
  rtiTracking:             'Tote and container loss reduced with RFID tracking.',
  proofOfDelivery:         'Fraudulent return claims prevented with RFID tag verification at delivery.',
  fasterFulfillment:       'Revenue captured from shorter order cycle times.',
  misShipReduction:        'Chargebacks and returns eliminated at the dock door.',
  dockTurnSpeed:           'Carrier wait costs reduced with faster dock transactions.',
};

const ROLE_DEFAULTS = {
  materialHandler: { hoursLostPerDay: 1.5, headcount: 10, rateKey: 'materialHandlerRate', countKey: 'materialHandlerCount' },
  planner:         { hoursLostPerDay: 0.5, headcount: 3,  rateKey: 'plannerRate',         countKey: 'plannerCount' },
  indirect:        { hoursLostPerDay: 0.25, headcount: 5, rateKey: 'indirectRate',         countKey: 'indirectCount' },
  direct:          { hoursLostPerDay: 1.0, headcount: 50, rateKey: 'directRate',           countKey: 'directCount' },
};

function ReductionInput({ ucKey, uc, onUpdate }) {
  const note = SOURCE_NOTES[ucKey];
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
      {note && sourceNote(note)}
    </div>
  );
}

const RATE_LABEL = 'Fully-loaded hourly rate (wages + benefits + overhead)';
const RATE_TOOLTIP = 'Your fully-loaded rate includes base wage plus benefits, payroll taxes, and overhead. Typically 1.3–1.5× base wage. Example: a $20/hr employee costs roughly $26–$30/hr fully loaded.';

function NumField({ label, value, onChange, prefix, suffix, tooltip }) {
  return (
    <div>
      <label className={labelCls}>
        {label}
        {tooltip && (
          <Tooltip content={tooltip}>
            <span className="ml-1 text-blue-400 cursor-help text-xs">ⓘ</span>
          </Tooltip>
        )}
      </label>
      <div className="flex items-center">
        {prefix && <span className="text-gray-400 mr-1 text-sm">{prefix}</span>}
        <input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className={inputCls} />
        {suffix && <span className="text-gray-400 ml-1.5 text-xs">{suffix}</span>}
      </div>
    </div>
  );
}

function UseCaseInputs({ ucKey, uc, ops, setOps, onUpdate, fin }) {
  if (ucKey === 'cycleCount') return (
    <>
      <div className={grid2}>
        <NumField label="Hours per count session" value={uc.hoursPerSession} onChange={(v) => onUpdate('hoursPerSession', v)} />
        <NumField label="Count sessions per week" value={uc.sessionsPerWeek} onChange={(v) => onUpdate('sessionsPerWeek', v)} />
        <NumField label="People counting simultaneously per session" value={uc.peoplePerSession} onChange={(v) => onUpdate('peoplePerSession', v)} />
        <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={uc.burdenedRate} prefix="$" suffix="/hr"
          onChange={(v) => { onUpdate('burdenedRate', v); setOps((prev) => ({ ...prev, plannerRate: v })); }} />
      </div>
      <div>
        <label className={labelCls}>Expected time reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate}  />
      </div>
    </>
  );

  if (ucKey === 'audit') return (
    <>
      <div className={grid2}>
        <NumField label="People per audit" value={uc.people} onChange={(v) => onUpdate('people', v)} />
        <NumField label="Days per audit" value={uc.daysPerAudit} onChange={(v) => onUpdate('daysPerAudit', v)} />
        <NumField label="Hours per day" value={uc.hoursPerDay} onChange={(v) => onUpdate('hoursPerDay', v)} />
        <NumField label="Audits per year" value={uc.auditsPerYear} onChange={(v) => onUpdate('auditsPerYear', v)} />
        <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={uc.burdenedRate} prefix="$" suffix="/hr" onChange={(v) => onUpdate('burdenedRate', v)} />
        <div>
          <label className={labelCls}>Production downtime cost per audit day <span className="text-gray-400 font-normal">(optional)</span></label>
          <div className="flex items-center">
            <span className="text-gray-400 mr-1 text-sm">$</span>
            <input
              type="number"
              value={uc.downtimeCostPerDay}
              onChange={(e) => onUpdate('downtimeCostPerDay', e.target.value === '' ? '' : Number(e.target.value))}
              className={inputCls}
              placeholder="e.g. 5000"
            />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">If your facility pauses production during audits, enter the estimated cost per day. Leave blank if not applicable.</p>
        </div>
      </div>
      <div>
        <label className={labelCls}>Expected labor reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate}  />
      </div>
    </>
  );

  if (ucKey === 'locateItems') {
    const rows = uc.roleRows || [];
    const updateRow = (id, field, value) => {
      onUpdate('roleRows', rows.map((r) => r.id === id ? { ...r, [field]: value } : r));
    };
    const changeRole = (id, role) => {
      onUpdate('roleRows', rows.map((r) => {
        if (r.id !== id) return r;
        if (role === 'custom') return { ...r, role, customRoleName: r.customRoleName || '' };
        const d = ROLE_DEFAULTS[role];
        return { ...r, role, headcount: ops[d.countKey], burdenedRate: ops[d.rateKey], hoursLostPerDay: d.hoursLostPerDay };
      }));
    };
    const addRow = () => onUpdate('roleRows', [...rows, { id: Date.now(), role: 'materialHandler', customRoleName: '', hoursLostPerDay: 1.5, headcount: 10, burdenedRate: 25 }]);
    const removeRow = (id) => onUpdate('roleRows', rows.filter((r) => r.id !== id));
    return (
      <>
        {rows.map((row) => (
          <div key={row.id} className="relative border border-gray-100 rounded-lg p-3 bg-gray-50/50">
            {rows.length > 1 && (
              <button type="button" onClick={() => removeRow(row.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-sm leading-none" aria-label="Remove role">×</button>
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
              <NumField label="Hours lost searching per day" value={row.hoursLostPerDay} onChange={(v) => updateRow(row.id, 'hoursLostPerDay', v)} />
              <NumField label="Number of people" value={row.headcount} onChange={(v) => updateRow(row.id, 'headcount', v)} />
              <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={row.burdenedRate} prefix="$" suffix="/hr" onChange={(v) => updateRow(row.id, 'burdenedRate', v)} />
            </div>
          </div>
        ))}
        <button type="button" onClick={addRow} className="text-sm font-medium text-blue-600 hover:text-blue-700">+ Add Role</button>
        <div>
          <label className={labelCls}>Expected reduction with RFID</label>
          <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate}  />
        </div>
      </>
    );
  }

  if (ucKey === 'workOrderTracking') {
    const rows = uc.roleRows || [];
    const updateRow = (id, field, value) => {
      onUpdate('roleRows', rows.map((r) => r.id === id ? { ...r, [field]: value } : r));
    };
    const changeRole = (id, role) => {
      onUpdate('roleRows', rows.map((r) => {
        if (r.id !== id) return r;
        if (role === 'custom') return { ...r, role, customRoleName: r.customRoleName || '' };
        const d = ROLE_DEFAULTS[role];
        return { ...r, role, headcount: ops[d.countKey], burdenedRate: ops[d.rateKey], hoursLostPerDay: d.hoursLostPerDay };
      }));
    };
    const addRow = () => onUpdate('roleRows', [...rows, { id: Date.now(), role: 'indirect', customRoleName: '', hoursLostPerDay: 0.5, headcount: 5, burdenedRate: 45 }]);
    const removeRow = (id) => onUpdate('roleRows', rows.filter((r) => r.id !== id));
    return (
      <>
        {rows.map((row) => (
          <div key={row.id} className="relative border border-gray-100 rounded-lg p-3 bg-gray-50/50">
            {rows.length > 1 && (
              <button type="button" onClick={() => removeRow(row.id)} className="absolute top-2 right-2 text-gray-400 hover:text-red-500 text-sm leading-none" aria-label="Remove role">×</button>
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
              <NumField label="Hours spent checking status per day" value={row.hoursLostPerDay} onChange={(v) => updateRow(row.id, 'hoursLostPerDay', v)} />
              <NumField label="Number of people" value={row.headcount} onChange={(v) => updateRow(row.id, 'headcount', v)} />
              <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={row.burdenedRate} prefix="$" suffix="/hr" onChange={(v) => updateRow(row.id, 'burdenedRate', v)} />
            </div>
          </div>
        ))}
        <button type="button" onClick={addRow} className="text-sm font-medium text-blue-600 hover:text-blue-700">+ Add Role</button>
        <div>
          <label className={labelCls}>Expected reduction in status checking time</label>
          <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
        </div>
      </>
    );
  }

  if (ucKey === 'picklistVerification') return (
    <>
      <div className={grid2}>
        <NumField label="Picks per day" value={uc.picksPerDay} onChange={(v) => onUpdate('picksPerDay', v)} />
        <NumField label="Error rate today (%)" value={uc.errorRate} onChange={(v) => onUpdate('errorRate', v)} />
        <div>
          <label className={`${labelCls} flex items-center gap-1`}>
            Cost per error ($)
            <Tooltip content="Include: labor to re-pick, return processing, replacement shipment cost, and any customer credit or chargeback. Typical range is $25–$200 per error depending on your operation.">
              <span className="text-blue-400 cursor-help">ⓘ</span>
            </Tooltip>
          </label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span><input type="number" value={uc.costPerError} onChange={(e) => onUpdate('costPerError', Number(e.target.value))} className={inputCls} /></div>
        </div>
      </div>
      <div>
        <label className={labelCls}>Expected error reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate}  />
      </div>
    </>
  );

  if (ucKey === 'shipReceiveVerification') return (
    <>
      <div className={grid2}>
        <NumField label="Minutes saved per dock transaction" value={uc.minutesSavedPerTransaction} onChange={(v) => onUpdate('minutesSavedPerTransaction', v)} />
        <NumField label="Dock transactions per day" value={uc.transactionsPerDay} onChange={(v) => onUpdate('transactionsPerDay', v)} />
        <NumField label="Number of dock staff" value={uc.dockStaff} onChange={(v) => onUpdate('dockStaff', v)} />
        <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={uc.burdenedRate} prefix="$" suffix="/hr" onChange={(v) => onUpdate('burdenedRate', v)} />
      </div>
      <div>
        <label className={labelCls}>Expected time reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate}  />
      </div>
    </>
  );

  if (ucKey === 'internalDelivery') return (
    <>
      <div className={grid2}>
        <NumField label="Minutes per internal transfer" value={uc.minutesPerTransfer} onChange={(v) => onUpdate('minutesPerTransfer', v)} />
        <NumField label="Internal transfers per day" value={uc.transfersPerDay} onChange={(v) => onUpdate('transfersPerDay', v)} />
        <NumField label="People per transfer" value={uc.peoplePerTransfer} onChange={(v) => onUpdate('peoplePerTransfer', v)} />
        <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={uc.burdenedRate} prefix="$" suffix="/hr" onChange={(v) => onUpdate('burdenedRate', v)} />
      </div>
      <div>
        <label className={labelCls}>Expected time reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate}  />
      </div>
    </>
  );

  if (ucKey === 'expiredProducts') return (
    <>
      <div className={grid2}>
        <NumField label="Expired product incidents per year" value={uc.incidentsPerYear} onChange={(v) => onUpdate('incidentsPerYear', v)} />
        <div>
          <label className={`${labelCls} flex items-center gap-1`}>
            Avg write-off cost per incident ($)
            <Tooltip content="Include the cost of the expired product itself plus any disposal fees, regulatory compliance costs, or production downtime caused by the shortage.">
              <span className="text-blue-400 cursor-help">ⓘ</span>
            </Tooltip>
          </label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span><input type="number" value={uc.costPerIncident} onChange={(e) => onUpdate('costPerIncident', Number(e.target.value))} className={inputCls} /></div>
        </div>
      </div>
      <div>
        <label className={labelCls}>Expected reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate}  />
      </div>
    </>
  );

  if (ucKey === 'calibrationReminders') return (
    <>
      <div className={grid2}>
        <NumField label="Missed calibrations per year" value={uc.failuresPerYear} onChange={(v) => onUpdate('failuresPerYear', v)} />
        <div>
          <label className={`${labelCls} flex items-center gap-1`}>
            Cost per missed calibration ($)
            <Tooltip content="Include equipment downtime cost, rework required, regulatory fine or audit penalty, and any production delay caused by the non-compliant asset being pulled from service.">
              <span className="text-blue-400 cursor-help">ⓘ</span>
            </Tooltip>
          </label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span><input type="number" value={uc.costPerFailure} onChange={(e) => onUpdate('costPerFailure', Number(e.target.value))} className={inputCls} /></div>
        </div>
      </div>
      <div>
        <label className={labelCls}>Expected reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate}  />
      </div>
    </>
  );

  if (ucKey === 'geofencing') return (
    <>
      <div className={grid2}>
        <NumField label="Out-of-zone incidents per year" value={uc.incidentsPerYear} onChange={(v) => onUpdate('incidentsPerYear', v)} />
        <div>
          <label className={`${labelCls} flex items-center gap-1`}>
            Cost per incident ($)
            <Tooltip content="Include labor to locate and return the asset, any compliance penalty incurred, and the cost of production delay or stoppage caused by the missing asset.">
              <span className="text-blue-400 cursor-help">ⓘ</span>
            </Tooltip>
          </label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span><input type="number" value={uc.costPerIncident} onChange={(e) => onUpdate('costPerIncident', Number(e.target.value))} className={inputCls} /></div>
        </div>
      </div>
      <div>
        <label className={labelCls}>Expected reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate}  />
      </div>
    </>
  );

  if (ucKey === 'misShipReduction') return (
    <>
      <div className={grid2}>
        <NumField label="Mis-ships per month" value={uc.misShipsPerMonth} onChange={(v) => onUpdate('misShipsPerMonth', v)} />
        <div>
          <label className={`${labelCls} flex items-center gap-1`}>
            Cost per mis-ship ($)
            <Tooltip content="Include: return freight, replacement shipment, customer credit or chargeback, and labor to process the return. Typical range is $100–$500 per incident.">
              <span className="text-blue-400 cursor-help">ⓘ</span>
            </Tooltip>
          </label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span><input type="number" value={uc.costPerMisShip} onChange={(e) => onUpdate('costPerMisShip', Number(e.target.value))} className={inputCls} /></div>
        </div>
      </div>
      <div>
        <label className={labelCls}>Expected reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate}  />
      </div>
    </>
  );

  if (ucKey === 'dockTurnSpeed') return (
    <>
      <div className={grid2}>
        <NumField label="Minutes saved per dock transaction" value={uc.minutesSaved} onChange={(v) => onUpdate('minutesSaved', v)} />
        <NumField label="Dock transactions per day" value={uc.transactionsPerDay} onChange={(v) => onUpdate('transactionsPerDay', v)} />
        <NumField label="Number of dock staff" value={uc.dockStaff} onChange={(v) => onUpdate('dockStaff', v)} />
        <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={uc.burdenedRate} prefix="$" suffix="/hr" onChange={(v) => onUpdate('burdenedRate', v)} />
      </div>
      <div>
        <label className={labelCls}>Expected improvement with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate}  />
      </div>
    </>
  );

  if (ucKey === 'goodsReceipt') return (
    <>
      <div className={grid2}>
        <NumField label="Minutes saved per receiving transaction" value={uc.minutesSavedPerTransaction} onChange={(v) => onUpdate('minutesSavedPerTransaction', v)} />
        <NumField label="Receiving transactions per day" value={uc.transactionsPerDay} onChange={(v) => onUpdate('transactionsPerDay', v)} />
        <NumField label="Number of receiving staff" value={uc.dockStaff} onChange={(v) => onUpdate('dockStaff', v)} />
        <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={uc.burdenedRate} prefix="$" suffix="/hr" onChange={(v) => onUpdate('burdenedRate', v)} />
      </div>
      <div>
        <label className={labelCls}>Expected time reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
      </div>
    </>
  );

  if (ucKey === 'automatedPackCount') return (
    <>
      <div className={grid2}>
        <NumField label="Minutes saved per pack count" value={uc.minutesSavedPerTransaction} onChange={(v) => onUpdate('minutesSavedPerTransaction', v)} />
        <NumField label="Pack counts per day" value={uc.transactionsPerDay} onChange={(v) => onUpdate('transactionsPerDay', v)} />
        <NumField label="Number of staff performing counts" value={uc.dockStaff} onChange={(v) => onUpdate('dockStaff', v)} />
        <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={uc.burdenedRate} prefix="$" suffix="/hr" onChange={(v) => onUpdate('burdenedRate', v)} />
      </div>
      <div>
        <label className={labelCls}>Expected time reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
      </div>
    </>
  );

  if (ucKey === 'outboundAudit') return (
    <>
      <div className={grid2}>
        <NumField label="Minutes saved per outbound shipment" value={uc.minutesSaved} onChange={(v) => onUpdate('minutesSaved', v)} />
        <NumField label="Outbound shipments per day" value={uc.transactionsPerDay} onChange={(v) => onUpdate('transactionsPerDay', v)} />
        <NumField label="Number of dock staff" value={uc.dockStaff} onChange={(v) => onUpdate('dockStaff', v)} />
        <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={uc.burdenedRate} prefix="$" suffix="/hr" onChange={(v) => onUpdate('burdenedRate', v)} />
      </div>
      <div>
        <label className={labelCls}>Expected time reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
      </div>
    </>
  );

  if (ucKey === 'returnsTransfers') return (
    <>
      <div className={grid2}>
        <NumField label="Minutes per return or transfer" value={uc.minutesPerTransfer} onChange={(v) => onUpdate('minutesPerTransfer', v)} />
        <NumField label="Returns and transfers per day" value={uc.transfersPerDay} onChange={(v) => onUpdate('transfersPerDay', v)} />
        <NumField label="People per transfer" value={uc.peoplePerTransfer} onChange={(v) => onUpdate('peoplePerTransfer', v)} />
        <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={uc.burdenedRate} prefix="$" suffix="/hr" onChange={(v) => onUpdate('burdenedRate', v)} />
      </div>
      <div>
        <label className={labelCls}>Expected time reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
      </div>
    </>
  );

  if (ucKey === 'inventoryRequests') return (
    <>
      <div className={grid2}>
        <NumField label="Hours per week spent managing requests" value={uc.hoursPerWeek} onChange={(v) => onUpdate('hoursPerWeek', v)} />
        <NumField label="People involved" value={uc.peopleInvolved} onChange={(v) => onUpdate('peopleInvolved', v)} />
        <NumField label={RATE_LABEL} tooltip={RATE_TOOLTIP} value={uc.burdenedRate} prefix="$" suffix="/hr" onChange={(v) => onUpdate('burdenedRate', v)} />
      </div>
      <div>
        <label className={labelCls}>Expected reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
      </div>
    </>
  );

  if (ucKey === 'shrinkage') return (
    <>
      <div className={grid2}>
        <NumField label="Unexplained loss incidents per year" value={uc.incidentsPerYear} onChange={(v) => onUpdate('incidentsPerYear', v)} />
        <div>
          <label className={`${labelCls} flex items-center gap-1`}>
            Avg cost per incident ($)
            <Tooltip content="Include the value of lost inventory plus any investigation or compliance costs associated with each shrinkage event.">
              <span className="text-blue-400 cursor-help">ⓘ</span>
            </Tooltip>
          </label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span><input type="number" value={uc.costPerIncident} onChange={(e) => onUpdate('costPerIncident', Number(e.target.value))} className={inputCls} /></div>
        </div>
      </div>
      <div>
        <label className={labelCls}>Expected reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
      </div>
    </>
  );

  if (ucKey === 'productionEquipment') return (
    <>
      <div className={grid2}>
        <NumField label="Tool downtime incidents per year" value={uc.incidentsPerYear} onChange={(v) => onUpdate('incidentsPerYear', v)} />
        <div>
          <label className={`${labelCls} flex items-center gap-1`}>
            Avg cost per incident ($)
            <Tooltip content="Include production downtime cost, labor to locate the missing tool, and any expedite or rework costs caused by the delay.">
              <span className="text-blue-400 cursor-help">ⓘ</span>
            </Tooltip>
          </label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span><input type="number" value={uc.costPerIncident} onChange={(e) => onUpdate('costPerIncident', Number(e.target.value))} className={inputCls} /></div>
        </div>
      </div>
      <div>
        <label className={labelCls}>Expected reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
      </div>
    </>
  );

  if (ucKey === 'rtiTracking') return (
    <>
      <div className={grid2}>
        <NumField label="Lost or untracked container incidents per year" value={uc.incidentsPerYear} onChange={(v) => onUpdate('incidentsPerYear', v)} />
        <div>
          <label className={`${labelCls} flex items-center gap-1`}>
            Avg cost per incident ($)
            <Tooltip content="Include the cost to replace the container plus any disruption to production flow caused by the missing tote or carrier.">
              <span className="text-blue-400 cursor-help">ⓘ</span>
            </Tooltip>
          </label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span><input type="number" value={uc.costPerIncident} onChange={(e) => onUpdate('costPerIncident', Number(e.target.value))} className={inputCls} /></div>
        </div>
      </div>
      <div>
        <label className={labelCls}>Expected reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
      </div>
    </>
  );

  if (ucKey === 'proofOfDelivery') return (
    <>
      <div className={grid2}>
        <NumField label="Disputed or fraudulent delivery claims per year" value={uc.incidentsPerYear} onChange={(v) => onUpdate('incidentsPerYear', v)} />
        <div>
          <label className={`${labelCls} flex items-center gap-1`}>
            Avg cost per claim ($)
            <Tooltip content="Include the cost of replacement shipment, customer credit or chargeback, and labor to investigate and resolve each disputed delivery.">
              <span className="text-blue-400 cursor-help">ⓘ</span>
            </Tooltip>
          </label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span><input type="number" value={uc.costPerIncident} onChange={(e) => onUpdate('costPerIncident', Number(e.target.value))} className={inputCls} /></div>
        </div>
      </div>
      <div>
        <label className={labelCls}>Expected reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
      </div>
    </>
  );

  if (ucKey === 'qualityExceptionTracking') return (
    <>
      <div className={grid2}>
        <NumField label="Quality exceptions per year" value={uc.exceptionsPerYear} onChange={(v) => onUpdate('exceptionsPerYear', v)} />
        <NumField label="Avg rework cost per exception ($)" value={uc.reworkCostPerException} prefix="$" onChange={(v) => onUpdate('reworkCostPerException', v)} />
        <div>
          <label className={labelCls}>Avg scrap cost per exception ($) <span className="text-gray-400 font-normal">(optional)</span></label>
          <div className="flex items-center">
            <span className="text-gray-400 mr-1 text-sm">$</span>
            <input
              type="number"
              value={uc.scrapCostPerException}
              onChange={(e) => onUpdate('scrapCostPerException', e.target.value === '' ? '' : Number(e.target.value))}
              className={inputCls}
              placeholder="e.g. 500"
            />
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Include if defective parts are scrapped rather than reworked. Leave blank if not applicable.</p>
        </div>
      </div>
      <div>
        <label className={labelCls}>Expected reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
      </div>
    </>
  );

  if (ucKey === 'expeditedExceptionTracking') return (
    <>
      <div className={grid2}>
        <NumField label="Late or missed shipments per month" value={uc.lateShipmentsPerMonth} onChange={(v) => onUpdate('lateShipmentsPerMonth', v)} />
        <div>
          <label className={`${labelCls} flex items-center gap-1`}>
            Avg cost per late shipment ($)
            <Tooltip content="Include expedited freight cost, customer penalty or chargeback, and any labor to reroute or expedite the order. Typical range is $200–$2,000 depending on your operation.">
              <span className="text-blue-400 cursor-help">ⓘ</span>
            </Tooltip>
          </label>
          <div className="flex items-center"><span className="text-gray-400 mr-1 text-sm">$</span><input type="number" value={uc.costPerLateShipment} onChange={(e) => onUpdate('costPerLateShipment', Number(e.target.value))} className={inputCls} /></div>
        </div>
      </div>
      <div>
        <label className={labelCls}>Expected reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
      </div>
    </>
  );

  if (ucKey === 'workingCapitalImprovement') return (
    <>
      <div className={grid2}>
        <NumField label="Average WIP inventory value ($)" value={uc.wipInventoryValue} prefix="$" onChange={(v) => onUpdate('wipInventoryValue', v)} />
      </div>
      <div>
        <label className={labelCls}>Expected WIP reduction with RFID</label>
        <ReductionInput ucKey={ucKey} uc={uc} onUpdate={onUpdate} />
      </div>
      <p className="text-xs text-gray-400 italic mt-1">
        Uses your cost of capital assumption from Step 4 (currently {fin?.wacc != null ? `${(fin.wacc * 100).toFixed(1)}%` : '8.5%'}).
      </p>
    </>
  );

  if (ucKey === 'fasterFulfillment') return (
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

function UseCaseCard({ ucKey, label, uc, ops, setOps, setUseCases, fin, interacted, onInteract, expanded, onToggle }) {
  const annualValue = calcUseCaseValue(ucKey, uc, ops, fin);
  const description = UC_DESCRIPTIONS[ucKey] || '';

  function onUpdate(field, value) {
    onInteract();
    setUseCases((prev) => ({ ...prev, [ucKey]: { ...prev[ucKey], [field]: value } }));
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-4">
      {/* Header — always visible */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-2 flex-1 min-w-0 mr-3">
          {interacted && (
            <svg className="w-4 h-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
            {!expanded && description && (
              <p className="text-xs text-gray-400 mt-0.5">{description}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-base font-bold text-green-700">{fmt$(annualValue)}</span>
          <button
            type="button"
            onClick={onToggle}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium whitespace-nowrap flex items-center gap-1 transition-colors"
          >
            {expanded ? (
              <>Collapse <span aria-hidden="true">▲</span></>
            ) : (
              <>Adjust <span aria-hidden="true">▼</span></>
            )}
          </button>
        </div>
      </div>
      {/* Expandable inputs */}
      {expanded && (
        <div className="px-5 pb-5 pt-1 space-y-4 border-t border-gray-100">
          <UseCaseInputs ucKey={ucKey} uc={uc} ops={ops} setOps={setOps} onUpdate={onUpdate} fin={fin} />
        </div>
      )}
    </div>
  );
}

const LABOR_KEYS = ['cycleCount', 'audit', 'locateItems', 'workOrderTracking', 'picklistVerification', 'shipReceiveVerification', 'internalDelivery', 'goodsReceipt', 'automatedPackCount', 'outboundAudit', 'returnsTransfers', 'inventoryRequests'];
const LOSS_KEYS = ['expiredProducts', 'calibrationReminders', 'geofencing', 'shrinkage', 'productionEquipment', 'rtiTracking', 'proofOfDelivery', 'qualityExceptionTracking'];
const REVENUE_KEYS = ['fasterFulfillment', 'misShipReduction', 'dockTurnSpeed', 'expeditedExceptionTracking'];
const CAPITAL_KEYS = ['workingCapitalImprovement'];

export default function Step3_ValidateInputs({ ops, setOps, useCases, setUseCases, fin, customCategories, setCustomCategories, onNext, onBack }) {
  const [interacted, setInteracted] = useState(new Set());
  const [expandedCards, setExpandedCards] = useState(new Set());

  function markInteracted(key) {
    setInteracted((prev) => {
      if (prev.has(key)) return prev;
      const next = new Set(prev);
      next.add(key);
      return next;
    });
  }

  function toggleExpanded(key) {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function updateCustomCategory(id, field, value) {
    setCustomCategories((prev) => prev.map((c) => c.id === id ? { ...c, [field]: value } : c));
  }
  function removeCustomCategory(id) {
    setCustomCategories((prev) => prev.filter((c) => c.id !== id));
  }

  const enabledCards = BUCKET_CONFIG.flatMap((b) =>
    b.keys
      .filter((key) => useCases[key]?.enabled)
      .map((key) => ({ key, label: b.labels[key] }))
  );

  const cats = customCategories || [];

  const totalGross = enabledCards.reduce((sum, { key }) => sum + calcUseCaseValue(key, useCases[key], ops, fin), 0)
    + cats.reduce((sum, c) => sum + (Number(c.annualSavings) || 0), 0);

  const ucCount = enabledCards.length + cats.length;
  const bucketCount = [
    enabledCards.some(({ key }) => LABOR_KEYS.includes(key)),
    enabledCards.some(({ key }) => LOSS_KEYS.includes(key)),
    enabledCards.some(({ key }) => REVENUE_KEYS.includes(key)),
    enabledCards.some(({ key }) => CAPITAL_KEYS.includes(key)),
    cats.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="max-w-2xl mx-auto pb-20 lg:pb-0">
      <h2 className="text-2xl font-bold text-gray-900 mb-1">Validate your inputs</h2>
      <p className="text-sm text-gray-500 mb-6">
        These are pre-filled with Xemelgo customer benchmarks. Adjust anything that doesn't match your reality.
      </p>

      {/* Operating Schedule */}
      <div className="bg-white rounded-xl shadow-md p-5 mb-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-1">Operating Schedule</h3>
        <p className="text-xs text-gray-500 mb-3">Applies to all use cases below.</p>
        <div className="grid grid-cols-3 gap-4">
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
            <label className={labelCls}>Working Weeks / Year</label>
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
            <label className={labelCls}>Working Days / Year (calculated)</label>
            <div className="bg-gray-50 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">
              {ops.workDaysPerWeek * ops.workWeeksPerYear}
            </div>
          </div>
        </div>
      </div>

      {/* Use Case Cards */}
      {enabledCards.length === 0 && cats.length === 0 && (
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
          fin={fin}
          interacted={interacted.has(key)}
          onInteract={() => markInteracted(key)}
          expanded={expandedCards.has(key)}
          onToggle={() => toggleExpanded(key)}
        />
      ))}

      {/* Custom Category Cards */}
      {cats.map((cat) => (
        <div key={cat.id} className="bg-white rounded-xl shadow-md overflow-hidden mb-4">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Custom Savings Category</h3>
            <button onClick={() => removeCustomCategory(cat.id)} className="text-gray-400 hover:text-red-500 text-sm">✕ Remove</button>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div>
              <label className={labelCls}>Category name</label>
              <input type="text" placeholder="e.g. Overtime reduction, Shrinkage prevention" value={cat.name}
                onChange={(e) => updateCustomCategory(cat.id, 'name', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Description <span className="text-gray-400">(optional)</span></label>
              <input type="text" placeholder="Brief description of how this saves money" value={cat.description}
                onChange={(e) => updateCustomCategory(cat.id, 'description', e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Estimated annual savings ($)</label>
              <div className="flex items-center">
                <span className="text-gray-400 mr-1 text-sm">$</span>
                <input type="number" value={cat.annualSavings}
                  onChange={(e) => updateCustomCategory(cat.id, 'annualSavings', e.target.value === '' ? '' : Number(e.target.value))}
                  className={inputCls} placeholder="0" />
              </div>
            </div>
          </div>
        </div>
      ))}

      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="bg-white hover:bg-gray-50 text-gray-700 font-medium px-6 py-2.5 rounded-lg border border-gray-300 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={onNext}
          disabled={enabledCards.length === 0 && cats.length === 0}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 py-2.5 rounded-lg transition-colors"
        >
          Next: Financial Inputs →
        </button>
      </div>

      {/* Running Total Bar — mobile only; desktop sidebar (LivePreviewBar) handles this */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-14 flex items-center px-6" style={{ backgroundColor: '#004FDB' }}>
        <span className="text-sm text-blue-200 mr-4">Your total estimated annual opportunity:</span>
        <span className="text-2xl font-bold text-white flex-1">{fmt$(totalGross)}</span>
        <span className="text-sm text-blue-200">{ucCount} use case{ucCount !== 1 ? 's' : ''} across {bucketCount} categor{bucketCount !== 1 ? 'ies' : 'y'}</span>
      </div>
    </div>
  );
}
