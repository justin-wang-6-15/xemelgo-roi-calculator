export function calcLaborSaving({ minutesSavedPerPersonPerDay, peopleAffected, burdenedRate, workDaysPerWeek, workWeeksPerYear }) {
  const hoursPerWeek = (minutesSavedPerPersonPerDay / 60) * peopleAffected * workDaysPerWeek;
  const annualValue = hoursPerWeek * burdenedRate * workWeeksPerYear;
  return { hoursPerWeek, annualValue };
}

export function calcAllSavings(ops, savings) {
  const meeting = calcLaborSaving({
    minutesSavedPerPersonPerDay: savings.meetingMinutesSaved,
    peopleAffected: savings.meetingPeopleAffected,
    burdenedRate: ops.indirectRate,
    workDaysPerWeek: ops.workDaysPerWeek,
    workWeeksPerYear: ops.workWeeksPerYear,
  });

  const handlerSearch = calcLaborSaving({
    minutesSavedPerPersonPerDay: savings.handlerSearchMinutesSaved,
    peopleAffected: savings.handlerSearchPeopleAffected,
    burdenedRate: ops.materialHandlerRate,
    workDaysPerWeek: ops.workDaysPerWeek,
    workWeeksPerYear: ops.workWeeksPerYear,
  });

  const productionSearch = calcLaborSaving({
    minutesSavedPerPersonPerDay: savings.productionSearchMinutesSaved,
    peopleAffected: savings.productionSearchPeopleAffected,
    burdenedRate: ops.plannerRate,
    workDaysPerWeek: ops.workDaysPerWeek,
    workWeeksPerYear: ops.workWeeksPerYear,
  });

  const cycleCountAnnual = savings.cycleCountQuarterlySavings * 4;
  const revenueAccelAnnual = savings.revenueAccelerationMonthly * 12;

  const totalGrossAnnual = meeting.annualValue + handlerSearch.annualValue + productionSearch.annualValue + cycleCountAnnual + revenueAccelAnnual;

  return { meeting, handlerSearch, productionSearch, cycleCountAnnual, revenueAccelAnnual, totalGrossAnnual };
}

export function calcFinancials(ops, savings, fin) {
  const savingsResult = calcAllSavings(ops, savings);
  const totalCapex = fin.capex * (1 + fin.contingencyRate);
  const annualSaasFee = fin.monthlyPlatformFee * 12;
  const netAnnualValue = savingsResult.totalGrossAnnual - annualSaasFee;
  const monthlyGross = savingsResult.totalGrossAnnual / 12;
  const saasRoi = netAnnualValue / annualSaasFee;

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

  const monthlyWacc = Math.pow(1 + fin.wacc, 1/12) - 1;
  let npv = cashFlows[0];
  for (let m = 1; m <= 12; m++) {
    npv += cashFlows[m] / Math.pow(1 + monthlyWacc, m);
  }
  for (let y = 2; y <= 5; y++) {
    npv += cashFlows[12 + (y - 1)] / Math.pow(1 + fin.wacc, y);
  }

  function npvAtRate(r) {
    let val = cashFlows[0];
    for (let m = 1; m <= 12; m++) {
      val += cashFlows[m] / Math.pow(1 + r, m);
    }
    const annualR = Math.pow(1 + r, 12) - 1;
    for (let y = 2; y <= 5; y++) {
      val += cashFlows[12 + (y - 1)] / Math.pow(1 + annualR, y);
    }
    return val;
  }

  function dnpvAtRate(r) {
    let val = 0;
    for (let m = 1; m <= 12; m++) {
      val -= m * cashFlows[m] / Math.pow(1 + r, m + 1);
    }
    const annualR = Math.pow(1 + r, 12) - 1;
    const dannualR = 12 * Math.pow(1 + r, 11);
    for (let y = 2; y <= 5; y++) {
      val += cashFlows[12 + (y - 1)] * (-y) * Math.pow(1 + annualR, -y - 1) * dannualR;
    }
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
      const months = (m - 1) + fraction;
      paybackWeeks = months * (52 / 12);
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
  const fiveYrRoi = (npv + total5yrCost) / total5yrCost;

  return {
    ...savingsResult,
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
