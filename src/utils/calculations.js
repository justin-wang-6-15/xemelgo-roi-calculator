// src/utils/calculations.js

export function calcUseCaseValue(key, uc, ops, fin = {}) {
  const daysPerYear = ops.workDaysPerWeek * ops.workWeeksPerYear;
  switch (key) {
    case 'cycleCount':
      return uc.hoursPerSession * uc.sessionsPerWeek * 50 * uc.peoplePerSession * uc.burdenedRate * uc.reductionPct;

    case 'audit': {
      const labor = uc.people * uc.daysPerAudit * uc.hoursPerDay * uc.auditsPerYear * uc.burdenedRate * uc.reductionPct;
      const downtime = (uc.downtimeCostPerDay !== '' && Number(uc.downtimeCostPerDay) > 0)
        ? Number(uc.downtimeCostPerDay) * uc.daysPerAudit * uc.auditsPerYear
        : 0;
      return labor + downtime;
    }

    case 'locateItems': {
      return (uc.roleRows || []).reduce((sum, row) => {
        return sum + row.hoursLostPerDay * row.headcount * daysPerYear * row.burdenedRate * uc.reductionPct;
      }, 0);
    }

    case 'workOrderTracking': {
      return (uc.roleRows || []).reduce((sum, row) => {
        return sum + row.hoursLostPerDay * row.headcount * daysPerYear * row.burdenedRate * uc.reductionPct;
      }, 0);
    }

    case 'picklistVerification':
      return uc.picksPerDay * (uc.errorRate / 100) * uc.costPerError * daysPerYear * uc.reductionPct;

    case 'shipReceiveVerification':
      return (uc.minutesSavedPerTransaction / 60) * uc.transactionsPerDay * uc.dockStaff * daysPerYear * uc.burdenedRate * uc.reductionPct;

    case 'internalDelivery':
      return (uc.minutesPerTransfer / 60) * uc.transfersPerDay * uc.peoplePerTransfer * daysPerYear * uc.burdenedRate * uc.reductionPct;

    case 'expiredProducts':
      return uc.incidentsPerYear * uc.costPerIncident * uc.reductionPct;

    case 'calibrationReminders':
      return uc.failuresPerYear * uc.costPerFailure * uc.reductionPct;

    case 'geofencing':
      return uc.incidentsPerYear * uc.costPerIncident * uc.reductionPct;

    case 'fasterFulfillment':
      return uc.currentCycleTime > 0
        ? ((uc.currentCycleTime - uc.targetCycleTime) / uc.currentCycleTime) * uc.ordersPerMonth * 12 * uc.revenuePerOrder * 0.10
        : 0;

    case 'misShipReduction':
      return uc.misShipsPerMonth * 12 * uc.costPerMisShip * uc.reductionPct;

    case 'dockTurnSpeed':
      return (uc.minutesSaved / 60) * uc.transactionsPerDay * uc.dockStaff * daysPerYear * uc.burdenedRate * uc.reductionPct;

    case 'goodsReceipt':
      return (uc.minutesSavedPerTransaction / 60) * uc.transactionsPerDay * uc.dockStaff * daysPerYear * uc.burdenedRate * uc.reductionPct;

    case 'automatedPackCount':
      return (uc.minutesSavedPerTransaction / 60) * uc.transactionsPerDay * uc.dockStaff * daysPerYear * uc.burdenedRate * uc.reductionPct;

    case 'outboundAudit':
      return (uc.minutesSaved / 60) * uc.transactionsPerDay * uc.dockStaff * daysPerYear * uc.burdenedRate * uc.reductionPct;

    case 'returnsTransfers':
      return (uc.minutesPerTransfer / 60) * uc.transfersPerDay * uc.peoplePerTransfer * daysPerYear * uc.burdenedRate * uc.reductionPct;

    case 'inventoryRequests':
      return uc.hoursPerWeek * uc.peopleInvolved * ops.workWeeksPerYear * uc.burdenedRate * uc.reductionPct;

    case 'shrinkage':
    case 'productionEquipment':
    case 'rtiTracking':
    case 'proofOfDelivery':
      return uc.incidentsPerYear * uc.costPerIncident * uc.reductionPct;

    case 'qualityExceptionTracking':
      return uc.exceptionsPerYear * uc.reductionPct * (uc.reworkCostPerException + (Number(uc.scrapCostPerException) || 0));

    case 'expeditedExceptionTracking':
      return uc.lateShipmentsPerMonth * 12 * uc.costPerLateShipment * uc.reductionPct;

    case 'workingCapitalImprovement':
      return uc.wipInventoryValue * uc.reductionPct * (fin.wacc ?? 0.085);

    default:
      return 0;
  }
}

export const BUCKET_CONFIG = [
  {
    name: 'Labor Efficiency',
    keys: ['cycleCount', 'audit', 'locateItems', 'workOrderTracking', 'picklistVerification', 'shipReceiveVerification', 'internalDelivery', 'goodsReceipt', 'automatedPackCount', 'outboundAudit', 'returnsTransfers', 'inventoryRequests'],
    labels: {
      cycleCount: 'Cycle Counting',
      audit: 'Full Inventory Audit',
      locateItems: 'Locate Items',
      workOrderTracking: 'Work Order Cycle Time Tracking',
      picklistVerification: 'Picklist Verification',
      shipReceiveVerification: 'Ship & Receive Verification',
      internalDelivery: 'Internal Delivery Verification',
      goodsReceipt: 'Goods Receipt',
      automatedPackCount: 'Automated Pack Count',
      outboundAudit: 'Outbound Shipment Audit',
      returnsTransfers: 'Returns and Transfers',
      inventoryRequests: 'Inventory Requests',
    },
  },
  {
    name: 'Loss Prevention & Compliance',
    keys: ['expiredProducts', 'calibrationReminders', 'geofencing', 'shrinkage', 'productionEquipment', 'rtiTracking', 'proofOfDelivery', 'qualityExceptionTracking'],
    labels: {
      expiredProducts: 'Expired Products',
      calibrationReminders: 'Calibration Reminders',
      geofencing: 'Geofencing',
      shrinkage: 'Shrinkage and Loss Prevention',
      productionEquipment: 'Production Equipment Tracking',
      rtiTracking: 'Totes and Containers Tracking',
      proofOfDelivery: 'Proof of Delivery',
      qualityExceptionTracking: 'Quality Exception Path Tracking',
    },
  },
  {
    name: 'Revenue & Throughput',
    keys: ['fasterFulfillment', 'misShipReduction', 'dockTurnSpeed', 'expeditedExceptionTracking'],
    labels: {
      fasterFulfillment: 'Faster Order Fulfillment',
      misShipReduction: 'Mis-Ship Reduction',
      dockTurnSpeed: 'Receiving and Shipping Throughput',
      expeditedExceptionTracking: 'Expedited Exception Path Tracking',
    },
  },
  {
    name: 'Capital Efficiency',
    keys: ['workingCapitalImprovement'],
    labels: {
      workingCapitalImprovement: 'Working Capital Improvement',
    },
  },
];

export function calcCustomCategoryTotal(customCategories) {
  return (customCategories || []).reduce((sum, c) => sum + (Number(c.annualSavings) || 0), 0);
}

export function calcUseCaseTotals(useCases, ops, customCategories, fin = {}) {
  const buckets = BUCKET_CONFIG.map((bucket) => {
    const lineItems = bucket.keys
      .filter((key) => useCases[key]?.enabled)
      .map((key) => ({
        key,
        name: bucket.labels[key],
        annualValue: calcUseCaseValue(key, useCases[key], ops, fin),
      }));
    const subtotal = lineItems.reduce((sum, li) => sum + li.annualValue, 0);
    return { name: bucket.name, subtotal, lineItems };
  });

  if (customCategories && customCategories.length > 0) {
    buckets.push({
      name: 'Custom',
      subtotal: calcCustomCategoryTotal(customCategories),
      lineItems: customCategories.map((c) => ({
        key: `custom_${c.id}`,
        name: c.name || 'Custom Category',
        annualValue: Number(c.annualSavings) || 0,
      })),
    });
  }

  const totalGrossAnnual = buckets.reduce((sum, b) => sum + b.subtotal, 0);
  return { totalGrossAnnual, buckets };
}

export function calcFinancials(ops, useCases, fin, customCategories) {
  const { totalGrossAnnual, buckets } = calcUseCaseTotals(useCases, ops, customCategories, fin);
  const totalCapex = fin.capex * (1 + fin.contingencyRate);
  const annualSaasFee = fin.monthlyPlatformFee * 12;
  const netAnnualValue = totalGrossAnnual - annualSaasFee;
  const monthlyGross = totalGrossAnnual / 12;
  const saasRoi = annualSaasFee > 0 ? netAnnualValue / annualSaasFee : 0;

  const rampFactors = [0.25, 0.50, 0.75, 1, 1, 1, 1, 1, 1, 1, 1, 1];
  const monthlySaasFee = fin.monthlyPlatformFee;
  const cashFlows = [];
  cashFlows.push(-totalCapex);
  let year1Net = 0;
  for (let m = 0; m < 12; m++) {
    const cf = monthlyGross * rampFactors[m] - monthlySaasFee;
    cashFlows.push(cf);
    year1Net += cf;
  }
  for (let y = 2; y <= 5; y++) {
    cashFlows.push(netAnnualValue);
  }

  const monthlyWacc = Math.pow(1 + fin.wacc, 1 / 12) - 1;
  let npv = cashFlows[0];
  for (let m = 1; m <= 12; m++) {
    npv += cashFlows[m] / Math.pow(1 + monthlyWacc, m);
  }
  for (let y = 2; y <= 5; y++) {
    npv += cashFlows[12 + (y - 1)] / Math.pow(1 + fin.wacc, y);
  }

  function npvAtRate(r) {
    let val = cashFlows[0];
    for (let m = 1; m <= 12; m++) val += cashFlows[m] / Math.pow(1 + r, m);
    const annualR = Math.pow(1 + r, 12) - 1;
    for (let y = 2; y <= 5; y++) val += cashFlows[12 + (y - 1)] / Math.pow(1 + annualR, y);
    return val;
  }
  function dnpvAtRate(r) {
    let val = 0;
    for (let m = 1; m <= 12; m++) val -= m * cashFlows[m] / Math.pow(1 + r, m + 1);
    const annualR = Math.pow(1 + r, 12) - 1;
    const dannualR = 12 * Math.pow(1 + r, 11);
    for (let y = 2; y <= 5; y++) val += cashFlows[12 + (y - 1)] * (-y) * Math.pow(1 + annualR, -y - 1) * dannualR;
    return val;
  }
  let irr = 0.01;
  for (let i = 0; i < 100; i++) {
    const f = npvAtRate(irr);
    const df = dnpvAtRate(irr);
    if (Math.abs(df) < 1e-10) break;
    const next = irr - f / df;
    if (Math.abs(next - irr) < 1e-8) { irr = next; break; }
    irr = next;
  }
  const irrAnnual = Math.pow(1 + irr, 12) - 1;

  let cumulative = cashFlows[0];
  let paybackWeeks = null;
  for (let m = 1; m <= 12; m++) {
    const prev = cumulative;
    cumulative += cashFlows[m];
    if (cumulative >= 0 && prev < 0) {
      const fraction = -prev / cashFlows[m];
      paybackWeeks = ((m - 1) + fraction) * (52 / 12);
      break;
    }
  }
  if (paybackWeeks === null) {
    for (let y = 2; y <= 5; y++) {
      const prev = cumulative;
      cumulative += cashFlows[12 + (y - 1)];
      if (cumulative >= 0 && prev < 0) {
        const fraction = -prev / cashFlows[12 + (y - 1)];
        const months = 12 + (y - 1) * 12 + fraction * 12;
        paybackWeeks = months * (52 / 12);
        break;
      }
    }
  }

  const total5yrCost = totalCapex + annualSaasFee * 5;
  const fiveYrRoi = total5yrCost > 0 ? (npv + total5yrCost) / total5yrCost : 0;

  return {
    totalGrossAnnual,
    buckets,
    totalCapex,
    annualSaasFee,
    netAnnualValue,
    monthlyGross,
    saasRoi,
    npv,
    irrAnnual,
    paybackWeeks,
    fiveYrRoi,
    cashFlows,
  };
}
