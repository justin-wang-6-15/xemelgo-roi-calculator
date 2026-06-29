// src/utils/calculations.js

const ROLE_RATE_KEY = {
  materialHandler: 'materialHandlerRate',
  planner: 'plannerRate',
  indirect: 'indirectRate',
  direct: 'directRate',
};

export function calcUseCaseValue(key, uc, ops) {
  const daysPerYear = ops.workDaysPerWeek * ops.workWeeksPerYear;
  switch (key) {
    case 'auditCycleCount':
      return uc.hoursPerCount * uc.countsPerYear * uc.plannersPerCount * ops.plannerRate * uc.reductionPct;
    case 'locateItems': {
      const rate = ops[ROLE_RATE_KEY[uc.role] || 'materialHandlerRate'];
      return (uc.searchMinutes / 60) * uc.incidentsPerDay * daysPerYear * rate * uc.reductionPct;
    }
    case 'picklistVerification':
      return uc.picksPerDay * uc.errorRate * uc.costPerError * daysPerYear * uc.reductionPct;
    case 'shipReceiveVerification':
      return (uc.minutesPerTransaction / 60) * uc.transactionsPerDay * uc.dockHeadcount * daysPerYear * ops.materialHandlerRate * uc.reductionPct;
    case 'internalDelivery':
      return (uc.minutesPerTransfer / 60) * uc.transfersPerDay * uc.headcount * daysPerYear * ops.materialHandlerRate * uc.reductionPct;
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
      return uc.transactionsPerDay * uc.delayCostPerTransaction * daysPerYear * (uc.savingsMinutesPerTransaction / 60);
    default:
      return 0;
  }
}

export const BUCKET_CONFIG = [
  {
    name: 'Labor Efficiency',
    keys: ['auditCycleCount', 'locateItems', 'picklistVerification', 'shipReceiveVerification', 'internalDelivery'],
    labels: {
      auditCycleCount: 'Audit & Cycle Counting',
      locateItems: 'Locate Items',
      picklistVerification: 'Picklist Verification',
      shipReceiveVerification: 'Ship & Receive Verification',
      internalDelivery: 'Internal Delivery Verification',
    },
  },
  {
    name: 'Loss Prevention & Compliance',
    keys: ['expiredProducts', 'calibrationReminders', 'geofencing'],
    labels: {
      expiredProducts: 'Expired Products',
      calibrationReminders: 'Calibration Reminders',
      geofencing: 'Geofencing',
    },
  },
  {
    name: 'Revenue & Throughput',
    keys: ['fasterFulfillment', 'misShipReduction', 'dockTurnSpeed'],
    labels: {
      fasterFulfillment: 'Faster Order Fulfillment',
      misShipReduction: 'Mis-Ship Reduction',
      dockTurnSpeed: 'Receiving and Shipping Throughput',
    },
  },
];

export function calcUseCaseTotals(useCases, ops) {
  const buckets = BUCKET_CONFIG.map((bucket) => {
    const lineItems = bucket.keys
      .filter((key) => useCases[key]?.enabled)
      .map((key) => ({
        key,
        name: bucket.labels[key],
        annualValue: calcUseCaseValue(key, useCases[key], ops),
      }));
    const subtotal = lineItems.reduce((sum, li) => sum + li.annualValue, 0);
    return { name: bucket.name, subtotal, lineItems };
  });
  const totalGrossAnnual = buckets.reduce((sum, b) => sum + b.subtotal, 0);
  return { totalGrossAnnual, buckets };
}

export function calcFinancials(ops, useCases, fin) {
  const { totalGrossAnnual, buckets } = calcUseCaseTotals(useCases, ops);
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
