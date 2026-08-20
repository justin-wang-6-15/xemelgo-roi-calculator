// Formula display registry — one entry per base use case key.
// Each function returns { drivers: [{ label, enabled, lines, subtotal }], total }
// where total is the base formula result (custom drivers are added by the caller).

import {
  toAnnualFrequency,
  getDaysPerYear,
  calcLocateItemsDriver1,
  calcLocateItemsDriver2,
  calcWorkOrderTrackingDriver1,
  calcWorkOrderTrackingDriver2,
  calcPicklistDriver1,
  calcPicklistDriver2,
} from './calculations';

function fmtD(v) {
  return '$' + Math.round(Number(v) || 0).toLocaleString();
}
function fmtP(v) {
  return `${Math.round((Number(v) || 0) * 100)}%`;
}
function fmtN(v) {
  return (Number(v) || 0).toLocaleString();
}

const REGISTRY = {
  cycleCount: (uc, ops) => {
    const mode = uc.mode || 'reductionPct';
    let lines, subtotal;
    if (mode === 'employeeDelta') {
      subtotal = (uc.employeesBefore * uc.hoursPerCountBefore - uc.employeesAfter * uc.hoursPerCountAfter) * uc.countsPerYear * uc.burdenedRate;
      lines = [
        `Before: ${uc.employeesBefore} people × ${uc.hoursPerCountBefore} hrs per count`,
        `After: ${uc.employeesAfter} people × ${uc.hoursPerCountAfter} hrs per count`,
        `× ${uc.countsPerYear} counts per year × ${fmtD(uc.burdenedRate)}/hr`,
      ];
    } else {
      const annualFreq = toAnnualFrequency(uc.cycleFrequencyValue, uc.cycleFrequencyUnit, ops);
      subtotal = uc.hoursPerSession * annualFreq * uc.peoplePerSession * uc.burdenedRate * uc.reductionPct;
      lines = [
        `${uc.hoursPerSession} hrs per count session`,
        `× ${annualFreq} counts per year`,
        `× ${uc.peoplePerSession} people per session`,
        `× ${fmtD(uc.burdenedRate)}/hr labor cost`,
        `× ${fmtP(uc.reductionPct)} improvement from RFID`,
      ];
    }
    return { drivers: [{ label: 'Cycle Count Savings', enabled: true, lines, subtotal }], total: subtotal };
  },

  audit: (uc, ops) => {
    const annualAudits = toAnnualFrequency(uc.auditFrequencyValue, uc.auditFrequencyUnit, ops);
    const labor = uc.people * uc.daysPerAudit * uc.hoursPerDay * annualAudits * uc.burdenedRate * uc.reductionPct;
    const downtime = (uc.downtimeCostPerDay !== '' && Number(uc.downtimeCostPerDay) > 0)
      ? Number(uc.downtimeCostPerDay) * uc.daysPerAudit * annualAudits : 0;
    const subtotal = labor + downtime;
    const lines = [
      `${uc.people} people × ${uc.daysPerAudit} days × ${uc.hoursPerDay} hrs/day`,
      `× ${annualAudits} audits per year × ${fmtD(uc.burdenedRate)}/hr`,
      `× ${fmtP(uc.reductionPct)} improvement from RFID`,
    ];
    if (downtime > 0) {
      lines.push(`+ ${fmtD(uc.downtimeCostPerDay)}/day downtime avoided × ${uc.daysPerAudit} days × ${annualAudits} audits`);
    }
    return { drivers: [{ label: 'Audit Labor Savings', enabled: true, lines, subtotal }], total: subtotal };
  },

  locateItems: (uc, ops) => {
    const daysPerYear = getDaysPerYear(ops);
    const d1Enabled = uc.driver1Enabled !== false;
    const d2Enabled = uc.driver2Enabled !== false;
    const d1Sub = calcLocateItemsDriver1(uc, ops);
    const d2Sub = calcLocateItemsDriver2(uc, ops);

    const d1Lines = [];
    (uc.roleRows || []).forEach((row) => {
      d1Lines.push(`${row.hoursLostPerDay} hrs/day × ${row.headcount} people × ${fmtN(daysPerYear)} work days × ${fmtD(row.burdenedRate)}/hr`);
    });
    d1Lines.push(`× ${fmtP(uc.reductionPct)} improvement from RFID`);

    const d2Lines = [
      `${uc.supervisorHoursPerWeek ?? 2} hrs/week × ${uc.supervisorHeadcount ?? 2} supervisors`,
      `× ${ops.workWeeksPerYear} weeks/year × ${fmtD(uc.supervisorBurdenedRate ?? 45)}/hr`,
      `× ${fmtP(uc.reductionPct)} improvement from RFID`,
    ];

    return {
      drivers: [
        { label: 'Driver 1 — Floor worker search time', enabled: d1Enabled, lines: d1Lines, subtotal: d1Sub },
        { label: 'Driver 2 — Supervisory visibility time', enabled: d2Enabled, lines: d2Lines, subtotal: d2Sub },
      ],
      total: d1Sub + d2Sub,
    };
  },

  workOrderTracking: (uc, ops) => {
    const daysPerYear = getDaysPerYear(ops);
    const d1Enabled = uc.driver1Enabled !== false;
    const d2Enabled = uc.driver2Enabled !== false;
    const d1Sub = calcWorkOrderTrackingDriver1(uc, ops);
    const d2Sub = calcWorkOrderTrackingDriver2(uc, ops);

    const d1Lines = [];
    (uc.roleRows || []).forEach((row) => {
      d1Lines.push(`${row.hoursLostPerDay} hrs/day × ${row.headcount} people × ${fmtN(daysPerYear)} work days × ${fmtD(row.burdenedRate)}/hr`);
    });
    d1Lines.push(`× ${fmtP(uc.reductionPct)} improvement from RFID`);

    const d2Lines = [
      `${uc.supervisorHoursPerWeek ?? 2} hrs/week × ${uc.supervisorHeadcount ?? 2} supervisors`,
      `× ${ops.workWeeksPerYear} weeks/year × ${fmtD(uc.supervisorBurdenedRate ?? 45)}/hr`,
      `× ${fmtP(uc.reductionPct)} improvement from RFID`,
    ];

    return {
      drivers: [
        { label: 'Driver 1 — Time spent manually tracking work orders', enabled: d1Enabled, lines: d1Lines, subtotal: d1Sub },
        { label: 'Driver 2 — Supervisor expediting visibility time', enabled: d2Enabled, lines: d2Lines, subtotal: d2Sub },
      ],
      total: d1Sub + d2Sub,
    };
  },

  picklistVerification: (uc, ops) => {
    const daysPerYear = getDaysPerYear(ops);
    const d1Enabled = uc.driver1Enabled !== false;
    const d2Enabled = uc.driver2Enabled !== false;
    const d1Sub = calcPicklistDriver1(uc, ops);
    const d2Sub = calcPicklistDriver2(uc, ops);

    const d1Lines = [
      `${uc.picksPerDay} picks/day × ${uc.errorRate}% error rate × ${fmtD(uc.costPerError)} cost per error`,
      `× ${fmtN(daysPerYear)} work days × ${fmtP(uc.reductionPct)} improvement from RFID`,
    ];

    const d2Lines = [
      `${uc.minutesSavedPerPick ?? 1} min saved per pick × ${uc.picksPerDay} picks/day`,
      `× ${fmtN(daysPerYear)} work days × ${fmtD(uc.burdenedRate ?? 25)}/hr × ${fmtP(uc.reductionPct)} improvement`,
    ];

    return {
      drivers: [
        { label: 'Driver 1 — Error cost reduction', enabled: d1Enabled, lines: d1Lines, subtotal: d1Sub },
        { label: 'Driver 2 — Time saved per pick', enabled: d2Enabled, lines: d2Lines, subtotal: d2Sub },
      ],
      total: d1Sub + d2Sub,
    };
  },

  shipReceiveVerification: (uc, ops) => {
    const daysPerYear = getDaysPerYear(ops);
    const subtotal = (uc.minutesSavedPerTransaction / 60) * uc.transactionsPerDay * daysPerYear * uc.burdenedRate * uc.reductionPct;
    const lines = [
      `${uc.minutesSavedPerTransaction} min saved per transaction × ${uc.transactionsPerDay}/day`,
      `× ${fmtN(daysPerYear)} work days × ${fmtD(uc.burdenedRate)}/hr`,
      `× ${fmtP(uc.reductionPct)} improvement from RFID`,
    ];
    return { drivers: [{ label: 'Dock Time Savings', enabled: true, lines, subtotal }], total: subtotal };
  },

  internalDelivery: (uc, ops) => {
    const daysPerYear = getDaysPerYear(ops);
    const subtotal = (uc.minutesPerTransfer / 60) * uc.transfersPerDay * uc.peoplePerTransfer * daysPerYear * uc.burdenedRate * uc.reductionPct;
    const lines = [
      `${uc.minutesPerTransfer} min per transfer × ${uc.transfersPerDay}/day`,
      `× ${uc.peoplePerTransfer} people per transfer × ${fmtN(daysPerYear)} work days × ${fmtD(uc.burdenedRate)}/hr`,
      `× ${fmtP(uc.reductionPct)} improvement from RFID`,
    ];
    return { drivers: [{ label: 'Delivery Labor Savings', enabled: true, lines, subtotal }], total: subtotal };
  },

  goodsReceipt: (uc, ops) => {
    const daysPerYear = getDaysPerYear(ops);
    const subtotal = (uc.minutesSavedPerTransaction / 60) * uc.transactionsPerDay * uc.dockStaff * daysPerYear * uc.burdenedRate * uc.reductionPct;
    const lines = [
      `${uc.minutesSavedPerTransaction} min saved per transaction × ${uc.transactionsPerDay}/day`,
      `× ${uc.dockStaff} receiving staff × ${fmtN(daysPerYear)} work days × ${fmtD(uc.burdenedRate)}/hr`,
      `× ${fmtP(uc.reductionPct)} improvement from RFID`,
    ];
    return { drivers: [{ label: 'Receiving Labor Savings', enabled: true, lines, subtotal }], total: subtotal };
  },

  automatedPackCount: (uc, ops) => {
    const daysPerYear = getDaysPerYear(ops);
    const subtotal = (uc.minutesSavedPerTransaction / 60) * uc.transactionsPerDay * uc.dockStaff * daysPerYear * uc.burdenedRate * uc.reductionPct;
    const lines = [
      `${uc.minutesSavedPerTransaction} min saved per pack count × ${uc.transactionsPerDay}/day`,
      `× ${uc.dockStaff} staff × ${fmtN(daysPerYear)} work days × ${fmtD(uc.burdenedRate)}/hr`,
      `× ${fmtP(uc.reductionPct)} improvement from RFID`,
    ];
    return { drivers: [{ label: 'Pack Count Labor Savings', enabled: true, lines, subtotal }], total: subtotal };
  },

  outboundAudit: (uc, ops) => {
    const daysPerYear = getDaysPerYear(ops);
    const subtotal = (uc.minutesSaved / 60) * uc.transactionsPerDay * uc.dockStaff * daysPerYear * uc.burdenedRate * uc.reductionPct;
    const lines = [
      `${uc.minutesSaved} min saved per shipment × ${uc.transactionsPerDay}/day`,
      `× ${uc.dockStaff} dock staff × ${fmtN(daysPerYear)} work days × ${fmtD(uc.burdenedRate)}/hr`,
      `× ${fmtP(uc.reductionPct)} improvement from RFID`,
    ];
    return { drivers: [{ label: 'Outbound Audit Labor Savings', enabled: true, lines, subtotal }], total: subtotal };
  },

  returnsTransfers: (uc, ops) => {
    const daysPerYear = getDaysPerYear(ops);
    const subtotal = (uc.minutesPerTransfer / 60) * uc.transfersPerDay * uc.peoplePerTransfer * daysPerYear * uc.burdenedRate * uc.reductionPct;
    const lines = [
      `${uc.minutesPerTransfer} min per return/transfer × ${uc.transfersPerDay}/day`,
      `× ${uc.peoplePerTransfer} people per transfer × ${fmtN(daysPerYear)} work days × ${fmtD(uc.burdenedRate)}/hr`,
      `× ${fmtP(uc.reductionPct)} improvement from RFID`,
    ];
    return { drivers: [{ label: 'Returns & Transfer Labor Savings', enabled: true, lines, subtotal }], total: subtotal };
  },

  inventoryRequests: (uc, ops) => {
    const subtotal = uc.hoursPerWeek * uc.peopleInvolved * ops.workWeeksPerYear * uc.burdenedRate * uc.reductionPct;
    const lines = [
      `${uc.hoursPerWeek} hrs/week × ${uc.peopleInvolved} people`,
      `× ${ops.workWeeksPerYear} weeks/year × ${fmtD(uc.burdenedRate)}/hr`,
      `× ${fmtP(uc.reductionPct)} improvement from RFID`,
    ];
    return { drivers: [{ label: 'Request Management Savings', enabled: true, lines, subtotal }], total: subtotal };
  },

  expiredProducts: (uc) => {
    const subtotal = uc.incidentsPerYear * uc.costPerIncident * uc.reductionPct;
    const lines = [
      `${fmtN(uc.incidentsPerYear)} per year × ${fmtD(uc.costPerIncident)} per incident`,
      `× ${fmtP(uc.reductionPct)} improvement from RFID`,
    ];
    return { drivers: [{ label: 'Expired Product Write-off Reduction', enabled: true, lines, subtotal }], total: subtotal };
  },

  calibrationReminders: (uc) => {
    const subtotal = uc.failuresPerYear * uc.costPerFailure * uc.reductionPct;
    const lines = [
      `${fmtN(uc.failuresPerYear)} per year × ${fmtD(uc.costPerFailure)} per missed calibration`,
      `× ${fmtP(uc.reductionPct)} improvement from RFID`,
    ];
    return { drivers: [{ label: 'Calibration Failure Reduction', enabled: true, lines, subtotal }], total: subtotal };
  },

  shrinkage: (uc) => {
    const materialValue = uc.materialValuePerIncident ?? uc.costPerIncident ?? 0;
    const perIncident = materialValue
      + (uc.laborHoursPerIncident || 0) * (uc.burdenedRate || 0)
      + (Number(uc.scrapCostPerIncident) || 0)
      + (Number(uc.scheduleImpactPerIncident) || 0);
    const subtotal = uc.incidentsPerYear * perIncident * uc.reductionPct;
    const lines = [
      `${fmtN(uc.incidentsPerYear)} incidents per year`,
      `× (${fmtD(materialValue)} material value + ${uc.laborHoursPerIncident || 0} hrs × ${fmtD(uc.burdenedRate)}/hr labor)`,
    ];
    if (Number(uc.scrapCostPerIncident) > 0) lines.push(`+ ${fmtD(uc.scrapCostPerIncident)} scrap cost per incident`);
    if (Number(uc.scheduleImpactPerIncident) > 0) lines.push(`+ ${fmtD(uc.scheduleImpactPerIncident)} schedule impact per incident`);
    lines.push(`× ${fmtP(uc.reductionPct)} improvement from RFID`);
    return { drivers: [{ label: 'Shrinkage Loss Reduction', enabled: true, lines, subtotal }], total: subtotal };
  },

  productionEquipment: (uc) => {
    const subtotal = uc.incidentsPerYear * uc.costPerIncident * uc.reductionPct;
    const lines = [
      `${fmtN(uc.incidentsPerYear)} per year × ${fmtD(uc.costPerIncident)} per incident`,
      `× ${fmtP(uc.reductionPct)} improvement from RFID`,
    ];
    return { drivers: [{ label: 'Equipment Downtime Reduction', enabled: true, lines, subtotal }], total: subtotal };
  },

  rtiTracking: (uc) => {
    const subtotal = uc.incidentsPerYear * uc.costPerIncident * uc.reductionPct;
    const lines = [
      `${fmtN(uc.incidentsPerYear)} per year × ${fmtD(uc.costPerIncident)} per incident`,
      `× ${fmtP(uc.reductionPct)} improvement from RFID`,
    ];
    return { drivers: [{ label: 'Container Loss Reduction', enabled: true, lines, subtotal }], total: subtotal };
  },

  proofOfDelivery: (uc) => {
    const subtotal = uc.incidentsPerYear * uc.costPerIncident * uc.reductionPct;
    const lines = [
      `${fmtN(uc.incidentsPerYear)} per year × ${fmtD(uc.costPerIncident)} per claim`,
      `× ${fmtP(uc.reductionPct)} improvement from RFID`,
    ];
    return { drivers: [{ label: 'Fraudulent Claim Reduction', enabled: true, lines, subtotal }], total: subtotal };
  },

  qualityExceptionTracking: (uc) => {
    const subtotal = uc.exceptionsPerYear * uc.reductionPct * (uc.reworkCostPerException + (Number(uc.scrapCostPerException) || 0));
    const lines = [
      `${fmtN(uc.exceptionsPerYear)} exceptions per year`,
      `× (${fmtD(uc.reworkCostPerException)} rework cost${Number(uc.scrapCostPerException) > 0 ? ` + ${fmtD(uc.scrapCostPerException)} scrap cost` : ''})`,
      `× ${fmtP(uc.reductionPct)} improvement from RFID`,
    ];
    return { drivers: [{ label: 'Quality Exception Reduction', enabled: true, lines, subtotal }], total: subtotal };
  },

  expeditedExceptionTracking: (uc) => {
    const subtotal = uc.lateShipmentsPerMonth * 12 * uc.costPerLateShipment * uc.reductionPct;
    const lines = [
      `${uc.lateShipmentsPerMonth} late shipments/month × 12 months`,
      `× ${fmtD(uc.costPerLateShipment)} per late shipment × ${fmtP(uc.reductionPct)} improvement`,
    ];
    return { drivers: [{ label: 'Late Shipment Cost Reduction', enabled: true, lines, subtotal }], total: subtotal };
  },

  fasterFulfillment: (uc) => {
    const improvementPct = uc.currentCycleTime > 0
      ? (uc.currentCycleTime - uc.targetCycleTime) / uc.currentCycleTime : 0;
    const subtotal = uc.currentCycleTime > 0
      ? improvementPct * uc.ordersPerMonth * 12 * uc.revenuePerOrder * 0.10 : 0;
    const lines = [
      `Cuts cycle time from ${uc.currentCycleTime} to ${uc.targetCycleTime} hours (${Math.round(improvementPct * 100)}% faster)`,
      `× ${uc.ordersPerMonth} orders/month × 12 months × ${fmtD(uc.revenuePerOrder)}/order`,
      `× 10% margin captured on the extra orders this unlocks`,
    ];
    return {
      drivers: [{ label: 'Revenue Opportunity', enabled: true, lines, subtotal, note: 'This is the only driver based on new revenue rather than cost savings. The 10% margin assumption is fixed and can\'t be adjusted here.' }],
      total: subtotal,
    };
  },

  misShipReduction: (uc) => {
    const subtotal = uc.misShipsPerMonth * 12 * uc.costPerMisShip * uc.reductionPct;
    const lines = [
      `${uc.misShipsPerMonth} mis-ships/month × 12 months`,
      `× ${fmtD(uc.costPerMisShip)} per mis-ship × ${fmtP(uc.reductionPct)} improvement`,
    ];
    return { drivers: [{ label: 'Mis-Ship Cost Reduction', enabled: true, lines, subtotal }], total: subtotal };
  },

  workingCapitalImprovement: (uc, ops, fin) => {
    const wacc = fin?.wacc ?? 0.085;
    const subtotal = uc.wipInventoryValue * uc.reductionPct * wacc;
    const lines = [
      `${fmtD(uc.wipInventoryValue)} tied up in work in process inventory`,
      `× ${fmtP(uc.reductionPct)} reduction from better visibility`,
      `× ${Math.round(wacc * 100)}% cost of capital (from Financial Inputs, defaults to 8.5%)`,
    ];
    return { drivers: [{ label: 'Working Capital Freed', enabled: true, lines, subtotal }], total: subtotal };
  },
};

export function getFormulaEntry(baseKey, uc, ops, fin) {
  const fn = REGISTRY[baseKey];
  if (!fn) return null;
  try {
    return fn(uc, ops, fin);
  } catch {
    return null;
  }
}
