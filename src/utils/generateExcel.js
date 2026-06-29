import { Workbook } from 'exceljs';
import { fmt$, fmtPct, fmtWks } from './format';

// Style helpers
const S = {
  navyFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0B1028' } },
  blueFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF004FDB' } },
  lightBlueFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEDF5FF' } },
  yellowFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } },
  grayFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } },
  whiteFill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } },
  whiteFont: { bold: true, color: { argb: 'FFFFFFFF' } },
  navyFont: { color: { argb: 'FF0B1028' } },
  navyBoldFont: { bold: true, color: { argb: 'FF0B1028' } },
  blueFont: { bold: true, color: { argb: 'FF004FDB' } },
  redFont: { color: { argb: 'FFDC2626' } },
  grayFont: { color: { argb: 'FF6B7280' } },
  center: { horizontal: 'center', vertical: 'middle' },
  left: { horizontal: 'left', vertical: 'middle' },
  right: { horizontal: 'right', vertical: 'middle' },
  currencyFmt: '"$"#,##0',
  pctFmt: '0.0%',
};

function applyCell(cell, { value, fill, font, alignment, numFmt, border } = {}) {
  if (value !== undefined) cell.value = value;
  if (fill) cell.fill = fill;
  if (font) cell.font = font;
  if (alignment) cell.alignment = alignment;
  if (numFmt) cell.numFmt = numFmt;
  if (border) cell.border = border;
}

function sectionHeader(ws, rowNum, text, lastCol = 'F') {
  const row = ws.getRow(rowNum);
  row.height = 22;
  ws.mergeCells(`A${rowNum}:${lastCol}${rowNum}`);
  applyCell(ws.getCell(`A${rowNum}`), {
    value: text,
    fill: S.blueFill,
    font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 },
    alignment: S.left,
  });
}

function colHeader(ws, rowNum, headers, lastCol = 'F') {
  const row = ws.getRow(rowNum);
  row.height = 20;
  headers.forEach(({ col, text }) => {
    applyCell(ws.getCell(`${col}${rowNum}`), {
      value: text,
      fill: S.navyFill,
      font: S.whiteFont,
      alignment: S.center,
    });
  });
}

// ──────────────────────────────────────────────────────────────────
// SHEET 1: ROI Summary
// ──────────────────────────────────────────────────────────────────
function buildSummarySheet(ws, ops, fin, result) {
  const companyName = ops.companyName?.trim() || 'Your Facility';
  const today = new Date().toISOString().slice(0, 10);

  ws.columns = [
    { key: 'A', width: 38 },
    { key: 'B', width: 18 },
    { key: 'C', width: 18 },
    { key: 'D', width: 18 },
    { key: 'E', width: 18 },
    { key: 'F', width: 18 },
  ];

  // Row 1: Branding header
  ws.mergeCells('A1:F1');
  const r1 = ws.getRow(1); r1.height = 40;
  applyCell(ws.getCell('A1'), {
    value: `Xemelgo ROI Analysis — ${companyName}`,
    fill: S.navyFill,
    font: { bold: true, size: 16, color: { argb: 'FFFFFFFF' } },
    alignment: S.left,
  });

  // Row 2: Spacer
  ws.getRow(2).height = 8;

  // Row 3: Meta
  applyCell(ws.getCell('A3'), { value: `Prepared for: ${companyName}`, font: S.navyBoldFont });
  applyCell(ws.getCell('D3'), { value: `Date: ${today}`, font: S.navyBoldFont });

  // Row 4: Spacer
  ws.getRow(4).height = 8;

  // Rows 5–6: Headline metrics (3 pairs)
  ws.getRow(5).height = 18;
  ws.getRow(6).height = 28;

  const metrics = [
    { labelCell: 'A5', valueCell: 'A6', mergeLabel: 'A5:B5', mergeValue: 'A6:B6', label: 'Net Annual Value', value: result.netAnnualValue, fmt: S.currencyFmt },
    { labelCell: 'C5', valueCell: 'C6', mergeLabel: 'C5:D5', mergeValue: 'C6:D6', label: 'Payback Period', value: fmtWks(result.paybackWeeks) },
    { labelCell: 'E5', valueCell: 'E6', mergeLabel: 'E5:F5', mergeValue: 'E6:F6', label: '5-Year NPV', value: result.npv, fmt: S.currencyFmt },
  ];
  metrics.forEach(({ labelCell, valueCell, mergeLabel, mergeValue, label, value, fmt: numFmt }) => {
    ws.mergeCells(mergeLabel);
    ws.mergeCells(mergeValue);
    applyCell(ws.getCell(labelCell), { value: label, font: S.blueFont, alignment: S.center });
    applyCell(ws.getCell(valueCell), {
      value: typeof value === 'number' ? value : value,
      font: { bold: true, size: 14, color: { argb: 'FF0B1028' } },
      alignment: S.center,
      numFmt: numFmt,
    });
  });

  // Row 7: 5-Year ROI
  ws.getRow(7).height = 18;
  ws.mergeCells('A7:F7');
  applyCell(ws.getCell('A7'), {
    value: `5-Year ROI: ${fmtPct(result.fiveYrRoi - 1)}    |    IRR: ${result.irrAnnual > 3 ? '>300%' : fmtPct(result.irrAnnual)}    |    Annual SaaS ROI: ${fmtPct(result.saasRoi)}`,
    font: { bold: true, color: { argb: 'FF0B1028' } },
    alignment: S.center,
  });

  // Row 8: Spacer
  ws.getRow(8).height = 8;

  // Row 9: Section header
  sectionHeader(ws, 9, 'Savings Breakdown by Use Case');

  // Row 10: Column headers
  colHeader(ws, 10, [
    { col: 'A', text: 'Use Case' },
    { col: 'B', text: 'Category' },
    { col: 'C', text: 'Annual Value' },
    { col: 'D', text: '% of Total' },
  ]);

  let r = 11;
  let alt = false;
  const totalGross = result.totalGrossAnnual;

  result.buckets.forEach((bucket) => {
    if (bucket.lineItems.length === 0) return;
    bucket.lineItems.forEach((li) => {
      const row = ws.getRow(r);
      row.height = 18;
      const fill = alt ? S.lightBlueFill : S.whiteFill;
      applyCell(ws.getCell(`A${r}`), { value: li.name, fill, font: S.navyFont, alignment: S.left });
      applyCell(ws.getCell(`B${r}`), { value: bucket.name, fill, font: S.grayFont, alignment: S.left });
      applyCell(ws.getCell(`C${r}`), { value: li.annualValue, fill, font: S.navyFont, alignment: S.right, numFmt: S.currencyFmt });
      applyCell(ws.getCell(`D${r}`), { value: totalGross > 0 ? li.annualValue / totalGross : 0, fill, font: S.navyFont, alignment: S.right, numFmt: '0.0%' });
      alt = !alt;
      r++;
    });
    // Bucket subtotal
    const subRow = ws.getRow(r); subRow.height = 18;
    applyCell(ws.getCell(`A${r}`), { value: `${bucket.name} subtotal`, fill: S.lightBlueFill, font: { bold: true, color: { argb: 'FF0B1028' } }, alignment: S.left });
    applyCell(ws.getCell(`C${r}`), { value: bucket.subtotal, fill: S.lightBlueFill, font: { bold: true, color: { argb: 'FF0B1028' } }, alignment: S.right, numFmt: S.currencyFmt });
    r++; alt = false;
  });

  // Totals rows
  ws.getRow(r).height = 20;
  applyCell(ws.getCell(`A${r}`), { value: 'Total Gross Annual', font: { bold: true, size: 11, color: { argb: 'FF0B1028' } } });
  applyCell(ws.getCell(`C${r}`), { value: totalGross, font: { bold: true, size: 11, color: { argb: 'FF0B1028' } }, numFmt: S.currencyFmt });
  r++;

  ws.getRow(r).height = 18;
  applyCell(ws.getCell(`A${r}`), { value: 'Annual Platform Cost', font: S.redFont });
  applyCell(ws.getCell(`C${r}`), { value: -result.annualSaasFee, font: S.redFont, numFmt: S.currencyFmt });
  r++;

  ws.getRow(r).height = 20;
  applyCell(ws.getCell(`A${r}`), { value: 'Net Annual Value', font: { bold: true, size: 11, color: { argb: 'FF004FDB' } } });
  applyCell(ws.getCell(`C${r}`), { value: result.netAnnualValue, font: { bold: true, size: 11, color: { argb: 'FF004FDB' } }, numFmt: S.currencyFmt });
  r += 2;

  // Investment Inputs section
  sectionHeader(ws, r, 'Investment Inputs'); r++;
  colHeader(ws, r, [{ col: 'A', text: 'Input' }, { col: 'B', text: 'Value' }]); r++;

  const investRows = [
    ['CapEx (hardware, installation)', fin.capex, S.currencyFmt],
    ['Contingency Rate', fin.contingencyRate, S.pctFmt],
    ['Total CapEx with Contingency', result.totalCapex, S.currencyFmt],
    ['Monthly Platform Fee', fin.monthlyPlatformFee, S.currencyFmt],
    ['Annual Platform Fee', result.annualSaasFee, S.currencyFmt],
    ['WACC', fin.wacc, S.pctFmt],
  ];
  investRows.forEach(([label, value, numFmt], i) => {
    const fill = i % 2 === 0 ? S.whiteFill : S.lightBlueFill;
    ws.getRow(r).height = 18;
    applyCell(ws.getCell(`A${r}`), { value: label, fill, font: S.navyFont });
    applyCell(ws.getCell(`B${r}`), { value, fill, font: S.navyFont, alignment: S.right, numFmt });
    r++;
  });
}

// ──────────────────────────────────────────────────────────────────
// SHEET 2: Financial Model
// ──────────────────────────────────────────────────────────────────
function buildFinancialModelSheet(ws, ops, useCases, fin, result) {
  const companyName = ops.companyName?.trim() || 'Your Facility';

  ws.columns = [
    { key: 'A', width: 40 },
    { key: 'B', width: 20 },
    { key: 'C', width: 20 },
    { key: 'D', width: 20 },
    { key: 'E', width: 20 },
    { key: 'F', width: 20 },
    { key: 'G', width: 20 },
  ];

  // Row 1: Branding header
  ws.mergeCells('A1:G1');
  ws.getRow(1).height = 40;
  applyCell(ws.getCell('A1'), {
    value: `Xemelgo Financial Model — ${companyName}`,
    fill: S.navyFill,
    font: { bold: true, size: 16, color: { argb: 'FFFFFFFF' } },
    alignment: S.left,
  });

  // Row 2: Spacer
  ws.getRow(2).height = 8;

  // Row 3: Column headers
  ws.getRow(3).height = 22;
  const yearHeaders = [
    { col: 'A', text: 'Category / Input' },
    { col: 'B', text: 'Year 1' },
    { col: 'C', text: 'Year 2' },
    { col: 'D', text: 'Year 3' },
    { col: 'E', text: 'Year 4' },
    { col: 'F', text: 'Year 5' },
    { col: 'G', text: 'Notes' },
  ];
  yearHeaders.forEach(({ col, text }) => {
    applyCell(ws.getCell(`${col}3`), {
      value: text, fill: S.navyFill, font: S.whiteFont, alignment: S.center,
    });
  });

  // ── Input Zone ───────────────────────────────────────────────────
  ws.mergeCells('A4:G4');
  ws.getRow(4).height = 22;
  applyCell(ws.getCell('A4'), {
    value: 'YOUR INPUTS — Yellow cells can be edited to run sensitivity analysis',
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF9C4' } },
    font: { bold: true, color: { argb: 'FF92400E' } },
    alignment: S.left,
  });

  const cellMap = {}; // key → 'B{row}' reference for formulas

  function inputRow(r, label, key, value, numFmt) {
    ws.getRow(r).height = 18;
    applyCell(ws.getCell(`A${r}`), { value: label, font: S.grayFont });
    applyCell(ws.getCell(`B${r}`), { value, fill: S.yellowFill, font: S.navyFont, alignment: S.right, numFmt });
    cellMap[key] = `B${r}`;
    return r + 1;
  }

  let r = 5;

  // Facility inputs
  ws.mergeCells(`A${r}:G${r}`);
  ws.getRow(r).height = 18;
  applyCell(ws.getCell(`A${r}`), { value: 'Step 1 — Facility Inputs', fill: S.grayFill, font: { bold: true, color: { argb: 'FF374151' } } });
  r++;

  r = inputRow(r, 'Material Handler — Headcount', 'mhCount', ops.materialHandlerCount, '0');
  r = inputRow(r, 'Material Handler — Burdened Rate ($/hr)', 'mhRate', ops.materialHandlerRate, S.currencyFmt);
  r = inputRow(r, 'Planner — Headcount', 'pCount', ops.plannerCount, '0');
  r = inputRow(r, 'Planner — Burdened Rate ($/hr)', 'pRate', ops.plannerRate, S.currencyFmt);
  r = inputRow(r, 'Indirect/Leadership — Headcount', 'indCount', ops.indirectCount, '0');
  r = inputRow(r, 'Indirect/Leadership — Burdened Rate ($/hr)', 'indRate', ops.indirectRate, S.currencyFmt);
  r = inputRow(r, 'Direct Employees — Headcount', 'dirCount', ops.directCount, '0');
  r = inputRow(r, 'Direct Employees — Burdened Rate ($/hr)', 'dirRate', ops.directRate, S.currencyFmt);
  r = inputRow(r, 'Working Days per Week', 'daysPerWeek', ops.workDaysPerWeek, '0');
  r = inputRow(r, 'Working Weeks per Year', 'weeksPerYear', ops.workWeeksPerYear, '0');
  r = inputRow(r, 'Shifts per Day', 'shifts', ops.shiftsPerDay, '0');

  // Derived helper (not yellow — computed)
  ws.getRow(r).height = 18;
  applyCell(ws.getCell(`A${r}`), { value: 'Working Days per Year (derived)', font: S.grayFont });
  applyCell(ws.getCell(`B${r}`), {
    value: { formula: `${cellMap.daysPerWeek}*${cellMap.weeksPerYear}`, result: ops.workDaysPerWeek * ops.workWeeksPerYear },
    fill: S.grayFill, font: S.navyFont, alignment: S.right, numFmt: '0',
  });
  cellMap.daysPerYear = `B${r}`;
  r++;

  r++; // spacer

  // Investment inputs
  ws.mergeCells(`A${r}:G${r}`);
  ws.getRow(r).height = 18;
  applyCell(ws.getCell(`A${r}`), { value: 'Step 3 — Investment Inputs', fill: S.grayFill, font: { bold: true, color: { argb: 'FF374151' } } });
  r++;

  r = inputRow(r, 'CapEx — Hardware & Installation ($)', 'capex', fin.capex, S.currencyFmt);
  r = inputRow(r, 'Contingency Rate (decimal, e.g. 0.10 = 10%)', 'contRate', fin.contingencyRate, '0.0%');
  r = inputRow(r, 'Monthly Platform Fee ($)', 'monthlyFee', fin.monthlyPlatformFee, S.currencyFmt);
  r = inputRow(r, 'WACC — Weighted Average Cost of Capital (decimal)', 'wacc', fin.wacc, '0.0%');

  r++; // spacer

  // Use case inputs
  ws.mergeCells(`A${r}:G${r}`);
  ws.getRow(r).height = 18;
  applyCell(ws.getCell(`A${r}`), { value: 'Step 2 — Use Case Inputs', fill: S.grayFill, font: { bold: true, color: { argb: 'FF374151' } } });
  r++;

  const UC_INPUT_SPECS = {
    auditCycleCount: [
      ['Hours per count', 'hoursPerCount', '0.0'],
      ['Counts per year', 'countsPerYear', '0'],
      ['Planners per count', 'plannersPerCount', '0'],
      ['Reduction % (decimal)', 'reductionPct', '0.0%'],
    ],
    locateItems: [
      ['Search minutes per incident', 'searchMinutes', '0.0'],
      ['Incidents per day', 'incidentsPerDay', '0'],
      ['Reduction % (decimal)', 'reductionPct', '0.0%'],
    ],
    picklistVerification: [
      ['Picks per day', 'picksPerDay', '0'],
      ['Error rate (decimal)', 'errorRate', '0.0%'],
      ['Cost per error ($)', 'costPerError', S.currencyFmt],
      ['Reduction % (decimal)', 'reductionPct', '0.0%'],
    ],
    shipReceiveVerification: [
      ['Minutes per transaction', 'minutesPerTransaction', '0.0'],
      ['Transactions per day', 'transactionsPerDay', '0'],
      ['Dock headcount', 'dockHeadcount', '0'],
      ['Reduction % (decimal)', 'reductionPct', '0.0%'],
    ],
    internalDelivery: [
      ['Minutes per transfer', 'minutesPerTransfer', '0.0'],
      ['Transfers per day', 'transfersPerDay', '0'],
      ['Headcount', 'headcount', '0'],
      ['Reduction % (decimal)', 'reductionPct', '0.0%'],
    ],
    expiredProducts: [
      ['Incidents per year', 'incidentsPerYear', '0'],
      ['Cost per incident ($)', 'costPerIncident', S.currencyFmt],
      ['Reduction % (decimal)', 'reductionPct', '0.0%'],
    ],
    calibrationReminders: [
      ['Failures per year', 'failuresPerYear', '0'],
      ['Cost per failure ($)', 'costPerFailure', S.currencyFmt],
      ['Reduction % (decimal)', 'reductionPct', '0.0%'],
    ],
    geofencing: [
      ['Incidents per year', 'incidentsPerYear', '0'],
      ['Cost per incident ($)', 'costPerIncident', S.currencyFmt],
      ['Reduction % (decimal)', 'reductionPct', '0.0%'],
    ],
    fasterFulfillment: [
      ['Current cycle time (hrs)', 'currentCycleTime', '0.0'],
      ['Target cycle time (hrs)', 'targetCycleTime', '0.0'],
      ['Orders per month', 'ordersPerMonth', '0'],
      ['Revenue per order ($)', 'revenuePerOrder', S.currencyFmt],
    ],
    misShipReduction: [
      ['Mis-ships per month', 'misShipsPerMonth', '0'],
      ['Cost per mis-ship ($)', 'costPerMisShip', S.currencyFmt],
      ['Reduction % (decimal)', 'reductionPct', '0.0%'],
    ],
    dockTurnSpeed: [
      ['Transactions per day', 'transactionsPerDay', '0'],
      ['Delay cost per transaction ($)', 'delayCostPerTransaction', S.currencyFmt],
      ['Savings minutes per transaction', 'savingsMinutesPerTransaction', '0.0'],
    ],
  };

  const UC_DISPLAY_NAMES = {
    auditCycleCount: 'Audit & Cycle Counting',
    locateItems: 'Locate Items',
    picklistVerification: 'Picklist Verification',
    shipReceiveVerification: 'Ship & Receive Verification',
    internalDelivery: 'Internal Delivery Verification',
    expiredProducts: 'Expired Products',
    calibrationReminders: 'Calibration Reminders',
    geofencing: 'Geofencing',
    fasterFulfillment: 'Faster Order Fulfillment',
    misShipReduction: 'Mis-Ship Reduction',
    dockTurnSpeed: 'Receiving and Shipping Throughput',
  };

  // Track per-use-case cell refs for annual value formulas
  const ucCellMaps = {};
  const enabledUcKeys = [];

  Object.entries(useCases).forEach(([key, uc]) => {
    if (!uc.enabled) return;
    const specs = UC_INPUT_SPECS[key];
    if (!specs) return;
    enabledUcKeys.push(key);

    ws.getRow(r).height = 18;
    applyCell(ws.getCell(`A${r}`), { value: `  ${UC_DISPLAY_NAMES[key] || key}`, font: { bold: true, color: { argb: 'FF1D4ED8' } } });
    r++;

    const ucMap = {};
    specs.forEach(([label, field, numFmt]) => {
      if (uc[field] === undefined) return;
      ws.getRow(r).height = 18;
      applyCell(ws.getCell(`A${r}`), { value: `    ${label}`, font: S.grayFont });
      applyCell(ws.getCell(`B${r}`), { value: uc[field], fill: S.yellowFill, font: S.navyFont, alignment: S.right, numFmt });
      ucMap[field] = `B${r}`;
      r++;
    });
    ucCellMaps[key] = ucMap;
  });

  r++; // spacer

  // ── Output Zone ──────────────────────────────────────────────────
  ws.mergeCells(`A${r}:G${r}`);
  ws.getRow(r).height = 22;
  applyCell(ws.getCell(`A${r}`), {
    value: 'CALCULATED OUTPUTS — Do not edit these cells',
    fill: S.grayFill,
    font: { bold: true, color: { argb: 'FF374151' } },
    alignment: S.left,
  });
  r++;

  // Annual value per use case formula builder
  function buildUcFormula(key, ucMap) {
    const cm = cellMap;
    switch (key) {
      case 'auditCycleCount':
        return `${ucMap.hoursPerCount}*${ucMap.countsPerYear}*${ucMap.plannersPerCount}*${cm.pRate}*${ucMap.reductionPct}`;
      case 'locateItems':
        return `(${ucMap.searchMinutes}/60)*${ucMap.incidentsPerDay}*${cm.daysPerYear}*${cm.mhRate}*${ucMap.reductionPct}`;
      case 'picklistVerification':
        return `${ucMap.picksPerDay}*${ucMap.errorRate}*${ucMap.costPerError}*${cm.daysPerYear}*${ucMap.reductionPct}`;
      case 'shipReceiveVerification':
        return `(${ucMap.minutesPerTransaction}/60)*${ucMap.transactionsPerDay}*${ucMap.dockHeadcount}*${cm.daysPerYear}*${cm.mhRate}*${ucMap.reductionPct}`;
      case 'internalDelivery':
        return `(${ucMap.minutesPerTransfer}/60)*${ucMap.transfersPerDay}*${ucMap.headcount}*${cm.daysPerYear}*${cm.mhRate}*${ucMap.reductionPct}`;
      case 'expiredProducts':
        return `${ucMap.incidentsPerYear}*${ucMap.costPerIncident}*${ucMap.reductionPct}`;
      case 'calibrationReminders':
        return `${ucMap.failuresPerYear}*${ucMap.costPerFailure}*${ucMap.reductionPct}`;
      case 'geofencing':
        return `${ucMap.incidentsPerYear}*${ucMap.costPerIncident}*${ucMap.reductionPct}`;
      case 'fasterFulfillment':
        return `IF(${ucMap.currentCycleTime}>0,((${ucMap.currentCycleTime}-${ucMap.targetCycleTime})/${ucMap.currentCycleTime})*${ucMap.ordersPerMonth}*12*${ucMap.revenuePerOrder}*0.1,0)`;
      case 'misShipReduction':
        return `${ucMap.misShipsPerMonth}*12*${ucMap.costPerMisShip}*${ucMap.reductionPct}`;
      case 'dockTurnSpeed':
        return `${ucMap.transactionsPerDay}*${ucMap.delayCostPerTransaction}*${cm.daysPerYear}*(${ucMap.savingsMinutesPerTransaction}/60)`;
      default:
        return '0';
    }
  }

  // Annual value rows per use case
  const annualValueRows = {};
  enabledUcKeys.forEach((key) => {
    const ucMap = ucCellMaps[key];
    if (!ucMap) return;
    const formula = buildUcFormula(key, ucMap);
    const annualValue = result.buckets.flatMap(b => b.lineItems).find(li => li.key === key)?.annualValue ?? 0;
    ws.getRow(r).height = 18;
    applyCell(ws.getCell(`A${r}`), { value: `Annual Value: ${UC_DISPLAY_NAMES[key]}`, fill: S.grayFill, font: S.grayFont });
    applyCell(ws.getCell(`B${r}`), { value: { formula, result: annualValue }, fill: S.grayFill, font: S.navyFont, alignment: S.right, numFmt: S.currencyFmt });
    annualValueRows[key] = r;
    r++;
  });

  // Total annual savings
  ws.getRow(r).height = 20;
  const annualSavingsFormula = enabledUcKeys.length > 0
    ? `SUM(B${Object.values(annualValueRows).join(`:B`+Object.values(annualValueRows).slice(-1)[0]).split(':B').join(',B')})`
    : '0';
  // Simpler: sum all annual value rows
  const annualValueRowNums = Object.values(annualValueRows);
  const sumFormula = annualValueRowNums.length > 0
    ? annualValueRowNums.map(n => `B${n}`).join('+')
    : '0';
  applyCell(ws.getCell(`A${r}`), { value: 'Total Annual Savings (pre-ramp)', fill: S.lightBlueFill, font: { bold: true, color: { argb: 'FF0B1028' } } });
  applyCell(ws.getCell(`B${r}`), { value: { formula: sumFormula, result: result.totalGrossAnnual }, fill: S.lightBlueFill, font: { bold: true, color: { argb: 'FF0B1028' } }, alignment: S.right, numFmt: S.currencyFmt });
  const totalSavingsRow = r;
  r++;

  // Ramp factors row
  ws.getRow(r).height = 18;
  const RAMP_FACTORS = [0.6458, 1.0, 1.0, 1.0, 1.0];
  applyCell(ws.getCell(`A${r}`), { value: 'Year 1 Ramp Factor (25%→50%→75%→100% avg)', fill: S.grayFill, font: S.grayFont });
  ['B', 'C', 'D', 'E', 'F'].forEach((col, i) => {
    applyCell(ws.getCell(`${col}${r}`), { value: RAMP_FACTORS[i], fill: S.grayFill, font: S.navyFont, alignment: S.right, numFmt: '0.0%' });
  });
  const rampRow = r;
  r++;

  // Ramped annual savings
  ws.getRow(r).height = 18;
  applyCell(ws.getCell(`A${r}`), { value: 'Annual Savings (with ramp)', fill: S.lightBlueFill, font: S.navyBoldFont });
  ['B', 'C', 'D', 'E', 'F'].forEach((col, i) => {
    applyCell(ws.getCell(`${col}${r}`), {
      value: { formula: `B${totalSavingsRow}*${col}${rampRow}`, result: result.totalGrossAnnual * RAMP_FACTORS[i] },
      fill: S.lightBlueFill, font: S.navyFont, alignment: S.right, numFmt: S.currencyFmt,
    });
  });
  const rampedSavingsRow = r;
  r++;

  // Annual platform cost
  ws.getRow(r).height = 18;
  applyCell(ws.getCell(`A${r}`), { value: 'Annual Platform Cost', fill: S.grayFill, font: S.grayFont });
  ['B', 'C', 'D', 'E', 'F'].forEach((col) => {
    applyCell(ws.getCell(`${col}${r}`), {
      value: { formula: `${cellMap.monthlyFee}*12`, result: result.annualSaasFee },
      fill: S.grayFill, font: { color: { argb: 'FFDC2626' } }, alignment: S.right, numFmt: S.currencyFmt,
    });
  });
  const platformCostRow = r;
  r++;

  // Net annual cash flow
  ws.getRow(r).height = 18;
  applyCell(ws.getCell(`A${r}`), { value: 'Net Annual Cash Flow', fill: S.lightBlueFill, font: S.navyBoldFont });
  ['B', 'C', 'D', 'E', 'F'].forEach((col) => {
    applyCell(ws.getCell(`${col}${r}`), {
      value: { formula: `${col}${rampedSavingsRow}-${col}${platformCostRow}`, result: result.netAnnualValue * (col === 'B' ? 0.6458 : 1) },
      fill: S.lightBlueFill, font: S.navyFont, alignment: S.right, numFmt: S.currencyFmt,
    });
  });
  const netCashFlowRow = r;
  r++;

  // CapEx impact
  ws.getRow(r).height = 18;
  applyCell(ws.getCell(`A${r}`), { value: 'CapEx Impact (Year 1 only)', fill: S.grayFill, font: S.grayFont });
  applyCell(ws.getCell(`B${r}`), {
    value: { formula: `-${cellMap.capex}*(1+${cellMap.contRate})`, result: -result.totalCapex },
    fill: S.grayFill, font: { color: { argb: 'FFDC2626' } }, alignment: S.right, numFmt: S.currencyFmt,
  });
  ['C', 'D', 'E', 'F'].forEach((col) => {
    applyCell(ws.getCell(`${col}${r}`), { value: 0, fill: S.grayFill, font: S.navyFont, alignment: S.right, numFmt: S.currencyFmt });
  });
  const capexImpactRow = r;
  r++;

  // Net cash flow including CapEx
  ws.getRow(r).height = 18;
  applyCell(ws.getCell(`A${r}`), { value: 'Net Cash Flow incl. CapEx', fill: S.lightBlueFill, font: S.navyBoldFont });
  ['B', 'C', 'D', 'E', 'F'].forEach((col) => {
    applyCell(ws.getCell(`${col}${r}`), {
      value: { formula: `${col}${netCashFlowRow}+${col}${capexImpactRow}`, result: 0 },
      fill: S.lightBlueFill, font: S.navyFont, alignment: S.right, numFmt: S.currencyFmt,
    });
  });
  const netWithCapexRow = r;
  r++;

  // Cumulative cash flow
  ws.getRow(r).height = 18;
  applyCell(ws.getCell(`A${r}`), { value: 'Cumulative Cash Flow', fill: S.grayFill, font: S.navyBoldFont });
  const yearCols = ['B', 'C', 'D', 'E', 'F'];
  yearCols.forEach((col, i) => {
    const formula = i === 0
      ? `B${netWithCapexRow}`
      : `${yearCols[i - 1]}${r}+${col}${netWithCapexRow}`;
    applyCell(ws.getCell(`${col}${r}`), {
      value: { formula, result: 0 },
      fill: S.grayFill, font: S.navyFont, alignment: S.right, numFmt: S.currencyFmt,
    });
  });
  const cumFlowRow = r;
  r += 2;

  // Summary block
  sectionHeader(ws, r, '5-Year Summary', 'G'); r++;

  ws.getRow(r).height = 20;
  applyCell(ws.getCell(`A${r}`), { value: '5-Year NPV', font: S.blueFont });
  applyCell(ws.getCell(`B${r}`), {
    value: { formula: `NPV(${cellMap.wacc},C${netWithCapexRow}:F${netWithCapexRow})+B${netWithCapexRow}`, result: result.npv },
    font: { bold: true, color: { argb: 'FF004FDB' } }, alignment: S.right, numFmt: S.currencyFmt,
  });
  r++;

  ws.getRow(r).height = 20;
  applyCell(ws.getCell(`A${r}`), { value: '5-Year ROI', font: S.blueFont });
  applyCell(ws.getCell(`B${r}`), {
    value: { formula: `(F${cumFlowRow}-B${capexImpactRow})/(ABS(B${capexImpactRow})+${cellMap.monthlyFee}*12*5)`, result: result.fiveYrRoi - 1 },
    font: { bold: true, color: { argb: 'FF004FDB' } }, alignment: S.right, numFmt: '0.0%',
  });
  r++;

  ws.getRow(r).height = 20;
  applyCell(ws.getCell(`A${r}`), { value: 'Payback Period (approx weeks)', font: S.blueFont });
  applyCell(ws.getCell(`B${r}`), {
    value: result.paybackWeeks ? fmtWks(result.paybackWeeks) : 'N/A',
    font: { bold: true, color: { argb: 'FF004FDB' } }, alignment: S.right,
  });
}

// ──────────────────────────────────────────────────────────────────
// Main export function
// ──────────────────────────────────────────────────────────────────
export async function generateExcel(ops, useCases, fin, result) {
  const wb = new Workbook();
  wb.creator = 'Xemelgo ROI Calculator';
  wb.created = new Date();

  const summarySheet = wb.addWorksheet('ROI Summary');
  buildSummarySheet(summarySheet, ops, fin, result);

  const modelSheet = wb.addWorksheet('Financial Model');
  buildFinancialModelSheet(modelSheet, ops, useCases, fin, result);

  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const companyName = ops.companyName?.trim() || 'Your_Facility';
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `Xemelgo_Financial_Model_${companyName.replace(/\s+/g, '_')}_${today}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
