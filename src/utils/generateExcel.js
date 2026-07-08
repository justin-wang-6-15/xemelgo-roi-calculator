import { Workbook } from 'exceljs';

// ─── Style constants ──────────────────────────────────────────────────────────
const NAVY   = 'FF0B1028';
const BLUE   = 'FF004FDB';
const BGBLUE = 'FFEDF5FF';
const YELLOW = 'FFFFFF00';
const LGRAY  = 'FFF2F2F2';
const DGRAY  = 'FFD9D9D9';
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

function hdr(ws, addr, text, endAddr) {
  if (endAddr) ws.mergeCells(`${addr}:${endAddr}`);
  c(ws, addr, text, NAVY, font({ bold: true, color: { argb: WHITE }, size: 13 }), align('left'));
}

function sHdr(ws, addr, text, endAddr) {
  if (endAddr) ws.mergeCells(`${addr}:${endAddr}`);
  c(ws, addr, text, BLUE, font({ bold: true, color: { argb: WHITE }, size: 9 }), align('left'));
}

function colNumToLetter(n) {
  let s = '';
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

function accentBar(ws, endCol, row) {
  ws.getRow(row).height = 4;
  ws.mergeCells(`A${row}:${endCol}${row}`);
  c(ws, `A${row}`, '', BLUE);
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
  qualityExceptionTracking:   'Quality Exception Path Tracking',
  expeditedExceptionTracking: 'Expedited Exception Path Tracking',
  workingCapitalImprovement:  'Working Capital Improvement',
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
    case 'locateItems': {
      const rows = uc.roleRows || [];
      const annualHrs = rows.reduce((s, row) => s + row.hoursLostPerDay * row.headcount * dpy * uc.reductionPct, 0);
      const weeklyHrs = rows.reduce((s, row) => s + row.hoursLostPerDay * row.headcount * dpw * uc.reductionPct, 0);
      const peopleAffected = rows.reduce((s, row) => s + (Number(row.headcount) || 0), 0);
      const avgRate = rows.length ? rows.reduce((s, row) => s + (Number(row.burdenedRate) || 0), 0) / rows.length : 0;
      return { timeSavedPerDay: annualHrs / dpy, peopleAffected, weeklyHrs, annualHrs, rate: avgRate };
    }
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
    case 'shipReceiveVerification': {
      const tpd = (uc.minutesSavedPerTransaction / 60) * uc.transactionsPerDay * uc.dockStaff * uc.reductionPct;
      return { timeSavedPerDay: tpd, peopleAffected: uc.dockStaff, weeklyHrs: tpd * dpw, annualHrs: tpd * dpy, rate: uc.burdenedRate };
    }
    case 'internalDelivery': {
      const tpd = (uc.minutesPerTransfer / 60) * uc.transfersPerDay * uc.peoplePerTransfer * uc.reductionPct;
      return { timeSavedPerDay: tpd, peopleAffected: uc.peoplePerTransfer, weeklyHrs: tpd * dpw, annualHrs: tpd * dpy, rate: uc.burdenedRate };
    }
    case 'goodsReceipt':
    case 'automatedPackCount': {
      const tpd = (uc.minutesSavedPerTransaction / 60) * uc.transactionsPerDay * uc.dockStaff * uc.reductionPct;
      return { timeSavedPerDay: tpd, peopleAffected: uc.dockStaff, weeklyHrs: tpd * dpw, annualHrs: tpd * dpy, rate: uc.burdenedRate };
    }
    case 'outboundAudit': {
      const tpd = (uc.minutesSaved / 60) * uc.transactionsPerDay * uc.dockStaff * uc.reductionPct;
      return { timeSavedPerDay: tpd, peopleAffected: uc.dockStaff, weeklyHrs: tpd * dpw, annualHrs: tpd * dpy, rate: uc.burdenedRate };
    }
    case 'returnsTransfers': {
      const tpd = (uc.minutesPerTransfer / 60) * uc.transfersPerDay * uc.peoplePerTransfer * uc.reductionPct;
      return { timeSavedPerDay: tpd, peopleAffected: uc.peoplePerTransfer, weeklyHrs: tpd * dpw, annualHrs: tpd * dpy, rate: uc.burdenedRate };
    }
    case 'inventoryRequests': {
      const weeklyHrs = uc.hoursPerWeek * uc.peopleInvolved * uc.reductionPct;
      return { timeSavedPerDay: weeklyHrs / dpw, peopleAffected: uc.peopleInvolved, weeklyHrs, annualHrs: weeklyHrs * ops.workWeeksPerYear, rate: uc.burdenedRate };
    }
    default: return null;
  }
}

function drawColorKey(ws, startRow, startCol) {
  const keyData = [
    [BGBLUE, 'assumptions'],
    [YELLOW, 'customer inputs'],
    [WHITE,  'calculated'],
  ];
  keyData.forEach(([color, label], i) => {
    const r = startRow + i;
    const colA = colNumToLetter(startCol);
    const colB = colNumToLetter(startCol + 1);
    c(ws, `${colA}${r}`, '', color, null, null);
    ws.getCell(`${colA}${r}`).border = thinBorder;
    c(ws, `${colB}${r}`, label, null, font({ size: 8, color: { argb: 'FF374151' } }), align('left'));
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SHEET 1: ROI Summary
// ─────────────────────────────────────────────────────────────────────────────
function buildROISummary(ws, ops, useCases, fin, result, contactInfo, dateISO) {
  const company   = ops.companyName?.trim() || 'Your Facility';
  const first     = contactInfo?.firstName?.trim() || '';
  const last      = contactInfo?.lastName?.trim() || '';
  const fullName  = (first || last) ? `${first} ${last}`.trim() : 'Valued Customer';
  const enabledUcNames = Object.entries(useCases).filter(([, uc]) => uc.enabled).map(([k]) => UC_NAMES[k] || k).join(', ');

  ws.columns = [
    { width: 4  },  // A: spacer
    { width: 36 },  // B: label
    { width: 28 },  // C: value
    { width: 20 },  // D
    { width: 20 },  // E
    { width: 20 },  // F
    { width: 20 },  // G
  ];

  let r = 1;

  // Row 1: Title
  ws.mergeCells(`A${r}:G${r}`); ws.getRow(r).height = 36;
  c(ws, `A${r}`, `Xemelgo ROI Analysis — ${company}`, NAVY, font({ bold: true, size: 16, color: { argb: WHITE } }), align('left'));
  r++;

  // Row 2: 4pt accent bar
  accentBar(ws, 'G', r); r++;

  // Info block
  ws.getRow(r).height = 18;
  const infoRows = [
    ['Company Name', company],
    ['Prepared for', fullName],
    ['Scope',        enabledUcNames],
    ['Date',         dateISO],
  ];
  infoRows.forEach(([lbl, val]) => {
    ws.getRow(r).height = 18;
    c(ws, `B${r}`, lbl, LGRAY, font({ bold: true, size: 9, color: { argb: NAVY } }), align('left'));
    c(ws, `C${r}`, val, WHITE, font({ size: 9, color: { argb: NAVY } }), align('left'));
    ws.mergeCells(`C${r}:G${r}`);
    r++;
  });

  r++; // spacer, height 12
  ws.getRow(r - 1).height = 12;

  // ── Value Analysis Summary ────────────────────────────────────────────────
  ws.getRow(r).height = 22;
  ws.mergeCells(`B${r}:G${r}`);
  c(ws, `B${r}`, 'Value Analysis Summary', NAVY, font({ bold: true, size: 11, color: { argb: WHITE } }), align('left'));
  r++;

  ws.getRow(r).height = 20;
  const vsHdrs = ['Savings Categories', 'Est. Weekly Hrs Saved', 'Est. Annual Hrs Saved', 'Est. Weekly Opportunity', 'Est. Annual Opportunity'];
  ['B','C','D','E','F'].forEach((col, i) => {
    c(ws, `${col}${r}`, vsHdrs[i], BGBLUE, font({ bold: true, size: 8, color: { argb: NAVY } }), align('center'));
    ws.getCell(`${col}${r}`).border = thinBorder;
  });
  r++;

  // Labor savings
  let laborWeeklyHrs = 0, laborAnnualHrs = 0, laborWeeklyVal = 0;
  LABOR_BUCKET_KEYS.forEach(key => {
    if (!useCases[key]?.enabled) return;
    const h = getLaborHours(key, useCases[key], ops);
    if (h) { laborWeeklyHrs += h.weeklyHrs; laborAnnualHrs += h.annualHrs; laborWeeklyVal += h.weeklyHrs * h.rate; }
  });
  const laborBucket         = result.buckets.find(b => b.name === 'Labor Efficiency');
  const laborAnnualValResult = laborBucket?.subtotal ?? 0;
  const otherAnnualVal       = result.buckets.filter(b => b.name !== 'Labor Efficiency').reduce((s, b) => s + b.subtotal, 0);

  ws.getRow(r).height = 18; ws.getRow(r + 1).height = 18; ws.getRow(r + 2).height = 18;
  const vsRows = [
    ['Estimated Labor Savings', Math.round(laborWeeklyHrs), Math.round(laborAnnualHrs), Math.round(laborWeeklyVal), laborAnnualValResult, WHITE],
    ['Estimated Other Savings', 0,                          0,                           0,                          otherAnnualVal,        LGRAY],
    ['Total',                   Math.round(laborWeeklyHrs), Math.round(laborAnnualHrs), Math.round(laborWeeklyVal), result.totalGrossAnnual, BGBLUE],
  ];
  vsRows.forEach(([label, wkHrs, annHrs, wkVal, annVal, bg]) => {
    const isBold = label === 'Total';
    c(ws, `B${r}`, label, bg, font({ bold: isBold, size: 9, color: { argb: NAVY } }), align('left'));
    c(ws, `C${r}`, wkHrs,  bg, font({ bold: isBold, size: 9, color: { argb: NAVY } }), align('right'), '#,##0');
    c(ws, `D${r}`, annHrs, bg, font({ bold: isBold, size: 9, color: { argb: NAVY } }), align('right'), '#,##0');
    c(ws, `E${r}`, wkVal,  bg, font({ bold: isBold, size: 9, color: { argb: NAVY } }), align('right'), '$#,##0');
    c(ws, `F${r}`, annVal, bg, font({ bold: isBold, size: 9, color: { argb: NAVY } }), align('right'), '$#,##0');
    ['B','C','D','E','F'].forEach(col => { ws.getCell(`${col}${r}`).border = thinBorder; });
    r++;
  });

  r++; ws.getRow(r - 1).height = 12; // spacer

  // ── Financial Summary ─────────────────────────────────────────────────────
  ws.getRow(r).height = 22;
  ws.mergeCells(`B${r}:G${r}`);
  c(ws, `B${r}`, 'Financial Summary', NAVY, font({ bold: true, size: 11, color: { argb: WHITE } }), align('left'));
  r++;

  const irrVal = Math.min(result.irrAnnual ?? 0, 3.0);
  const finRows = [
    ['One-Time CapEx (with contingency)', result.totalCapex,         '$#,##0'],
    ['ROI (5 yr.)',                        result.fiveYrRoi - 1,      '0.0%'  ],
    ['Payback Period',                     result.paybackWeeks ?? 0,  '0.0 "wks"'],
    ['Xemelgo Annual Fee',                 result.annualSaasFee,      '$#,##0'],
    ['Net Annual Opportunity Value',       result.netAnnualValue,     '$#,##0'],
    ['NPV (5 yr.)',                        result.npv,                '$#,##0'],
    ['IRR (5 yr.)',                        irrVal,                    '0.0%'  ],
    ['SaaS ROI (annual)',                  result.saasRoi,            '0.0%'  ],
  ];
  finRows.forEach(([label, value, numFmt], i) => {
    ws.getRow(r).height = 18;
    const bg = i % 2 === 0 ? WHITE : LGRAY;
    c(ws, `B${r}`, label, bg, font({ size: 9, color: { argb: NAVY } }), align('left'));
    c(ws, `C${r}`, value, bg, font({ bold: true, size: 10, color: { argb: NAVY } }), align('right'), numFmt);
    ['B','C'].forEach(col => { ws.getCell(`${col}${r}`).border = thinBorder; });
    r++;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SHEET 2: Savings Analysis
// ─────────────────────────────────────────────────────────────────────────────
function buildSavingsAnalysis(ws, ops, useCases, result, dateISO) {
  const company        = ops.companyName?.trim() || 'Your Facility';
  const enabledUcNames = Object.entries(useCases).filter(([, uc]) => uc.enabled).map(([k]) => UC_NAMES[k] || k).join(', ');
  const unitsLbl       = UNITS_LABEL[ops.industry] ?? UNITS_LABEL[''];
  const shiftsLbl      = ops.industry === 'retail' ? 'Operating hours / day' : 'Shifts per day';

  ws.columns = [
    { width: 2  },  // A: spacer
    { width: 44 },  // B: label
    { width: 18 },  // C
    { width: 16 },  // D
    { width: 16 },  // E
    { width: 16 },  // F
    { width: 16 },  // G
    { width: 16 },  // H
    { width: 16 },  // I: color key col 1
    { width: 14 },  // J: color key col 2
  ];

  let r = 1;

  // Row 1: Title
  ws.mergeCells(`B${r}:H${r}`); ws.getRow(r).height = 22;
  c(ws, `B${r}`, `Savings Analysis — ${company}  [${enabledUcNames}]`, NAVY, font({ bold: true, size: 12, color: { argb: WHITE } }), align('left'));
  drawColorKey(ws, 1, 9); // I1:J3

  r++; // Row 2: 4pt accent bar
  accentBar(ws, 'H', r); r++;

  // ── Facility inputs ───────────────────────────────────────────────────────
  ws.getRow(r).height = 20; ws.mergeCells(`B${r}:H${r}`);
  sHdr(ws, `B${r}`, 'Tell us about your shop');
  r++;

  const shopRows = [
    [unitsLbl,              ops.unitsPerMonth,    '#,##0'],
    ['Work weeks / year',   ops.workWeeksPerYear, '0'],
    ['Working days / week', ops.workDaysPerWeek,  '0'],
    [shiftsLbl,             ops.shiftsPerDay,     '0'],
  ];
  shopRows.forEach(([lbl, val, fmt]) => {
    ws.getRow(r).height = 18;
    c(ws, `B${r}`, lbl, LGRAY, font({ size: 9, color: { argb: NAVY } }), align('left'));
    c(ws, `C${r}`, val, YELLOW, font({ bold: true, size: 9, color: { argb: NAVY } }), align('right'), fmt);
    ['B','C'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
    r++;
  });

  r++; ws.getRow(r - 1).height = 8; // spacer

  // ── Team makeup ───────────────────────────────────────────────────────────
  ws.getRow(r).height = 20; ws.mergeCells(`B${r}:H${r}`);
  sHdr(ws, `B${r}`, 'What is the makeup of the team?');
  r++;

  ws.getRow(r).height = 18;
  ['Role','Team Size (FTEs)','Fully Burdened Rate','~30% burden included'].forEach((h, i) => {
    const col = colNumToLetter(2 + i);
    c(ws, `${col}${r}`, h, BGBLUE, font({ bold: true, size: 8, color: { argb: NAVY } }), align('center'));
    ws.getCell(`${col}${r}`).border = thinBorder;
  });
  r++;

  const teamRows = [
    ['Material Handlers',              ops.materialHandlerCount, ops.materialHandlerRate],
    ['Planners',                        ops.plannerCount,         ops.plannerRate        ],
    ['Indirect Support / Leadership',   ops.indirectCount,        ops.indirectRate       ],
    ['Direct Employees',                ops.directCount,          ops.directRate         ],
  ];
  let totalHC = 0;
  teamRows.forEach(([lbl, hc, rate], i) => {
    totalHC += hc || 0;
    ws.getRow(r).height = 18;
    const bg = i % 2 === 0 ? WHITE : LGRAY;
    c(ws, `B${r}`, lbl,  bg,     font({ size: 9, color: { argb: NAVY } }), align('left'));
    c(ws, `C${r}`, hc,   YELLOW, font({ bold: true, size: 9, color: { argb: NAVY } }), align('right'), '0');
    c(ws, `D${r}`, rate, YELLOW, font({ bold: true, size: 9, color: { argb: NAVY } }), align('right'), '$#,##0');
    ['B','C','D'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
    r++;
  });
  ws.getRow(r).height = 18;
  c(ws, `B${r}`, 'Total', BGBLUE, font({ bold: true, size: 9, color: { argb: NAVY } }), align('left'));
  c(ws, `C${r}`, totalHC, BGBLUE, font({ bold: true, size: 9, color: { argb: NAVY } }), align('right'), '0');
  ['B','C'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
  r++;

  r++; ws.getRow(r - 1).height = 8; // spacer

  // ── Labor Savings ─────────────────────────────────────────────────────────
  ws.getRow(r).height = 20; ws.mergeCells(`B${r}:I${r}`);
  sHdr(ws, `B${r}`, 'Estimated Labor Savings');
  r++;

  ws.getRow(r).height = 18;
  ['Use Case / Justification','Time Saved / Day (hrs)','People Affected / Day','Est. Weekly Hrs Saved','Est. Annual Hrs Saved','Weekly Opportunity Value','Annual Opportunity Value'].forEach((h, i) => {
    const col = colNumToLetter(2 + i);
    c(ws, `${col}${r}`, h, BGBLUE, font({ bold: true, size: 8, color: { argb: NAVY } }), align('center'));
    ws.getCell(`${col}${r}`).border = thinBorder;
  });
  r++;

  let laborTotalWeekHrs = 0, laborTotalAnnHrs = 0, laborTotalWeekVal = 0, laborTotalAnnVal = 0;
  LABOR_BUCKET_KEYS.forEach(key => {
    if (!useCases[key]?.enabled) return;
    const uc  = useCases[key];
    const h   = getLaborHours(key, uc, ops);
    if (!h) return;
    const wkVal   = h.weeklyHrs * h.rate;
    const liResult = result.buckets.find(b => b.name === 'Labor Efficiency')?.lineItems.find(l => l.key === key);
    const annValFinal = (key === 'picklistVerification' || key === 'locateItems' || key === 'workOrderTracking' || key === 'goodsReceipt' || key === 'automatedPackCount' || key === 'outboundAudit' || key === 'returnsTransfers') ? (liResult?.annualValue ?? 0) : h.annualHrs * h.rate;

    ws.getRow(r).height = 18;
    const bg = key === 'picklistVerification' ? LGRAY : WHITE;
    c(ws, `B${r}`, UC_NAMES[key], bg,    font({ size: 9, color: { argb: NAVY } }), align('left'));
    c(ws, `C${r}`, h.timeSavedPerDay, YELLOW, font({ size: 9, color: { argb: NAVY } }), align('right'), '0.00');
    c(ws, `D${r}`, h.peopleAffected,  YELLOW, font({ size: 9, color: { argb: NAVY } }), align('right'), '0');
    c(ws, `E${r}`, h.weeklyHrs, DGRAY, font({ size: 9, color: { argb: NAVY } }), align('right'), '0.0');
    c(ws, `F${r}`, h.annualHrs, DGRAY, font({ size: 9, color: { argb: NAVY } }), align('right'), '0.0');
    c(ws, `G${r}`, wkVal > 0 ? wkVal : 0, DGRAY, font({ size: 9, color: { argb: NAVY } }), align('right'), '$#,##0');
    c(ws, `H${r}`, annValFinal, DGRAY, font({ size: 9, color: { argb: NAVY } }), align('right'), '$#,##0');
    ['B','C','D','E','F','G','H'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);

    laborTotalWeekHrs += h.weeklyHrs;
    laborTotalAnnHrs  += h.annualHrs;
    laborTotalWeekVal += wkVal > 0 ? wkVal : 0;
    laborTotalAnnVal  += annValFinal;
    r++;
  });

  ws.getRow(r).height = 20;
  c(ws, `B${r}`, 'Labor Savings Total', BGBLUE, font({ bold: true, size: 9, color: { argb: NAVY } }), align('left'));
  c(ws, `E${r}`, laborTotalWeekHrs, BGBLUE, font({ bold: true, size: 9, color: { argb: NAVY } }), align('right'), '0.0');
  c(ws, `F${r}`, laborTotalAnnHrs,  BGBLUE, font({ bold: true, size: 9, color: { argb: NAVY } }), align('right'), '0.0');
  c(ws, `G${r}`, laborTotalWeekVal, BGBLUE, font({ bold: true, size: 9, color: { argb: NAVY } }), align('right'), '$#,##0');
  c(ws, `H${r}`, laborTotalAnnVal,  BGBLUE, font({ bold: true, size: 9, color: { argb: NAVY } }), align('right'), '$#,##0');
  ['B','E','F','G','H'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
  r++;

  r++; ws.getRow(r - 1).height = 8; // spacer

  // ── Other Savings ─────────────────────────────────────────────────────────
  ws.getRow(r).height = 20; ws.mergeCells(`B${r}:H${r}`);
  sHdr(ws, `B${r}`, 'Estimated Other Savings (Loss Prevention & Revenue)');
  r++;

  ws.getRow(r).height = 18;
  ['Activity with Savings Opportunity','Quarterly Opportunity Value','Monthly Opportunity Value','Annual Opportunity Value'].forEach((h, i) => {
    const col = colNumToLetter(2 + i);
    c(ws, `${col}${r}`, h, BGBLUE, font({ bold: true, size: 8, color: { argb: NAVY } }), align('center'));
    ws.getCell(`${col}${r}`).border = thinBorder;
  });
  r++;

  let otherTotalAnn = 0;
  result.buckets.filter(b => b.name !== 'Labor Efficiency').forEach(bucket => {
    bucket.lineItems.forEach(li => {
      ws.getRow(r).height = 18;
      c(ws, `B${r}`, li.name,           WHITE, font({ size: 9, color: { argb: NAVY } }), align('left'));
      c(ws, `C${r}`, li.annualValue / 4,  DGRAY, font({ size: 9, color: { argb: NAVY } }), align('right'), '$#,##0');
      c(ws, `D${r}`, li.annualValue / 12, DGRAY, font({ size: 9, color: { argb: NAVY } }), align('right'), '$#,##0');
      c(ws, `E${r}`, li.annualValue,      DGRAY, font({ size: 9, color: { argb: NAVY } }), align('right'), '$#,##0');
      ['B','C','D','E'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
      otherTotalAnn += li.annualValue;
      r++;
    });
  });

  ws.getRow(r).height = 20;
  c(ws, `B${r}`, 'Other Savings Total', BGBLUE, font({ bold: true, size: 9, color: { argb: NAVY } }), align('left'));
  c(ws, `C${r}`, otherTotalAnn / 4,  BGBLUE, font({ bold: true, size: 9, color: { argb: NAVY } }), align('right'), '$#,##0');
  c(ws, `D${r}`, otherTotalAnn / 12, BGBLUE, font({ bold: true, size: 9, color: { argb: NAVY } }), align('right'), '$#,##0');
  c(ws, `E${r}`, otherTotalAnn,      BGBLUE, font({ bold: true, size: 9, color: { argb: NAVY } }), align('right'), '$#,##0');
  ['B','C','D','E'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
  r++;

  r++; ws.getRow(r - 1).height = 8; // spacer

  // ── Summary ───────────────────────────────────────────────────────────────
  ws.getRow(r).height = 22; ws.mergeCells(`B${r}:H${r}`);
  sHdr(ws, `B${r}`, 'Estimated Annual Opportunity Summary');
  r++;

  const summaryRows = [
    ['Estimated Annual Labor Savings',  laborTotalAnnVal,        '$#,##0'],
    ['Estimated Annual Other Savings',  otherTotalAnn,           '$#,##0'],
    ['Total Gross Annual Opportunity',  result.totalGrossAnnual, '$#,##0'],
    ['Annual Platform Cost',           -result.annualSaasFee,   '$#,##0;[Red]($#,##0)'],
    ['Net Annual Value',                result.netAnnualValue,   '$#,##0'],
  ];
  summaryRows.forEach(([lbl, val, fmt], i) => {
    ws.getRow(r).height = 18;
    const isTotal = lbl.startsWith('Total') || lbl.startsWith('Net');
    const bg = isTotal ? BGBLUE : (i % 2 === 0 ? WHITE : LGRAY);
    c(ws, `B${r}`, lbl, bg, font({ bold: isTotal, size: 9, color: { argb: isTotal ? BLUE : NAVY } }), align('left'));
    c(ws, `C${r}`, val, bg, font({ bold: isTotal, size: 9, color: { argb: isTotal ? BLUE : NAVY } }), align('right'), fmt);
    ['B','C'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
    r++;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SHEET 3: Financial Analysis
// ─────────────────────────────────────────────────────────────────────────────
function buildFinancialAnalysis(ws, ops, useCases, fin, result, dateISO) {
  const company        = ops.companyName?.trim() || 'Your Facility';
  const enabledUcNames = Object.entries(useCases).filter(([, uc]) => uc.enabled).map(([k]) => UC_NAMES[k] || k).join(', ');

  ws.columns = [
    { width: 45 },             // A labels
    ...Array(13).fill({ width: 11 }),  // B-N Month 0-12
    ...Array(4).fill({ width: 14 }),   // O-R Year 2-5
  ];

  const RAMP       = [0, 0.25, 0.50, 0.75, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0];
  const monthCols  = ['B','C','D','E','F','G','H','I','J','K','L','M','N'];
  const yearCols   = ['O','P','Q','R'];
  const allDataCols = [...monthCols, ...yearCols];

  // Alternating column shading: odd month indices (1,3,5,7,9,11) get BGBLUE
  function colFill(dataColIdx, baseFill) {
    if (dataColIdx < 13 && dataColIdx % 2 === 1) return BGBLUE;
    return baseFill;
  }

  let r = 1;

  // Row 1: Title
  ws.mergeCells(`A${r}:R${r}`); ws.getRow(r).height = 26;
  c(ws, `A${r}`, `5-Year Financial Analysis — ${company}  [${enabledUcNames}]`, NAVY, font({ bold: true, size: 13, color: { argb: WHITE } }), align('left'));
  r++;

  // Row 2: 4pt accent bar
  accentBar(ws, 'R', r); r++;

  // Note + color key
  ws.getRow(r).height = 16;
  c(ws, `A${r}`, `${company} inputs are in yellow cells.`, null, font({ size: 9, italic: true, color: { argb: 'FF374151' } }), align('left'));
  drawColorKey(ws, r, 17); // cols Q-R
  r++;

  // ── Column headers ────────────────────────────────────────────────────────
  ws.getRow(r).height = 22;
  c(ws, `A${r}`, '', NAVY, font({ bold: true, size: 9, color: { argb: WHITE } }), align('left'));
  monthCols.forEach((col, i) => {
    c(ws, `${col}${r}`, i === 0 ? 'Year 1\nMonth 0' : `Month ${i}`, NAVY, font({ bold: true, size: 8, color: { argb: WHITE } }), align('center'));
    ws.getCell(`${col}${r}`).alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });
  yearCols.forEach((col, i) => {
    c(ws, `${col}${r}`, `Year ${i + 2}`, NAVY, font({ bold: true, size: 9, color: { argb: WHITE } }), align('center'));
  });
  r++;

  // ── Cost Inputs ───────────────────────────────────────────────────────────
  ws.getRow(r).height = 20; ws.mergeCells(`A${r}:R${r}`);
  sHdr(ws, `A${r}`, 'Cost Inputs (yellow cells are editable)');
  r++;

  const capexLabel = enabledUcNames ? `${enabledUcNames.split(',')[0].trim()} CapEx` : 'Hardware & Installation CapEx';
  const costInputs = [
    [capexLabel,                                                   Number(fin.capex) || 0,             '$#,##0'],
    ['CapEx Contingency',                                          fin.contingencyRate,     '0.0%' ],
    ['Xemelgo Monthly Fee',                                        Number(fin.monthlyPlatformFee) || 0, '$#,##0'],
    ['Estimated Annual Opportunity (from Savings Analysis)',        result.totalGrossAnnual, '$#,##0'],
  ];
  costInputs.forEach(([lbl, val, fmt], i) => {
    ws.getRow(r).height = 18;
    const isCalc   = i === 3;
    const cellFill = isCalc ? LGRAY : YELLOW;
    c(ws, `A${r}`, lbl, isCalc ? LGRAY : WHITE, font({ size: 9, color: { argb: NAVY } }), align('left'));
    c(ws, `B${r}`, val, cellFill, font({ bold: true, size: 9, color: { argb: NAVY } }), align('right'), fmt);
    ws.getCell(`A${r}`).border = thinBorder;
    ws.getCell(`B${r}`).border = thinBorder;
    r++;
  });

  r++; ws.getRow(r - 1).height = 8; // spacer

  // ── 5-Year Financial Table ────────────────────────────────────────────────
  ws.getRow(r).height = 22; ws.mergeCells(`A${r}:R${r}`);
  sHdr(ws, `A${r}`, '5-Year Financial Model');
  r++;

  const monthlyOpp = result.totalGrossAnnual / 12;

  // Estimated Total Opportunity Value
  ws.getRow(r).height = 18;
  c(ws, `A${r}`, 'Estimated Total Opportunity Value', BGBLUE, font({ size: 9, color: { argb: NAVY } }), align('left'));
  monthCols.forEach((col, i) => {
    c(ws, `${col}${r}`, i === 0 ? 0 : monthlyOpp, colFill(i, BGBLUE), font({ size: 9, color: { argb: NAVY } }), align('right'), '$#,##0');
  });
  yearCols.forEach(col => {
    c(ws, `${col}${r}`, result.totalGrossAnnual, BGBLUE, font({ size: 9, color: { argb: NAVY } }), align('right'), '$#,##0');
  });
  r++;

  // Weight (ramp curve)
  ws.getRow(r).height = 18;
  c(ws, `A${r}`, 'Weight (With Learning Curve)', BGBLUE, font({ size: 9, color: { argb: NAVY } }), align('left'));
  monthCols.forEach((col, i) => {
    c(ws, `${col}${r}`, RAMP[i], colFill(i, BGBLUE), font({ size: 9, color: { argb: NAVY } }), align('right'), '0.0%');
  });
  yearCols.forEach(col => {
    c(ws, `${col}${r}`, 1.0, BGBLUE, font({ size: 9, color: { argb: NAVY } }), align('right'), '0.0%');
  });
  r++;

  // Weighted Opportunity Value
  ws.getRow(r).height = 18;
  c(ws, `A${r}`, 'Weighted Opportunity Value', LGRAY, font({ size: 9, color: { argb: NAVY } }), align('left'));
  allDataCols.forEach((col, ci) => {
    const val = ci < 13 ? monthlyOpp * RAMP[ci] : result.totalGrossAnnual;
    c(ws, `${col}${r}`, val, colFill(ci, LGRAY), font({ size: 9, color: { argb: NAVY } }), align('right'), '$#,##0');
  });
  r++;

  r++; ws.getRow(r - 1).height = 6; // spacer row inside table

  // Hardware & Contingency
  ws.getRow(r).height = 18;
  c(ws, `A${r}`, 'Hardware & Contingency', LGRAY, font({ size: 9, color: { argb: NAVY } }), align('left'));
  c(ws, `B${r}`, -result.totalCapex, colFill(0, LGRAY), font({ size: 9, color: { argb: RED } }), align('right'), '$#,##0;[Red]($#,##0)');
  monthCols.slice(1).forEach((col, i) => c(ws, `${col}${r}`, 0, colFill(i + 1, LGRAY), font({ size: 9, color: { argb: NAVY } }), align('right'), '$#,##0'));
  yearCols.forEach(col => c(ws, `${col}${r}`, 0, LGRAY, font({ size: 9, color: { argb: NAVY } }), align('right'), '$#,##0'));
  r++;

  // Xemelgo Fee
  ws.getRow(r).height = 18;
  c(ws, `A${r}`, 'Xemelgo Fee', LGRAY, font({ size: 9, color: { argb: NAVY } }), align('left'));
  c(ws, `B${r}`, 0, colFill(0, LGRAY), font({ size: 9, color: { argb: NAVY } }), align('right'), '$#,##0');
  monthCols.slice(1).forEach((col, i) => c(ws, `${col}${r}`, -fin.monthlyPlatformFee, colFill(i + 1, LGRAY), font({ size: 9, color: { argb: RED } }), align('right'), '$#,##0;[Red]($#,##0)'));
  yearCols.forEach(col => c(ws, `${col}${r}`, -result.annualSaasFee, LGRAY, font({ size: 9, color: { argb: RED } }), align('right'), '$#,##0;[Red]($#,##0)'));
  r++;

  // Total Cost
  ws.getRow(r).height = 18;
  c(ws, `A${r}`, 'Total Cost', DGRAY, font({ size: 9, color: { argb: NAVY } }), align('left'));
  allDataCols.forEach((col, ci) => {
    let val;
    if (ci === 0) val = -result.totalCapex;
    else if (ci < 13) val = -fin.monthlyPlatformFee;
    else val = -result.annualSaasFee;
    c(ws, `${col}${r}`, val, colFill(ci, DGRAY), font({ size: 9, color: { argb: RED } }), align('right'), '$#,##0;[Red]($#,##0)');
  });
  r++;

  // Net Savings
  ws.getRow(r).height = 20;
  c(ws, `A${r}`, 'Net Savings', BGBLUE, font({ bold: true, size: 9, color: { argb: NAVY } }), align('left'));
  allDataCols.forEach((col, ci) => {
    const v = result.cashFlows[ci] ?? 0;
    c(ws, `${col}${r}`, v, colFill(ci, BGBLUE), font({ bold: true, size: 9, color: { argb: v >= 0 ? NAVY : RED } }), align('right'), v >= 0 ? '$#,##0' : '$#,##0;[Red]($#,##0)');
  });
  r++;

  r++; ws.getRow(r - 1).height = 6; // spacer

  // Cumulative Cash Flows
  ws.getRow(r).height = 18;
  c(ws, `A${r}`, 'Cumulative Cash Flows', LGRAY, font({ bold: true, size: 9, color: { argb: NAVY } }), align('left'));
  let cumulative = 0;
  allDataCols.forEach((col, ci) => {
    cumulative += result.cashFlows[ci] ?? 0;
    const textColor = cumulative >= 0 ? GREEN : RED;
    c(ws, `${col}${r}`, cumulative, colFill(ci, LGRAY), font({ size: 9, color: { argb: textColor } }), align('right'), cumulative >= 0 ? '$#,##0' : '$#,##0;[Red]($#,##0)');
  });
  r++;

  r++; ws.getRow(r - 1).height = 8; // spacer

  // ── IRR section ───────────────────────────────────────────────────────────
  ws.getRow(r).height = 20; ws.mergeCells(`A${r}:R${r}`);
  sHdr(ws, `A${r}`, 'FORMULAS FOR SUMMARY CALCULATIONS');
  r++;

  ws.getRow(r).height = 20;
  c(ws, `A${r}`, 'Annual Summary', NAVY, font({ bold: true, size: 9, color: { argb: WHITE } }), align('left'));
  ['B','C','D','E','F','G'].forEach((col, i) => {
    c(ws, `${col}${r}`, `Year ${i}`, NAVY, font({ bold: true, size: 9, color: { argb: WHITE } }), align('center'));
  });
  r++;

  ws.getRow(r).height = 18;
  c(ws, `A${r}`, 'Annual Net Cash Flow (for IRR)', LGRAY, font({ size: 9, color: { argb: NAVY } }), align('left'));
  const year1Net = result.cashFlows.slice(1, 13).reduce((s, v) => s + v, 0);
  const irrVals  = [-result.totalCapex, year1Net, result.netAnnualValue, result.netAnnualValue, result.netAnnualValue, result.netAnnualValue];
  ['B','C','D','E','F','G'].forEach((col, i) => {
    c(ws, `${col}${r}`, irrVals[i], LGRAY, font({ size: 9, color: { argb: irrVals[i] >= 0 ? NAVY : RED } }), align('right'), '$#,##0');
  });
  r++;

  ws.getRow(r).height = 18;
  c(ws, `A${r}`, 'Cost of Capital (WACC)', WHITE, font({ size: 9, color: { argb: NAVY } }), align('left'));
  c(ws, `B${r}`, fin.wacc, YELLOW, font({ bold: true, size: 9, color: { argb: NAVY } }), align('right'), '0.0%');
  r++;

  r++; ws.getRow(r - 1).height = 8; // spacer

  // ── Project Summary ────────────────────────────────────────────────────────
  ws.getRow(r).height = 22; ws.mergeCells(`A${r}:R${r}`);
  sHdr(ws, `A${r}`, `Project Summary — ${enabledUcNames || company}`);
  r++;

  const irrVal = Math.min(result.irrAnnual ?? 0, 3.0);
  const summaryData = [
    ['NPV (5 yr.)',                    result.npv,            '$#,##0'],
    ['IRR (5 yr.)',                    irrVal,                '0.0%'  ],
    ['One-Time CapEx',                 result.totalCapex,     '$#,##0'],
    ['ROI (5 yr.)',                    result.fiveYrRoi - 1,  '0.0%'  ],
    ['Payback Period',                 result.paybackWeeks ?? 0, '0.0 "wks"'],
    ['Xemelgo Annual Software Fee',    result.annualSaasFee,  '$#,##0'],
    ['Net Annual Opportunity Value',   result.netAnnualValue, '$#,##0'],
    ['SaaS ROI (annual)',              result.saasRoi,        '0.0%'  ],
  ];
  summaryData.forEach(([lbl, val, fmt], i) => {
    ws.getRow(r).height = 18;
    const bg = i % 2 === 0 ? WHITE : LGRAY;
    c(ws, `A${r}`, lbl, bg, font({ size: 9, color: { argb: NAVY } }), align('left'));
    c(ws, `B${r}`, val, bg, font({ bold: true, size: 10, color: { argb: BLUE } }), align('right'), fmt);
    ['A','B'].forEach(col => ws.getCell(`${col}${r}`).border = thinBorder);
    r++;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────
export async function generateExcel(ops, useCases, fin, result, contactInfo, customCategories) {
  const company = ops.companyName?.trim() || 'Your Facility';
  const dateISO = new Date().toISOString().slice(0, 10);

  const wb       = new Workbook();
  wb.creator     = 'Xemelgo ROI Calculator';
  wb.created     = new Date();
  wb.properties.date1904 = false;

  const ws1 = wb.addWorksheet('ROI Summary');
  const ws2 = wb.addWorksheet('Savings Analysis');
  const ws3 = wb.addWorksheet('Financial Analysis');

  buildROISummary(ws1, ops, useCases, fin, result, contactInfo, dateISO);
  buildSavingsAnalysis(ws2, ops, useCases, result, dateISO);
  buildFinancialAnalysis(ws3, ops, useCases, fin, result, dateISO);

  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a');
  a.href       = url;
  a.download   = `Xemelgo_Financial_Model_${company.replace(/\s+/g, '_')}_${dateISO}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
