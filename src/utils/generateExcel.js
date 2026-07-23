import { Workbook } from 'exceljs';

const NAVY   = 'FF1F3A6E';
const BLUE   = 'FF3B6FD4';
const BGBLUE = 'FFF0F5FF';
const YELLOW = 'FFFEF3C7';
const LGRAY  = 'FFF5F5F5';
const DGRAY  = 'FFE2E2E2';
const WHITE  = 'FFFFFFFF';
const RED    = 'FFCC0000';
const GREEN  = 'FF008E73';

const fill  = (argb) => ({ type: 'pattern', pattern: 'solid', fgColor: { argb } });
const font  = (opts) => opts;
const align = (h, v = 'middle') => ({ horizontal: h, vertical: v, wrapText: true });
const border1 = { style: 'thin', color: { argb: 'FFD9D9D9' } };
const thinBorder = { top: border1, bottom: border1, left: border1, right: border1 };

function c(ws, addr, value, fillArgb, fontOpts, alignment, numFmt) {
  const cell = ws.getCell(addr);
  if (value !== undefined) cell.value = value;
  if (fillArgb) cell.fill = fill(fillArgb);
  if (fontOpts) cell.font = fontOpts;
  if (alignment) cell.alignment = alignment;
  if (numFmt) cell.numFmt = numFmt;
}

function sHdr(ws, addr, text, endAddr) {
  if (endAddr) ws.mergeCells(`${addr}:${endAddr}`);
  c(ws, addr, text, BLUE, font({ bold: true, color: { argb: WHITE }, size: 11 }), align('left'));
}

function colNumToLetter(n) {
  let s = '';
  while (n > 0) { const rem = (n - 1) % 26; s = String.fromCharCode(65 + rem) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function accentBar(ws, endCol, row) {
  ws.getRow(row).height = 4;
  ws.mergeCells(`A${row}:${endCol}${row}`);
  c(ws, `A${row}`, '', BLUE);
}

function drawColorKey(ws, startRow, startCol) {
  [[BGBLUE, 'assumptions'], [YELLOW, 'customer inputs'], [WHITE, 'calculated']].forEach(([color, label], i) => {
    const r = startRow + i;
    const colA = colNumToLetter(startCol);
    const colB = colNumToLetter(startCol + 1);
    c(ws, `${colA}${r}`, '', color);
    ws.getCell(`${colA}${r}`).border = thinBorder;
    c(ws, `${colB}${r}`, label, null, font({ size: 10, color: { argb: '374151' } }), align('left'));
  });
}

function fv(ws, addr, formula, result, fillArgb, fontOpts, alignment, numFmt) {
  const cell = ws.getCell(addr);
  cell.value = { formula, result };
  if (fillArgb) cell.fill = fill(fillArgb);
  if (fontOpts) cell.font = fontOpts;
  if (alignment) cell.alignment = alignment;
  if (numFmt) cell.numFmt = numFmt;
}

const LABOR_BUCKET_KEYS = ['cycleCount','audit','locateItems','workOrderTracking','picklistVerification','shipReceiveVerification','internalDelivery','goodsReceipt','automatedPackCount','outboundAudit','returnsTransfers','inventoryRequests'];

const UC_NAMES = {
  cycleCount:              'Cycle Counting',
  audit:                   'Full Inventory Audit',
  locateItems:             'Locate Items',
  workOrderTracking:       'Work Order Cycle Time Tracking',
  picklistVerification:    'Picklist Verification',
  shipReceiveVerification: 'Ship & Receive Verification',
  internalDelivery:        'Internal Delivery Verification',
  expiredProducts:         'Expired Products',
  calibrationReminders:    'Calibration Reminders',
  geofencing:              'Geofencing',
  goodsReceipt:            'Goods Receipt',
  automatedPackCount:      'Automated Pack Count',
  outboundAudit:           'Outbound Shipment Audit',
  returnsTransfers:        'Returns and Transfers',
  inventoryRequests:       'Inventory Requests',
  shrinkage:               'Shrinkage and Loss Prevention',
  productionEquipment:     'Production Equipment Tracking',
  rtiTracking:             'Totes and Containers Tracking',
  proofOfDelivery:         'Proof of Delivery',
  qualityExceptionTracking:    'Quality Exception Path Tracking',
  expeditedExceptionTracking:  'Expedited Exception Path Tracking',
  workingCapitalImprovement:   'Working Capital Improvement',
  fasterFulfillment:       'Faster Order Fulfillment',
  misShipReduction:        'Mis-Ship Reduction',
  dockTurnSpeed:           'Receiving and Shipping Throughput',
};

const UNITS_LABEL = {
  '':            'Units Produced Per Month',
  manufacturing: 'Units Produced Per Month',
  retail:        'Orders Shipped Per Month',
  supplychain:   'Shipments Processed Per Month',
  healthcare:    'Lots or Batches Completed Per Month',
  other:         'Units or Jobs Per Month',
};

function getLaborHours(key, uc, ops) {
  const dpy = ops.workDaysPerWeek * ops.workWeeksPerYear;
  const dpw = ops.workDaysPerWeek;
  switch (key) {
    case 'cycleCount': {
      const ah = uc.hoursPerSession * uc.sessionsPerWeek * 50 * uc.peoplePerSession * uc.reductionPct;
      return { timeSavedPerDay: ah / dpy, peopleAffected: uc.peoplePerSession, weeklyHrs: uc.hoursPerSession * uc.sessionsPerWeek * uc.peoplePerSession * uc.reductionPct, annualHrs: ah, rate: uc.burdenedRate };
    }
    case 'audit': {
      const ah = uc.people * uc.daysPerAudit * uc.hoursPerDay * uc.auditsPerYear * uc.reductionPct;
      return { timeSavedPerDay: ah / dpy, peopleAffected: uc.people, weeklyHrs: ah / ops.workWeeksPerYear, annualHrs: ah, rate: uc.burdenedRate };
    }
    case 'locateItems':
    case 'workOrderTracking': {
      const rows = uc.roleRows || [];
      const annualHrs = rows.reduce((s, row) => s + row.hoursLostPerDay * row.headcount * dpy * uc.reductionPct, 0);
      const weeklyHrs = rows.reduce((s, row) => s + row.hoursLostPerDay * row.headcount * dpw * uc.reductionPct, 0);
      const peopleAffected = rows.reduce((s, row) => s + (Number(row.headcount) || 0), 0);
      const avgRate = rows.length ? rows.reduce((s, row) => s + (Number(row.burdenedRate) || 0), 0) / rows.length : 0;
      return { timeSavedPerDay: annualHrs / dpy, peopleAffected, weeklyHrs, annualHrs, rate: avgRate };
    }
    case 'picklistVerification':
      return { timeSavedPerDay: 0, peopleAffected: 0, weeklyHrs: 0, annualHrs: 0, rate: 0 };
    case 'shipReceiveVerification':
    case 'goodsReceipt':
    case 'automatedPackCount': {
      const tpd = (uc.minutesSavedPerTransaction / 60) * uc.transactionsPerDay * uc.dockStaff * uc.reductionPct;
      return { timeSavedPerDay: tpd, peopleAffected: uc.dockStaff, weeklyHrs: tpd * dpw, annualHrs: tpd * dpy, rate: uc.burdenedRate };
    }
    case 'internalDelivery':
    case 'returnsTransfers': {
      const tpd = (uc.minutesPerTransfer / 60) * uc.transfersPerDay * uc.peoplePerTransfer * uc.reductionPct;
      return { timeSavedPerDay: tpd, peopleAffected: uc.peoplePerTransfer, weeklyHrs: tpd * dpw, annualHrs: tpd * dpy, rate: uc.burdenedRate };
    }
    case 'outboundAudit':
    case 'dockTurnSpeed': {
      const tpd = (uc.minutesSaved / 60) * uc.transactionsPerDay * uc.dockStaff * uc.reductionPct;
      return { timeSavedPerDay: tpd, peopleAffected: uc.dockStaff, weeklyHrs: tpd * dpw, annualHrs: tpd * dpy, rate: uc.burdenedRate };
    }
    case 'inventoryRequests': {
      const weeklyHrs = uc.hoursPerWeek * uc.peopleInvolved * uc.reductionPct;
      return { timeSavedPerDay: weeklyHrs / dpw, peopleAffected: uc.peopleInvolved, weeklyHrs, annualHrs: weeklyHrs * ops.workWeeksPerYear, rate: uc.burdenedRate };
    }
    default: return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SHEET 2: Savings Analysis
// Returns { totalGrossCell, netAnnualCell } as absolute $C$N strings
// ─────────────────────────────────────────────────────────────────────────────
function buildSavingsAnalysis(ws, ops, useCases, fin, result, dateISO) {
  const company        = ops.companyName?.trim() || 'Your Facility';
  const enabledUcNames = Object.entries(useCases).filter(([, uc]) => uc.enabled).map(([k]) => UC_NAMES[k] || k).join(', ');
  const unitsLbl       = UNITS_LABEL[ops.industry] ?? UNITS_LABEL[''];
  const shiftsLbl      = ops.industry === 'retail' ? 'Operating hours / day' : 'Shifts per day';

  ws.columns = [
    { width: 2  }, { width: 44 }, { width: 18 }, { width: 16 }, { width: 16 },
    { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 14 },
  ];

  let r = 1;

  ws.mergeCells(`B${r}:H${r}`); ws.getRow(r).height = 22;
  c(ws, `B${r}`, `Savings Analysis — ${company}  [${enabledUcNames}]`, NAVY, font({ bold: true, size: 12, color: { argb: WHITE } }), align('left'));
  drawColorKey(ws, 1, 9);
  r++; accentBar(ws, 'H', r); r++;

  // ── Operating Schedule inputs ─────────────────────────────────────────────
  ws.getRow(r).height = 20; ws.mergeCells(`B${r}:H${r}`);
  sHdr(ws, `B${r}`, 'Tell us about your shop');
  r++;

  const osCells = {};
  [
    [unitsLbl,              ops.unitsPerMonth,    'unitsPerMonth',    '#,##0'],
    ['Work weeks / year',   ops.workWeeksPerYear, 'workWeeksPerYear', '0'],
    ['Working days / week', ops.workDaysPerWeek,  'workDaysPerWeek',  '0'],
    [shiftsLbl,             ops.shiftsPerDay,     'shiftsPerDay',     '0'],
  ].forEach(([lbl, val, key, fmt]) => {
    ws.getRow(r).height = 18;
    c(ws, `B${r}`, lbl, LGRAY, font({ size: 11, color: { argb: NAVY } }), align('left'));
    c(ws, `C${r}`, val, YELLOW, font({ bold: true, size: 11, color: { argb: NAVY } }), align('right'), fmt);
    ['B','C'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
    osCells[key] = `$C$${r}`;
    r++;
  });

  r++; ws.getRow(r - 1).height = 8;

  // ── Team makeup ───────────────────────────────────────────────────────────
  ws.getRow(r).height = 20; ws.mergeCells(`B${r}:H${r}`);
  sHdr(ws, `B${r}`, 'What is the makeup of the team?');
  r++;

  ws.getRow(r).height = 18;
  ['Role','Team Size (FTEs)','Fully Burdened Rate','~30% burden included'].forEach((h, i) => {
    const col = colNumToLetter(2 + i);
    c(ws, `${col}${r}`, h, BGBLUE, font({ bold: true, size: 10, color: { argb: NAVY } }), align('center'));
    ws.getCell(`${col}${r}`).border = thinBorder;
  });
  r++;

  const teamData = [
    ['Material Handlers',            ops.materialHandlerCount, ops.materialHandlerRate],
    ['Planners',                      ops.plannerCount,         ops.plannerRate        ],
    ['Indirect Support / Leadership', ops.indirectCount,        ops.indirectRate       ],
    ['Direct Employees',              ops.directCount,          ops.directRate         ],
  ];
  const hcCells = [];
  teamData.forEach(([lbl, hc, rate], i) => {
    ws.getRow(r).height = 18;
    const bg = i % 2 === 0 ? WHITE : LGRAY;
    c(ws, `B${r}`, lbl,  bg,     font({ size: 11, color: { argb: NAVY } }), align('left'));
    c(ws, `C${r}`, hc,   YELLOW, font({ bold: true, size: 11, color: { argb: NAVY } }), align('right'), '0');
    c(ws, `D${r}`, rate, YELLOW, font({ bold: true, size: 11, color: { argb: NAVY } }), align('right'), '$#,##0');
    ['B','C','D'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
    hcCells.push(`$C$${r}`);
    r++;
  });
  ws.getRow(r).height = 18;
  c(ws, `B${r}`, 'Total', BGBLUE, font({ bold: true, size: 11, color: { argb: NAVY } }), align('left'));
  fv(ws, `C${r}`, `=SUM(${hcCells.join(',')})`, teamData.reduce((s, [,hc]) => s + (hc || 0), 0), BGBLUE, font({ bold: true, size: 11, color: { argb: NAVY } }), align('right'), '0');
  ['B','C'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
  r++;

  r++; ws.getRow(r - 1).height = 8;

  // ── UC Assumptions section ────────────────────────────────────────────────
  const enabledUcKeys = Object.keys(useCases).filter(k => useCases[k]?.enabled);
  const ucCells = {};

  if (enabledUcKeys.length > 0) {
    ws.getRow(r).height = 20; ws.mergeCells(`B${r}:H${r}`);
    sHdr(ws, `B${r}`, 'Use Case Assumptions (yellow cells are editable)');
    r++;

    const writeField = (ucKey, label, value, fieldKey, fmt = '#,##0') => {
      ws.getRow(r).height = 16;
      c(ws, `B${r}`, label, LGRAY, font({ size: 10, color: { argb: NAVY } }), align('left'));
      c(ws, `C${r}`, value, YELLOW, font({ size: 10, color: { argb: NAVY } }), align('right'), fmt);
      ['B','C'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
      if (!ucCells[ucKey]) ucCells[ucKey] = {};
      ucCells[ucKey][fieldKey] = `$C$${r}`;
      r++;
    };
    const writePct = (ucKey, label, value, fieldKey) => writeField(ucKey, label, value, fieldKey, '0.0%');

    for (const key of enabledUcKeys) {
      const uc = useCases[key];
      if (!ucCells[key]) ucCells[key] = {};

      ws.getRow(r).height = 18; ws.mergeCells(`B${r}:H${r}`);
      c(ws, `B${r}`, UC_NAMES[key] || key, BGBLUE, font({ bold: true, size: 11, color: { argb: NAVY } }), align('left'));
      r++;

      switch (key) {
        case 'cycleCount':
          if ((uc.mode || 'reductionPct') === 'employeeDelta') {
            writeField(key, 'Employees before', uc.employeesBefore, 'employeesBefore', '0');
            writeField(key, 'Hours per count (before)', uc.hoursPerCountBefore, 'hoursPerCountBefore', '0.0');
            writeField(key, 'Employees after', uc.employeesAfter, 'employeesAfter', '0');
            writeField(key, 'Hours per count (after)', uc.hoursPerCountAfter, 'hoursPerCountAfter', '0.0');
            writeField(key, 'Counts per year', uc.countsPerYear, 'countsPerYear', '0');
            writeField(key, 'Burdened rate ($/hr)', uc.burdenedRate, 'burdenedRate', '$#,##0');
          } else {
            writeField(key, 'Hours per session', uc.hoursPerSession, 'hoursPerSession', '0.0');
            writeField(key, 'Sessions per week', uc.sessionsPerWeek, 'sessionsPerWeek', '0.0');
            writeField(key, 'People per session', uc.peoplePerSession, 'peoplePerSession', '0');
            writeField(key, 'Burdened rate ($/hr)', uc.burdenedRate, 'burdenedRate', '$#,##0');
            writePct(key, 'Efficiency improvement', uc.reductionPct, 'reductionPct');
          }
          break;
        case 'audit':
          writeField(key, 'People per audit', uc.people, 'people', '0');
          writeField(key, 'Days per audit', uc.daysPerAudit, 'daysPerAudit', '0.0');
          writeField(key, 'Hours per day', uc.hoursPerDay, 'hoursPerDay', '0.0');
          writeField(key, 'Audits per year', uc.auditsPerYear, 'auditsPerYear', '0');
          writeField(key, 'Burdened rate ($/hr)', uc.burdenedRate, 'burdenedRate', '$#,##0');
          writePct(key, 'Efficiency improvement', uc.reductionPct, 'reductionPct');
          if (Number(uc.downtimeCostPerDay) > 0) {
            writeField(key, 'Downtime cost per day ($)', Number(uc.downtimeCostPerDay), 'downtimeCostPerDay', '$#,##0');
          }
          break;
        case 'locateItems':
        case 'workOrderTracking': {
          ucCells[key].roleRows = [];
          const roleRows = (uc.roleRows || []).filter(row => Number(row.headcount) > 0);
          roleRows.forEach((row, i) => {
            ws.getRow(r).height = 16;
            c(ws, `B${r}`, `  Role ${i + 1}: ${row.role || 'Team Member'}`, LGRAY, font({ size: 10, italic: true, color: { argb: NAVY } }), align('left'));
            r++;
            const rr = {};
            writeField(key, '  Hours lost per day', row.hoursLostPerDay, `r${i}_hld`, '0.00');
            rr.hld = ucCells[key][`r${i}_hld`];
            writeField(key, '  Headcount', row.headcount, `r${i}_hc`, '0');
            rr.hc = ucCells[key][`r${i}_hc`];
            writeField(key, '  Burdened rate ($/hr)', row.burdenedRate, `r${i}_br`, '$#,##0');
            rr.br = ucCells[key][`r${i}_br`];
            ucCells[key].roleRows.push(rr);
          });
          writePct(key, 'Efficiency improvement', uc.reductionPct, 'reductionPct');
          break;
        }
        case 'picklistVerification':
          writeField(key, 'Picks per day', uc.picksPerDay, 'picksPerDay', '#,##0');
          writeField(key, 'Error rate (%)', uc.errorRate, 'errorRate', '0.00');
          writeField(key, 'Cost per error ($)', uc.costPerError, 'costPerError', '$#,##0');
          writePct(key, 'Error reduction', uc.reductionPct, 'reductionPct');
          break;
        case 'shipReceiveVerification':
        case 'goodsReceipt':
        case 'automatedPackCount':
          writeField(key, 'Minutes saved per transaction', uc.minutesSavedPerTransaction, 'minutesSavedPerTransaction', '0.0');
          writeField(key, 'Transactions per day', uc.transactionsPerDay, 'transactionsPerDay', '0');
          writeField(key, 'Dock staff', uc.dockStaff, 'dockStaff', '0');
          writeField(key, 'Burdened rate ($/hr)', uc.burdenedRate, 'burdenedRate', '$#,##0');
          writePct(key, 'Efficiency improvement', uc.reductionPct, 'reductionPct');
          break;
        case 'internalDelivery':
        case 'returnsTransfers':
          writeField(key, 'Minutes per transfer', uc.minutesPerTransfer, 'minutesPerTransfer', '0.0');
          writeField(key, 'Transfers per day', uc.transfersPerDay, 'transfersPerDay', '0');
          writeField(key, 'People per transfer', uc.peoplePerTransfer, 'peoplePerTransfer', '0');
          writeField(key, 'Burdened rate ($/hr)', uc.burdenedRate, 'burdenedRate', '$#,##0');
          writePct(key, 'Efficiency improvement', uc.reductionPct, 'reductionPct');
          break;
        case 'outboundAudit':
        case 'dockTurnSpeed':
          writeField(key, 'Minutes saved per transaction', uc.minutesSaved, 'minutesSaved', '0.0');
          writeField(key, 'Transactions per day', uc.transactionsPerDay, 'transactionsPerDay', '0');
          writeField(key, 'Dock staff', uc.dockStaff, 'dockStaff', '0');
          writeField(key, 'Burdened rate ($/hr)', uc.burdenedRate, 'burdenedRate', '$#,##0');
          writePct(key, 'Efficiency improvement', uc.reductionPct, 'reductionPct');
          break;
        case 'inventoryRequests':
          writeField(key, 'Hours per week', uc.hoursPerWeek, 'hoursPerWeek', '0.0');
          writeField(key, 'People involved', uc.peopleInvolved, 'peopleInvolved', '0');
          writeField(key, 'Burdened rate ($/hr)', uc.burdenedRate, 'burdenedRate', '$#,##0');
          writePct(key, 'Efficiency improvement', uc.reductionPct, 'reductionPct');
          break;
        case 'expiredProducts':
        case 'geofencing':
        case 'productionEquipment':
        case 'rtiTracking':
        case 'proofOfDelivery':
          writeField(key, 'Incidents per year', uc.incidentsPerYear, 'incidentsPerYear', '#,##0');
          writeField(key, 'Cost per incident ($)', uc.costPerIncident, 'costPerIncident', '$#,##0');
          writePct(key, 'Reduction rate', uc.reductionPct, 'reductionPct');
          break;
        case 'calibrationReminders':
          writeField(key, 'Failures per year', uc.failuresPerYear, 'failuresPerYear', '#,##0');
          writeField(key, 'Cost per failure ($)', uc.costPerFailure, 'costPerFailure', '$#,##0');
          writePct(key, 'Reduction rate', uc.reductionPct, 'reductionPct');
          break;
        case 'shrinkage':
          writeField(key, 'Incidents per year', uc.incidentsPerYear, 'incidentsPerYear', '#,##0');
          writeField(key, 'Material value per incident ($)', uc.materialValuePerIncident ?? uc.costPerIncident ?? 0, 'materialValue', '$#,##0');
          writeField(key, 'Labor hours per incident', uc.laborHoursPerIncident || 0, 'laborHours', '0.0');
          writeField(key, 'Burdened rate ($/hr)', uc.burdenedRate, 'burdenedRate', '$#,##0');
          writeField(key, 'Scrap cost per incident ($)', Number(uc.scrapCostPerIncident) || 0, 'scrapCost', '$#,##0');
          writeField(key, 'Schedule impact per incident ($)', Number(uc.scheduleImpactPerIncident) || 0, 'scheduleImpact', '$#,##0');
          writePct(key, 'Reduction rate', uc.reductionPct, 'reductionPct');
          break;
        case 'qualityExceptionTracking':
          writeField(key, 'Exceptions per year', uc.exceptionsPerYear, 'exceptionsPerYear', '#,##0');
          writeField(key, 'Rework cost per exception ($)', uc.reworkCostPerException, 'reworkCost', '$#,##0');
          writeField(key, 'Scrap cost per exception ($)', Number(uc.scrapCostPerException) || 0, 'scrapCost', '$#,##0');
          writePct(key, 'Reduction rate', uc.reductionPct, 'reductionPct');
          break;
        case 'expeditedExceptionTracking':
          writeField(key, 'Late shipments per month', uc.lateShipmentsPerMonth, 'lateShipmentsPerMonth', '#,##0');
          writeField(key, 'Cost per late shipment ($)', uc.costPerLateShipment, 'costPerLateShipment', '$#,##0');
          writePct(key, 'Reduction rate', uc.reductionPct, 'reductionPct');
          break;
        case 'workingCapitalImprovement':
          writeField(key, 'WIP inventory value ($)', uc.wipInventoryValue, 'wipInventoryValue', '$#,##0');
          writePct(key, 'Inventory turn improvement', uc.reductionPct, 'reductionPct');
          writePct(key, 'WACC (cost of capital)', fin.wacc || 0.085, 'wacc');
          break;
        case 'fasterFulfillment':
          writeField(key, 'Current cycle time (hrs)', uc.currentCycleTime, 'currentCycleTime', '0.0');
          writeField(key, 'Target cycle time (hrs)', uc.targetCycleTime, 'targetCycleTime', '0.0');
          writeField(key, 'Orders per month', uc.ordersPerMonth, 'ordersPerMonth', '#,##0');
          writeField(key, 'Revenue per order ($)', uc.revenuePerOrder, 'revenuePerOrder', '$#,##0');
          break;
        case 'misShipReduction':
          writeField(key, 'Mis-ships per month', uc.misShipsPerMonth, 'misShipsPerMonth', '#,##0');
          writeField(key, 'Cost per mis-ship ($)', uc.costPerMisShip, 'costPerMisShip', '$#,##0');
          writePct(key, 'Reduction rate', uc.reductionPct, 'reductionPct');
          break;
        default: break;
      }
    }

    r++; ws.getRow(r - 1).height = 8;
  }

  // ── Build Excel formula string for each UC ────────────────────────────────
  const dpyF = `(${osCells.workDaysPerWeek}*${osCells.workWeeksPerYear})`;

  function ucFormula(key) {
    const cc = ucCells[key] || {};
    switch (key) {
      case 'cycleCount':
        if ((useCases[key].mode || 'reductionPct') === 'employeeDelta') {
          return `=(${cc.employeesBefore}*${cc.hoursPerCountBefore}-${cc.employeesAfter}*${cc.hoursPerCountAfter})*${cc.countsPerYear}*${cc.burdenedRate}`;
        }
        return `=${cc.hoursPerSession}*${cc.sessionsPerWeek}*50*${cc.peoplePerSession}*${cc.burdenedRate}*${cc.reductionPct}`;
      case 'audit': {
        const labor = `${cc.people}*${cc.daysPerAudit}*${cc.hoursPerDay}*${cc.auditsPerYear}*${cc.burdenedRate}*${cc.reductionPct}`;
        const dt = cc.downtimeCostPerDay ? `+${cc.downtimeCostPerDay}*${cc.daysPerAudit}*${cc.auditsPerYear}` : '';
        return `=${labor}${dt}`;
      }
      case 'locateItems':
      case 'workOrderTracking': {
        const rrs = cc.roleRows || [];
        if (!rrs.length) return '=0';
        return `=${rrs.map(rr => `${rr.hld}*${rr.hc}*${dpyF}*${rr.br}*${cc.reductionPct}`).join('+')}`;
      }
      case 'picklistVerification':
        return `=${cc.picksPerDay}*(${cc.errorRate}/100)*${cc.costPerError}*${dpyF}*${cc.reductionPct}`;
      case 'shipReceiveVerification':
      case 'goodsReceipt':
      case 'automatedPackCount':
        return `=(${cc.minutesSavedPerTransaction}/60)*${cc.transactionsPerDay}*${cc.dockStaff}*${dpyF}*${cc.burdenedRate}*${cc.reductionPct}`;
      case 'internalDelivery':
      case 'returnsTransfers':
        return `=(${cc.minutesPerTransfer}/60)*${cc.transfersPerDay}*${cc.peoplePerTransfer}*${dpyF}*${cc.burdenedRate}*${cc.reductionPct}`;
      case 'outboundAudit':
      case 'dockTurnSpeed':
        return `=(${cc.minutesSaved}/60)*${cc.transactionsPerDay}*${cc.dockStaff}*${dpyF}*${cc.burdenedRate}*${cc.reductionPct}`;
      case 'inventoryRequests':
        return `=${cc.hoursPerWeek}*${cc.peopleInvolved}*${osCells.workWeeksPerYear}*${cc.burdenedRate}*${cc.reductionPct}`;
      case 'expiredProducts':
      case 'geofencing':
      case 'productionEquipment':
      case 'rtiTracking':
      case 'proofOfDelivery':
        return `=${cc.incidentsPerYear}*${cc.costPerIncident}*${cc.reductionPct}`;
      case 'calibrationReminders':
        return `=${cc.failuresPerYear}*${cc.costPerFailure}*${cc.reductionPct}`;
      case 'shrinkage':
        return `=${cc.incidentsPerYear}*(${cc.materialValue}+${cc.laborHours}*${cc.burdenedRate}+${cc.scrapCost}+${cc.scheduleImpact})*${cc.reductionPct}`;
      case 'qualityExceptionTracking':
        return `=${cc.exceptionsPerYear}*${cc.reductionPct}*(${cc.reworkCost}+${cc.scrapCost})`;
      case 'expeditedExceptionTracking':
        return `=${cc.lateShipmentsPerMonth}*12*${cc.costPerLateShipment}*${cc.reductionPct}`;
      case 'workingCapitalImprovement':
        return `=${cc.wipInventoryValue}*${cc.reductionPct}*${cc.wacc}`;
      case 'fasterFulfillment':
        return `=IF(${cc.currentCycleTime}>0,(${cc.currentCycleTime}-${cc.targetCycleTime})/${cc.currentCycleTime}*${cc.ordersPerMonth}*12*${cc.revenuePerOrder}*0.1,0)`;
      case 'misShipReduction':
        return `=${cc.misShipsPerMonth}*12*${cc.costPerMisShip}*${cc.reductionPct}`;
      default: return '=0';
    }
  }

  // ── Labor Savings table ───────────────────────────────────────────────────
  ws.getRow(r).height = 20; ws.mergeCells(`B${r}:I${r}`);
  sHdr(ws, `B${r}`, 'Estimated Labor Savings');
  r++;

  ws.getRow(r).height = 18;
  ['Use Case / Justification','Time Saved / Day (hrs)','People Affected / Day','Est. Weekly Hrs Saved','Est. Annual Hrs Saved','Weekly Opportunity Value','Annual Opportunity Value'].forEach((h, i) => {
    const col = colNumToLetter(2 + i);
    c(ws, `${col}${r}`, h, BGBLUE, font({ bold: true, size: 10, color: { argb: NAVY } }), align('center'));
    ws.getCell(`${col}${r}`).border = thinBorder;
  });
  r++;

  const laborAnnCells = [];
  LABOR_BUCKET_KEYS.forEach(key => {
    if (!useCases[key]?.enabled) return;
    const uc = useCases[key];
    const h = getLaborHours(key, uc, ops);
    if (!h) return;
    const liResult = result.buckets.find(b => b.name === 'Labor Efficiency')?.lineItems.find(l => l.key === key);
    const annValCached = liResult?.annualValue ?? 0;
    const justification = uc.justification?.trim();
    ws.getRow(r).height = justification ? 32 : 18;
    const bg = key === 'picklistVerification' ? LGRAY : WHITE;
    if (justification) {
      const cell = ws.getCell(`B${r}`);
      cell.value = { richText: [
        { font: { name: 'Calibri', size: 11, bold: true, color: { argb: NAVY } }, text: UC_NAMES[key] + '\n' },
        { font: { name: 'Calibri', size: 10, italic: true, color: { argb: 'FF666666' } }, text: justification },
      ] };
      cell.fill = fill(bg);
      cell.alignment = { horizontal: 'left', vertical: 'top', wrapText: true };
    } else {
      c(ws, `B${r}`, UC_NAMES[key], bg, font({ size: 11, color: { argb: NAVY } }), align('left'));
    }
    c(ws, `C${r}`, h.timeSavedPerDay, YELLOW, font({ size: 11, color: { argb: NAVY } }), align('right'), '0.00');
    c(ws, `D${r}`, h.peopleAffected,  YELLOW, font({ size: 11, color: { argb: NAVY } }), align('right'), '0');
    c(ws, `E${r}`, h.weeklyHrs,  DGRAY, font({ size: 11, color: { argb: NAVY } }), align('right'), '0.0');
    c(ws, `F${r}`, h.annualHrs,  DGRAY, font({ size: 11, color: { argb: NAVY } }), align('right'), '0.0');
    c(ws, `G${r}`, h.weeklyHrs * h.rate > 0 ? h.weeklyHrs * h.rate : 0, DGRAY, font({ size: 11, color: { argb: NAVY } }), align('right'), '$#,##0');
    if (enabledUcKeys.includes(key)) {
      fv(ws, `H${r}`, ucFormula(key), annValCached, DGRAY, font({ size: 11, color: { argb: NAVY } }), align('right'), '$#,##0');
    } else {
      c(ws, `H${r}`, annValCached, DGRAY, font({ size: 11, color: { argb: NAVY } }), align('right'), '$#,##0');
    }
    ['B','C','D','E','F','G','H'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
    laborAnnCells.push(`$H$${r}`);
    r++;
  });

  const laborTotal = result.buckets.find(b => b.name === 'Labor Efficiency')?.subtotal ?? 0;
  ws.getRow(r).height = 20;
  c(ws, `B${r}`, 'Labor Savings Total', BGBLUE, font({ bold: true, size: 11, color: { argb: NAVY } }), align('left'));
  if (laborAnnCells.length > 0) {
    fv(ws, `H${r}`, `=SUM(${laborAnnCells.join(',')})`, laborTotal, BGBLUE, font({ bold: true, size: 11, color: { argb: NAVY } }), align('right'), '$#,##0');
  } else {
    c(ws, `H${r}`, 0, BGBLUE, font({ bold: true, size: 11, color: { argb: NAVY } }), align('right'), '$#,##0');
  }
  ['B','H'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
  const laborTotalCell = `$H$${r}`;
  r++;

  r++; ws.getRow(r - 1).height = 8;

  // ── Other Savings table ───────────────────────────────────────────────────
  ws.getRow(r).height = 20; ws.mergeCells(`B${r}:H${r}`);
  sHdr(ws, `B${r}`, 'Estimated Other Savings (Loss Prevention & Revenue)');
  r++;

  ws.getRow(r).height = 18;
  ['Activity with Savings Opportunity','Quarterly Opportunity Value','Monthly Opportunity Value','Annual Opportunity Value'].forEach((h, i) => {
    const col = colNumToLetter(2 + i);
    c(ws, `${col}${r}`, h, BGBLUE, font({ bold: true, size: 10, color: { argb: NAVY } }), align('center'));
    ws.getCell(`${col}${r}`).border = thinBorder;
  });
  r++;

  const otherAnnCells = [];
  result.buckets.filter(b => b.name !== 'Labor Efficiency').forEach(bucket => {
    bucket.lineItems.forEach(li => {
      ws.getRow(r).height = 18;
      c(ws, `B${r}`, li.name, WHITE, font({ size: 11, color: { argb: NAVY } }), align('left'));
      if (enabledUcKeys.includes(li.key)) {
        const formula = ucFormula(li.key);
        fv(ws, `E${r}`, formula, li.annualValue, DGRAY, font({ size: 11, color: { argb: NAVY } }), align('right'), '$#,##0');
        fv(ws, `C${r}`, `=$E$${r}/4`,  li.annualValue / 4,  DGRAY, font({ size: 11, color: { argb: NAVY } }), align('right'), '$#,##0');
        fv(ws, `D${r}`, `=$E$${r}/12`, li.annualValue / 12, DGRAY, font({ size: 11, color: { argb: NAVY } }), align('right'), '$#,##0');
      } else {
        c(ws, `C${r}`, li.annualValue / 4,  DGRAY, font({ size: 11, color: { argb: NAVY } }), align('right'), '$#,##0');
        c(ws, `D${r}`, li.annualValue / 12, DGRAY, font({ size: 11, color: { argb: NAVY } }), align('right'), '$#,##0');
        c(ws, `E${r}`, li.annualValue,      DGRAY, font({ size: 11, color: { argb: NAVY } }), align('right'), '$#,##0');
      }
      ['B','C','D','E'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
      otherAnnCells.push(`$E$${r}`);
      r++;
    });
  });

  const otherTotal = result.buckets.filter(b => b.name !== 'Labor Efficiency').reduce((s, b) => s + b.subtotal, 0);
  ws.getRow(r).height = 20;
  c(ws, `B${r}`, 'Other Savings Total', BGBLUE, font({ bold: true, size: 11, color: { argb: NAVY } }), align('left'));
  if (otherAnnCells.length > 0) {
    fv(ws, `E${r}`, `=SUM(${otherAnnCells.join(',')})`, otherTotal, BGBLUE, font({ bold: true, size: 11, color: { argb: NAVY } }), align('right'), '$#,##0');
    fv(ws, `C${r}`, `=$E$${r}/4`,  otherTotal / 4,  BGBLUE, font({ bold: true, size: 11, color: { argb: NAVY } }), align('right'), '$#,##0');
    fv(ws, `D${r}`, `=$E$${r}/12`, otherTotal / 12, BGBLUE, font({ bold: true, size: 11, color: { argb: NAVY } }), align('right'), '$#,##0');
  } else {
    ['C','D','E'].forEach(col => c(ws, `${col}${r}`, 0, BGBLUE, font({ bold: true, size: 11, color: { argb: NAVY } }), align('right'), '$#,##0'));
  }
  ['B','C','D','E'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
  const otherTotalCell = `$E$${r}`;
  r++;

  r++; ws.getRow(r - 1).height = 8;

  // ── Annual Summary ────────────────────────────────────────────────────────
  ws.getRow(r).height = 22; ws.mergeCells(`B${r}:H${r}`);
  sHdr(ws, `B${r}`, 'Estimated Annual Opportunity Summary');
  r++;

  ws.getRow(r).height = 18;
  c(ws, `B${r}`, 'Estimated Annual Labor Savings', WHITE, font({ size: 11, color: { argb: NAVY } }), align('left'));
  fv(ws, `C${r}`, `=${laborTotalCell}`, laborTotal, LGRAY, font({ size: 11, color: { argb: NAVY } }), align('right'), '$#,##0');
  ['B','C'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
  const laborSummaryCell = `$C$${r}`;
  r++;

  ws.getRow(r).height = 18;
  c(ws, `B${r}`, 'Estimated Annual Other Savings', LGRAY, font({ size: 11, color: { argb: NAVY } }), align('left'));
  fv(ws, `C${r}`, `=${otherTotalCell}`, otherTotal, LGRAY, font({ size: 11, color: { argb: NAVY } }), align('right'), '$#,##0');
  ['B','C'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
  const otherSummaryCell = `$C$${r}`;
  r++;

  ws.getRow(r).height = 18;
  c(ws, `B${r}`, 'Total Gross Annual Opportunity', BGBLUE, font({ bold: true, size: 11, color: { argb: BLUE } }), align('left'));
  fv(ws, `C${r}`, `=${laborSummaryCell}+${otherSummaryCell}`, result.totalGrossAnnual, BGBLUE, font({ bold: true, size: 11, color: { argb: BLUE } }), align('right'), '$#,##0');
  ['B','C'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
  const totalGrossCell = `$C$${r}`;
  r++;

  ws.getRow(r).height = 18;
  c(ws, `B${r}`, 'Annual Platform Cost', LGRAY, font({ size: 11, color: { argb: NAVY } }), align('left'));
  c(ws, `C${r}`, -result.annualSaasFee, LGRAY, font({ size: 11, color: { argb: RED } }), align('right'), '$#,##0;[Red]($#,##0)');
  ['B','C'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
  const platformCostCell = `$C$${r}`;
  r++;

  ws.getRow(r).height = 18;
  c(ws, `B${r}`, 'Net Annual Value', BGBLUE, font({ bold: true, size: 11, color: { argb: BLUE } }), align('left'));
  fv(ws, `C${r}`, `=${totalGrossCell}+${platformCostCell}`, result.netAnnualValue, BGBLUE, font({ bold: true, size: 11, color: { argb: BLUE } }), align('right'), '$#,##0');
  ['B','C'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
  const netAnnualCell = `$C$${r}`;

  return { totalGrossCell, netAnnualCell };
}

// ─────────────────────────────────────────────────────────────────────────────
// SHEET 3: Financial Analysis
// Returns refs object for Sheet 1 to reference
// ─────────────────────────────────────────────────────────────────────────────
function buildFinancialAnalysis(ws, ops, useCases, fin, result, saRefs, dateISO) {
  const company        = ops.companyName?.trim() || 'Your Facility';
  const enabledUcNames = Object.entries(useCases).filter(([, uc]) => uc.enabled).map(([k]) => UC_NAMES[k] || k).join(', ');
  const RAMP = [0, 0.25, 0.50, 0.75, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];
  const monthCols  = ['B','C','D','E','F','G','H','I','J','K','L','M','N'];
  const yearCols   = ['O','P','Q','R'];
  const allDataCols = [...monthCols, ...yearCols];

  ws.columns = [
    { width: 45 },
    ...Array(13).fill({ width: 11 }),
    ...Array(4).fill({ width: 14 }),
  ];

  function colFill(ci, base) {
    return (ci < 13 && ci % 2 === 1) ? BGBLUE : base;
  }

  let r = 1;

  ws.mergeCells(`A${r}:R${r}`); ws.getRow(r).height = 26;
  c(ws, `A${r}`, `5-Year Financial Analysis — ${company}  [${enabledUcNames}]`, NAVY, font({ bold: true, size: 13, color: { argb: WHITE } }), align('left'));
  r++;
  accentBar(ws, 'R', r); r++;

  ws.getRow(r).height = 16;
  c(ws, `A${r}`, `${company} inputs are in yellow cells.`, null, font({ size: 11, italic: true, color: { argb: '374151' } }), align('left'));
  drawColorKey(ws, r, 17);
  r++;

  // Column headers
  ws.getRow(r).height = 22;
  c(ws, `A${r}`, '', NAVY, font({ bold: true, size: 11, color: { argb: WHITE } }), align('left'));
  monthCols.forEach((col, i) => {
    c(ws, `${col}${r}`, i === 0 ? 'Year 1\nMonth 0' : `Month ${i}`, NAVY, font({ bold: true, size: 10, color: { argb: WHITE } }), align('center'));
    ws.getCell(`${col}${r}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });
  yearCols.forEach((col, i) => c(ws, `${col}${r}`, `Year ${i + 2}`, NAVY, font({ bold: true, size: 11, color: { argb: WHITE } }), align('center')));
  r++;

  // Cost Inputs
  ws.getRow(r).height = 20; ws.mergeCells(`A${r}:R${r}`);
  sHdr(ws, `A${r}`, 'Cost Inputs (yellow cells are editable)');
  r++;

  const capexLabel = enabledUcNames ? `${enabledUcNames.split(',')[0].trim()} CapEx` : 'Hardware & Installation CapEx';
  const costInputDefs = [
    [capexLabel,                                             Number(fin.capex) || 0,               YELLOW, '$#,##0'],
    ['CapEx Contingency',                                    fin.contingencyRate,                   YELLOW, '0.0%' ],
    ['Xemelgo Monthly Fee',                                  Number(fin.monthlyPlatformFee) || 0,   YELLOW, '$#,##0'],
    ['Estimated Annual Opportunity (from Savings Analysis)', result.totalGrossAnnual,               LGRAY,  '$#,##0'],
  ];
  const costCells = {};
  costInputDefs.forEach(([lbl, val, bg, fmt], i) => {
    ws.getRow(r).height = 18;
    c(ws, `A${r}`, lbl, i === 3 ? LGRAY : WHITE, font({ size: 11, color: { argb: NAVY } }), align('left'));
    if (i === 3 && saRefs?.totalGrossCell) {
      fv(ws, `B${r}`, `='Savings Analysis'!${saRefs.totalGrossCell}`, val, bg, font({ bold: true, size: 11, color: { argb: NAVY } }), align('right'), fmt);
    } else {
      c(ws, `B${r}`, val, bg, font({ bold: true, size: 11, color: { argb: NAVY } }), align('right'), fmt);
    }
    ws.getCell(`A${r}`).border = thinBorder;
    ws.getCell(`B${r}`).border = thinBorder;
    const key = ['capex','contingency','monthlyFee','annualOpp'][i];
    costCells[key] = `$B$${r}`;
    r++;
  });

  r++; ws.getRow(r - 1).height = 8;

  // 5-Year Financial Model grid
  ws.getRow(r).height = 22; ws.mergeCells(`A${r}:R${r}`);
  sHdr(ws, `A${r}`, '5-Year Financial Model');
  r++;

  // Track row numbers for formula references
  const oppRow      = r;
  const weightRow   = r + 1;
  const wOppRow     = r + 2;
  const hwRow       = r + 4;
  const feeRow      = r + 5;
  const costRow     = r + 6;
  const netRow      = r + 7;
  const cumRow      = r + 9;

  // Row: Estimated Total Opportunity Value
  ws.getRow(r).height = 18;
  c(ws, `A${r}`, 'Estimated Total Opportunity Value', BGBLUE, font({ size: 11, color: { argb: NAVY } }), align('left'));
  monthCols.forEach((col, i) => {
    const val = i === 0 ? 0 : result.totalGrossAnnual / 12;
    const formula = i === 0 ? '=0' : `=${costCells.annualOpp}/12`;
    fv(ws, `${col}${r}`, formula, val, colFill(i, BGBLUE), font({ size: 11, color: { argb: NAVY } }), align('right'), '$#,##0');
  });
  yearCols.forEach(col => {
    fv(ws, `${col}${r}`, `=${costCells.annualOpp}`, result.totalGrossAnnual, BGBLUE, font({ size: 11, color: { argb: NAVY } }), align('right'), '$#,##0');
  });
  r++;

  // Row: Weight
  ws.getRow(r).height = 18;
  c(ws, `A${r}`, 'Weight (With Learning Curve)', BGBLUE, font({ size: 11, color: { argb: NAVY } }), align('left'));
  monthCols.forEach((col, i) => c(ws, `${col}${r}`, RAMP[i], colFill(i, BGBLUE), font({ size: 11, color: { argb: NAVY } }), align('right'), '0.0%'));
  yearCols.forEach(col => c(ws, `${col}${r}`, 1.0, BGBLUE, font({ size: 11, color: { argb: NAVY } }), align('right'), '0.0%'));
  r++;

  // Row: Weighted Opportunity Value
  ws.getRow(r).height = 18;
  c(ws, `A${r}`, 'Weighted Opportunity Value', LGRAY, font({ size: 11, color: { argb: NAVY } }), align('left'));
  allDataCols.forEach((col, ci) => {
    const val = ci < 13 ? result.totalGrossAnnual / 12 * RAMP[ci] : result.totalGrossAnnual;
    fv(ws, `${col}${r}`, `=${col}$${oppRow}*${col}$${weightRow}`, val, colFill(ci, LGRAY), font({ size: 11, color: { argb: NAVY } }), align('right'), '$#,##0');
  });
  r++;

  r++; ws.getRow(r - 1).height = 6; // spacer inside table

  // Row: Hardware & Contingency
  ws.getRow(r).height = 18;
  c(ws, `A${r}`, 'Hardware & Contingency', LGRAY, font({ size: 11, color: { argb: NAVY } }), align('left'));
  fv(ws, `B${r}`, `=-(${costCells.capex}*(1+${costCells.contingency}))`, -result.totalCapex, colFill(0, LGRAY), font({ size: 11, color: { argb: RED } }), align('right'), '$#,##0;[Red]($#,##0)');
  monthCols.slice(1).forEach((col, i) => c(ws, `${col}${r}`, 0, colFill(i + 1, LGRAY), font({ size: 11, color: { argb: NAVY } }), align('right'), '$#,##0'));
  yearCols.forEach(col => c(ws, `${col}${r}`, 0, LGRAY, font({ size: 11, color: { argb: NAVY } }), align('right'), '$#,##0'));
  r++;

  // Row: Xemelgo Fee
  ws.getRow(r).height = 18;
  c(ws, `A${r}`, 'Xemelgo Fee', LGRAY, font({ size: 11, color: { argb: NAVY } }), align('left'));
  c(ws, `B${r}`, 0, colFill(0, LGRAY), font({ size: 11, color: { argb: NAVY } }), align('right'), '$#,##0');
  monthCols.slice(1).forEach((col, i) => {
    fv(ws, `${col}${r}`, `=-${costCells.monthlyFee}`, -fin.monthlyPlatformFee, colFill(i + 1, LGRAY), font({ size: 11, color: { argb: RED } }), align('right'), '$#,##0;[Red]($#,##0)');
  });
  yearCols.forEach(col => {
    fv(ws, `${col}${r}`, `=-${costCells.monthlyFee}*12`, -result.annualSaasFee, LGRAY, font({ size: 11, color: { argb: RED } }), align('right'), '$#,##0;[Red]($#,##0)');
  });
  r++;

  // Row: Total Cost
  ws.getRow(r).height = 18;
  c(ws, `A${r}`, 'Total Cost', DGRAY, font({ size: 11, color: { argb: NAVY } }), align('left'));
  allDataCols.forEach((col, ci) => {
    const hw  = ci === 0 ? -result.totalCapex : 0;
    const fee = ci === 0 ? 0 : ci < 13 ? -fin.monthlyPlatformFee : -result.annualSaasFee;
    fv(ws, `${col}${r}`, `=${col}$${hwRow}+${col}$${feeRow}`, hw + fee, colFill(ci, DGRAY), font({ size: 11, color: { argb: RED } }), align('right'), '$#,##0;[Red]($#,##0)');
  });
  r++;

  // Row: Net Savings
  ws.getRow(r).height = 20;
  c(ws, `A${r}`, 'Net Savings', BGBLUE, font({ bold: true, size: 11, color: { argb: NAVY } }), align('left'));
  allDataCols.forEach((col, ci) => {
    const v = result.cashFlows[ci] ?? 0;
    fv(ws, `${col}${r}`, `=${col}$${wOppRow}+${col}$${costRow}`, v, colFill(ci, BGBLUE), font({ bold: true, size: 11, color: { argb: NAVY } }), align('right'), '$#,##0;[Red]($#,##0)');
  });
  r++;

  r++; ws.getRow(r - 1).height = 6; // spacer

  // Row: Cumulative Cash Flows
  ws.getRow(r).height = 18;
  c(ws, `A${r}`, 'Cumulative Cash Flows', LGRAY, font({ bold: true, size: 11, color: { argb: NAVY } }), align('left'));
  const cumRowNum = r;
  let prevCumCol = null;
  let cumulative = 0;
  allDataCols.forEach((col, ci) => {
    cumulative += result.cashFlows[ci] ?? 0;
    const textColor = cumulative >= 0 ? GREEN : RED;
    const formula = prevCumCol ? `=$${prevCumCol}$${cumRowNum}+${col}$${netRow}` : `=${col}$${netRow}`;
    fv(ws, `${col}${r}`, formula, cumulative, colFill(ci, LGRAY), font({ size: 11, color: { argb: textColor } }), align('right'), '$#,##0;[Red]($#,##0)');
    prevCumCol = col;
  });
  r++;

  r++; ws.getRow(r - 1).height = 8;

  // Formulas for Summary — IRR series
  ws.getRow(r).height = 20; ws.mergeCells(`A${r}:R${r}`);
  sHdr(ws, `A${r}`, 'FORMULAS FOR SUMMARY CALCULATIONS');
  r++;

  ws.getRow(r).height = 20;
  c(ws, `A${r}`, 'Annual Summary', NAVY, font({ bold: true, size: 11, color: { argb: WHITE } }), align('left'));
  ['B','C','D','E','F','G'].forEach((col, i) => c(ws, `${col}${r}`, `Year ${i}`, NAVY, font({ bold: true, size: 11, color: { argb: WHITE } }), align('center')));
  r++;

  // IRR series row
  ws.getRow(r).height = 18;
  c(ws, `A${r}`, 'Annual Net Cash Flow (for IRR)', LGRAY, font({ size: 11, color: { argb: NAVY } }), align('left'));
  const year1Net = result.cashFlows.slice(1, 13).reduce((s, v) => s + v, 0);
  const irrVals  = [-result.totalCapex, year1Net, result.netAnnualValue, result.netAnnualValue, result.netAnnualValue, result.netAnnualValue];
  // Year 0 = -(capex * (1+contingency))
  fv(ws, `B${r}`, `=-(${costCells.capex}*(1+${costCells.contingency}))`, -result.totalCapex, LGRAY, font({ size: 11, color: { argb: RED } }), align('right'), '$#,##0');
  // Year 1 = SUM(months 1-12 net savings)
  fv(ws, `C${r}`, `=SUM(C$${netRow}:N$${netRow})`, year1Net, LGRAY, font({ size: 11, color: { argb: year1Net >= 0 ? NAVY : RED } }), align('right'), '$#,##0');
  // Years 2-5 = annual net savings = annualOpp - annualFee
  ['D','E','F','G'].forEach((col, i) => {
    fv(ws, `${col}${r}`, `=O$${netRow}`, result.netAnnualValue, LGRAY, font({ size: 11, color: { argb: result.netAnnualValue >= 0 ? NAVY : RED } }), align('right'), '$#,##0');
  });
  const irrSeriesRow = r;
  r++;

  // WACC row
  ws.getRow(r).height = 18;
  c(ws, `A${r}`, 'Cost of Capital (WACC)', WHITE, font({ size: 11, color: { argb: NAVY } }), align('left'));
  c(ws, `B${r}`, fin.wacc, YELLOW, font({ bold: true, size: 11, color: { argb: NAVY } }), align('right'), '0.0%');
  ws.getCell(`A${r}`).border = thinBorder;
  ws.getCell(`B${r}`).border = thinBorder;
  const waccCell = `$B$${r}`;
  r++;

  r++; ws.getRow(r - 1).height = 8;

  // Project Summary
  ws.getRow(r).height = 22; ws.mergeCells(`A${r}:R${r}`);
  sHdr(ws, `A${r}`, `Project Summary — ${enabledUcNames || company}`);
  r++;

  const irrVal = Math.min(result.irrAnnual ?? 0, 3.0);

  // NPV
  ws.getRow(r).height = 18;
  c(ws, `A${r}`, 'NPV (5 yr.)', WHITE, font({ size: 11, color: { argb: NAVY } }), align('left'));
  fv(ws, `B${r}`,
    `=B$${netRow}+NPV(${waccCell}/12,C$${netRow}:N$${netRow})+NPV(${waccCell},O$${netRow}:R$${netRow})`,
    result.npv,
    WHITE, font({ bold: true, size: 10, color: { argb: BLUE } }), align('right'), '$#,##0');
  ['A','B'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
  const npvAddr = `$B$${r}`;
  r++;

  // IRR
  ws.getRow(r).height = 18;
  c(ws, `A${r}`, 'IRR (5 yr.)', LGRAY, font({ size: 11, color: { argb: NAVY } }), align('left'));
  fv(ws, `B${r}`, `=IRR(B$${irrSeriesRow}:G$${irrSeriesRow})`, irrVal, LGRAY, font({ bold: true, size: 10, color: { argb: BLUE } }), align('right'), '0.0%');
  ['A','B'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
  const irrAddr = `$B$${r}`;
  r++;

  // CapEx total
  ws.getRow(r).height = 18;
  c(ws, `A${r}`, 'One-Time CapEx', WHITE, font({ size: 11, color: { argb: NAVY } }), align('left'));
  fv(ws, `B${r}`, `=${costCells.capex}*(1+${costCells.contingency})`, result.totalCapex, WHITE, font({ bold: true, size: 10, color: { argb: BLUE } }), align('right'), '$#,##0');
  ['A','B'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
  const capexTotalAddr = `$B$${r}`;
  r++;

  // ROI 5yr = (annualOpp - monthlyFee*12) * 5 / totalCapex  (net returns / upfront cost)
  ws.getRow(r).height = 18;
  c(ws, `A${r}`, 'ROI (5 yr.)', LGRAY, font({ size: 11, color: { argb: NAVY } }), align('left'));
  fv(ws, `B${r}`,
    `=((${costCells.annualOpp}-${costCells.monthlyFee}*12)*5)/${capexTotalAddr}`,
    result.fiveYrRoi - 1,
    LGRAY, font({ bold: true, size: 10, color: { argb: BLUE } }), align('right'), '0.0%');
  ['A','B'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
  const roiAddr = `$B$${r}`;
  r++;

  // Payback in weeks
  ws.getRow(r).height = 18;
  c(ws, `A${r}`, 'Payback Period', WHITE, font({ size: 11, color: { argb: NAVY } }), align('left'));
  fv(ws, `B${r}`,
    `=${capexTotalAddr}/MAX(1,${costCells.annualOpp}-${costCells.monthlyFee}*12)*52`,
    result.paybackWeeks ?? 0,
    WHITE, font({ bold: true, size: 10, color: { argb: BLUE } }), align('right'), '0.0 "wks"');
  ['A','B'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
  const paybackAddr = `$B$${r}`;
  r++;

  // Annual SaaS Fee
  ws.getRow(r).height = 18;
  c(ws, `A${r}`, 'Xemelgo Annual Software Fee', LGRAY, font({ size: 11, color: { argb: NAVY } }), align('left'));
  fv(ws, `B${r}`, `=${costCells.monthlyFee}*12`, result.annualSaasFee, LGRAY, font({ bold: true, size: 10, color: { argb: BLUE } }), align('right'), '$#,##0');
  ['A','B'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
  const annualFeeAddr = `$B$${r}`;
  r++;

  // Net Annual Value
  ws.getRow(r).height = 18;
  c(ws, `A${r}`, 'Net Annual Opportunity Value', WHITE, font({ size: 11, color: { argb: NAVY } }), align('left'));
  fv(ws, `B${r}`, `=${costCells.annualOpp}-${costCells.monthlyFee}*12`, result.netAnnualValue, WHITE, font({ bold: true, size: 10, color: { argb: BLUE } }), align('right'), '$#,##0');
  ['A','B'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
  const netAnnualAddr = `$B$${r}`;
  r++;

  // SaaS ROI
  ws.getRow(r).height = 18;
  c(ws, `A${r}`, 'SaaS ROI (annual)', LGRAY, font({ size: 11, color: { argb: NAVY } }), align('left'));
  fv(ws, `B${r}`, `=IF(${annualFeeAddr}>0,(${costCells.annualOpp}-${costCells.monthlyFee}*12)/(${costCells.monthlyFee}*12),0)`, result.saasRoi, LGRAY, font({ bold: true, size: 10, color: { argb: BLUE } }), align('right'), '0.0%');
  ['A','B'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
  const saasRoiAddr = `$B$${r}`;

  return { npvAddr, irrAddr, roiAddr, paybackAddr, capexTotalAddr, annualFeeAddr, netAnnualAddr, saasRoiAddr };
}

// ─────────────────────────────────────────────────────────────────────────────
// SHEET 1: ROI Summary
// ─────────────────────────────────────────────────────────────────────────────
function buildROISummary(ws, ops, useCases, fin, result, contactInfo, dateISO, saRefs, ws3Refs) {
  const company   = ops.companyName?.trim() || 'Your Facility';
  const first     = contactInfo?.firstName?.trim() || '';
  const last      = contactInfo?.lastName?.trim() || '';
  const fullName  = (first || last) ? `${first} ${last}`.trim() : 'Valued Customer';
  const enabledUcNames = Object.entries(useCases).filter(([, uc]) => uc.enabled).map(([k]) => UC_NAMES[k] || k).join(', ');

  ws.columns = [
    { width: 4  }, { width: 36 }, { width: 28 }, { width: 20 },
    { width: 20 }, { width: 20 }, { width: 20 },
  ];

  let r = 1;

  ws.mergeCells(`A${r}:G${r}`); ws.getRow(r).height = 36;
  c(ws, `A${r}`, `Xemelgo ROI Analysis — ${company}`, NAVY, font({ bold: true, size: 16, color: { argb: WHITE } }), align('left'));
  r++;
  accentBar(ws, 'G', r); r++;

  const infoRows = [
    ['Company Name', company],
    ['Prepared for', fullName],
    ['Scope',        enabledUcNames],
    ['Date',         dateISO],
  ];
  infoRows.forEach(([lbl, val]) => {
    ws.getRow(r).height = 18;
    c(ws, `B${r}`, lbl, LGRAY, font({ bold: true, size: 11, color: { argb: NAVY } }), align('left'));
    c(ws, `C${r}`, val, WHITE, font({ size: 11, color: { argb: NAVY } }), align('left'));
    ws.mergeCells(`C${r}:G${r}`);
    r++;
  });

  r++; ws.getRow(r - 1).height = 12;

  // Value Analysis Summary
  ws.getRow(r).height = 22; ws.mergeCells(`B${r}:G${r}`);
  c(ws, `B${r}`, 'Value Analysis Summary', NAVY, font({ bold: true, size: 11, color: { argb: WHITE } }), align('left'));
  r++;

  ws.getRow(r).height = 20;
  const vsHdrs = ['Savings Categories', 'Est. Weekly Hrs Saved', 'Est. Annual Hrs Saved', 'Est. Weekly Opportunity', 'Est. Annual Opportunity'];
  ['B','C','D','E','F'].forEach((col, i) => {
    c(ws, `${col}${r}`, vsHdrs[i], BGBLUE, font({ bold: true, size: 10, color: { argb: NAVY } }), align('center'));
    ws.getCell(`${col}${r}`).border = thinBorder;
  });
  r++;

  // Labor summary (JS-computed — summary table, not formula-driven)
  let laborWeeklyHrs = 0, laborAnnualHrs = 0, laborWeeklyVal = 0;
  LABOR_BUCKET_KEYS.forEach(key => {
    if (!useCases[key]?.enabled) return;
    const h = getLaborHours(key, useCases[key], ops);
    if (h) { laborWeeklyHrs += h.weeklyHrs; laborAnnualHrs += h.annualHrs; laborWeeklyVal += h.weeklyHrs * h.rate; }
  });
  const laborBucket    = result.buckets.find(b => b.name === 'Labor Efficiency');
  const laborAnnualVal = laborBucket?.subtotal ?? 0;
  const otherAnnualVal = result.buckets.filter(b => b.name !== 'Labor Efficiency').reduce((s, b) => s + b.subtotal, 0);

  [
    ['Estimated Labor Savings', Math.round(laborWeeklyHrs), Math.round(laborAnnualHrs), Math.round(laborWeeklyVal), laborAnnualVal, WHITE],
    ['Estimated Other Savings', 0, 0, 0, otherAnnualVal, LGRAY],
    ['Total', Math.round(laborWeeklyHrs), Math.round(laborAnnualHrs), Math.round(laborWeeklyVal), result.totalGrossAnnual, BGBLUE],
  ].forEach(([label, wkHrs, annHrs, wkVal, annVal, bg]) => {
    const isBold = label === 'Total';
    ws.getRow(r).height = 18;
    c(ws, `B${r}`, label, bg, font({ bold: isBold, size: 11, color: { argb: NAVY } }), align('left'));
    c(ws, `C${r}`, wkHrs,  bg, font({ bold: isBold, size: 11, color: { argb: NAVY } }), align('right'), '#,##0');
    c(ws, `D${r}`, annHrs, bg, font({ bold: isBold, size: 11, color: { argb: NAVY } }), align('right'), '#,##0');
    c(ws, `E${r}`, wkVal,  bg, font({ bold: isBold, size: 11, color: { argb: NAVY } }), align('right'), '$#,##0');
    c(ws, `F${r}`, annVal, bg, font({ bold: isBold, size: 11, color: { argb: NAVY } }), align('right'), '$#,##0');
    ['B','C','D','E','F'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
    r++;
  });

  r++; ws.getRow(r - 1).height = 12;

  // Financial Summary — cross-sheet references to Sheet 3
  ws.getRow(r).height = 22; ws.mergeCells(`B${r}:G${r}`);
  c(ws, `B${r}`, 'Financial Summary', NAVY, font({ bold: true, size: 11, color: { argb: WHITE } }), align('left'));
  r++;

  const finSummaryDefs = ws3Refs ? [
    ['One-Time CapEx (with contingency)', `='Financial Analysis'!${ws3Refs.capexTotalAddr}`, result.totalCapex,      '$#,##0'   ],
    ['ROI (5 yr.)',                        `='Financial Analysis'!${ws3Refs.roiAddr}`,        result.fiveYrRoi - 1,   '0.0%'     ],
    ['Payback Period',                     `='Financial Analysis'!${ws3Refs.paybackAddr}`,    result.paybackWeeks??0, '0.0 "wks"'],
    ['Xemelgo Annual Fee',                 `='Financial Analysis'!${ws3Refs.annualFeeAddr}`,  result.annualSaasFee,   '$#,##0'   ],
    ['Net Annual Opportunity Value',       `='Financial Analysis'!${ws3Refs.netAnnualAddr}`,  result.netAnnualValue,  '$#,##0'   ],
    ['NPV (5 yr.)',                        `='Financial Analysis'!${ws3Refs.npvAddr}`,         result.npv,             '$#,##0'   ],
    ['IRR (5 yr.)',                        `='Financial Analysis'!${ws3Refs.irrAddr}`,         Math.min(result.irrAnnual??0,3.0), '0.0%'],
    ['SaaS ROI (annual)',                  `='Financial Analysis'!${ws3Refs.saasRoiAddr}`,     result.saasRoi,         '0.0%'     ],
  ] : [
    ['One-Time CapEx (with contingency)', result.totalCapex,         '$#,##0'   ],
    ['ROI (5 yr.)',                        result.fiveYrRoi - 1,      '0.0%'     ],
    ['Payback Period',                     result.paybackWeeks ?? 0,  '0.0 "wks"'],
    ['Xemelgo Annual Fee',                 result.annualSaasFee,      '$#,##0'   ],
    ['Net Annual Opportunity Value',       result.netAnnualValue,     '$#,##0'   ],
    ['NPV (5 yr.)',                        result.npv,                '$#,##0'   ],
    ['IRR (5 yr.)',                        Math.min(result.irrAnnual??0,3.0), '0.0%'],
    ['SaaS ROI (annual)',                  result.saasRoi,            '0.0%'     ],
  ];

  finSummaryDefs.forEach(([label, valueOrFormula, cachedOrFmt, maybeFmt], i) => {
    ws.getRow(r).height = 18;
    const bg = i % 2 === 0 ? WHITE : LGRAY;
    const isFormula = ws3Refs && typeof valueOrFormula === 'string' && valueOrFormula.startsWith('=');
    const cached = isFormula ? cachedOrFmt : valueOrFormula;
    const fmt    = isFormula ? maybeFmt : cachedOrFmt;
    c(ws, `B${r}`, label, bg, font({ size: 11, color: { argb: NAVY } }), align('left'));
    if (isFormula) {
      fv(ws, `C${r}`, valueOrFormula, cached, bg, font({ bold: true, size: 10, color: { argb: NAVY } }), align('right'), fmt);
    } else {
      c(ws, `C${r}`, cached, bg, font({ bold: true, size: 10, color: { argb: NAVY } }), align('right'), fmt);
    }
    ['B','C'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
    r++;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
export async function generateExcel(ops, useCases, fin, result, contactInfo, customCategories) {
  const company = ops.companyName?.trim() || 'Your Facility';
  const dateISO = new Date().toISOString().slice(0, 10);

  const wb = new Workbook();
  wb.creator = 'Xemelgo ROI Calculator';
  wb.created = new Date();
  wb.properties.date1904 = false;

  const ws1 = wb.addWorksheet('ROI Summary');
  const ws2 = wb.addWorksheet('Savings Analysis');
  const ws3 = wb.addWorksheet('Financial Analysis');

  // No gridlines + freeze panes on all sheets
  ws1.views = [{ showGridLines: false, state: 'frozen', xSplit: 0, ySplit: 3 }];
  ws2.views = [{ showGridLines: false, state: 'frozen', xSplit: 0, ySplit: 3 }];
  ws3.views = [{ showGridLines: false, state: 'frozen', xSplit: 1, ySplit: 4 }];

  // Build Sheet 2 first to get cell refs for Sheet 3
  const saRefs  = buildSavingsAnalysis(ws2, ops, useCases, fin, result, dateISO);
  // Build Sheet 3 using Sheet 2 refs
  const ws3Refs = buildFinancialAnalysis(ws3, ops, useCases, fin, result, saRefs, dateISO);
  // Build Sheet 1 using Sheet 2 and Sheet 3 refs
  buildROISummary(ws1, ops, useCases, fin, result, contactInfo, dateISO, saRefs, ws3Refs);

  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a');
  a.href       = url;
  a.download   = `Xemelgo_Financial_Model_${company.replace(/\s+/g, '_')}_${dateISO}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
