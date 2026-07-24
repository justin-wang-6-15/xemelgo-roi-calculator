import jsPDF from 'jspdf';
import { fmt$, fmtPct, fmtWks } from './format';
import { getBaseUcKey, getUcDisplayName, calcUseCaseValue } from './calculations';

// Brand colors [R, G, B]
const NAVY   = [11,  16,  40 ];  // #0B1028
const BLUE   = [0,   79,  219];  // #004FDB
const GREEN  = [0,   142, 115];  // #008E73
const LBLUE  = [13,  140, 255];  // #0D8CFF
const BGBLUE = [237, 245, 255];  // #EDF5FF
const WHITE  = [255, 255, 255];
const RED    = [204, 0,   0  ];  // #CC0000
const GRAY66 = [102, 102, 102];  // #666666
const GRAY99 = [153, 153, 153];  // #999999

const BUCKET_COLORS = {
  'Labor Efficiency':              BLUE,
  'Loss Prevention & Compliance':  GREEN,
  'Revenue & Throughput':          LBLUE,
  'Capital Efficiency':            NAVY,
};

const W = 612;

const UNITS_LABEL = {
  '':            'Units Produced Per Month',
  manufacturing: 'Units Produced Per Month',
  retail:        'Orders Shipped Per Month',
  supplychain:   'Shipments Processed Per Month',
  healthcare:    'Lots or Batches Completed Per Month',
  other:         'Units or Jobs Per Month',
};

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

// Field definitions for standard (non-multi-driver) UCs
// [label, stateField, type] — type: 'n'=number, '$'=dollar, 'p'=percent 0-1, 'pct'=percent as-is
const UC_DEFS = {
  audit:                   [['People per audit','people','n'],['Days per audit','daysPerAudit','n'],['Hours per day','hoursPerDay','n'],['Audits per year','auditsPerYear','n'],['Burdened rate','burdenedRate','$'],['Efficiency improvement','reductionPct','p']],
  shipReceiveVerification: [['Minutes saved per dock transaction','minutesSavedPerTransaction','n'],['Dock transactions per day','transactionsPerDay','n'],['Burdened rate','burdenedRate','$'],['Time reduction','reductionPct','p']],
  internalDelivery:        [['Minutes per internal transfer','minutesPerTransfer','n'],['Internal transfers per day','transfersPerDay','n'],['People per transfer','peoplePerTransfer','n'],['Burdened rate','burdenedRate','$'],['Time reduction','reductionPct','p']],
  expiredProducts:         [['Expired product incidents per year','incidentsPerYear','n'],['Avg write-off cost per incident','costPerIncident','$'],['Incident reduction','reductionPct','p']],
  calibrationReminders:    [['Missed calibrations per year','failuresPerYear','n'],['Cost per failure','costPerFailure','$'],['Failure reduction','reductionPct','p']],
  geofencing:              [['Out-of-zone incidents per year','incidentsPerYear','n'],['Cost per incident','costPerIncident','$'],['Incident reduction','reductionPct','p']],
  shrinkage:               [['Unexplained loss incidents per year','incidentsPerYear','n'],['Material / inventory value per incident','materialValuePerIncident','$'],['Investigation labor per incident (hrs)','laborHoursPerIncident','n'],['Burdened rate','burdenedRate','$'],['Scrap or disposal cost per incident','scrapCostPerIncident','$'],['Incident reduction','reductionPct','p']],
  productionEquipment:     [['Tool downtime incidents per year','incidentsPerYear','n'],['Avg cost per incident','costPerIncident','$'],['Incident reduction','reductionPct','p']],
  rtiTracking:             [['Lost or untracked container incidents per year','incidentsPerYear','n'],['Avg cost per incident','costPerIncident','$'],['Incident reduction','reductionPct','p']],
  proofOfDelivery:         [['Disputed delivery claims per year','incidentsPerYear','n'],['Cost per claim','costPerIncident','$'],['Claim reduction','reductionPct','p']],
  qualityExceptionTracking:   [['Exceptions per year','exceptionsPerYear','n'],['Rework cost per exception','reworkCostPerException','$'],['Scrap cost per exception','scrapCostPerException','$'],['Reduction rate','reductionPct','p']],
  expeditedExceptionTracking: [['Late shipments per month','lateShipmentsPerMonth','n'],['Cost per late shipment','costPerLateShipment','$'],['Reduction rate','reductionPct','p']],
  workingCapitalImprovement:  [['Avg WIP inventory value','wipInventoryValue','$'],['Inventory reduction','reductionPct','p']],
  fasterFulfillment:       [['Current cycle time (hrs)','currentCycleTime','n'],['Target cycle time (hrs)','targetCycleTime','n'],['Orders per month','ordersPerMonth','n'],['Revenue per order','revenuePerOrder','$']],
  misShipReduction:        [['Mis-ships per month','misShipsPerMonth','n'],['Cost per mis-ship','costPerMisShip','$'],['Reduction rate','reductionPct','p']],
  dockTurnSpeed:           [['Minutes saved per dock transaction','minutesSaved','n'],['Dock transactions per day','transactionsPerDay','n'],['Burdened rate','burdenedRate','$'],['Reduction rate','reductionPct','p']],
  goodsReceipt:            [['Minutes saved per receiving transaction','minutesSavedPerTransaction','n'],['Receiving transactions per day','transactionsPerDay','n'],['Receiving staff','dockStaff','n'],['Burdened rate','burdenedRate','$'],['Time reduction','reductionPct','p']],
  automatedPackCount:      [['Minutes saved per pack count','minutesSavedPerTransaction','n'],['Pack counts per day','transactionsPerDay','n'],['Number of staff performing counts','dockStaff','n'],['Burdened rate','burdenedRate','$'],['Time reduction','reductionPct','p']],
  outboundAudit:           [['Minutes saved per outbound shipment','minutesSaved','n'],['Outbound shipments per day','transactionsPerDay','n'],['Dock staff','dockStaff','n'],['Burdened rate','burdenedRate','$'],['Time reduction','reductionPct','p']],
  returnsTransfers:        [['Minutes per internal transfer','minutesPerTransfer','n'],['Internal transfers per day','transfersPerDay','n'],['People per transfer','peoplePerTransfer','n'],['Burdened rate','burdenedRate','$'],['Time reduction','reductionPct','p']],
  inventoryRequests:       [['Hours per week on requests','hoursPerWeek','n'],['People involved','peopleInvolved','n'],['Burdened rate','burdenedRate','$'],['Time reduction','reductionPct','p']],
};

const SOLUTION_GROUPS = [
  { name: 'Inventory Management', keys: [
    'cycleCount__inventory', 'locateItems__inventory', 'audit', 'shrinkage',
    'expiredProducts', 'inventoryRequests',
  ]},
  { name: 'Asset Tracking', keys: [
    'cycleCount__asset', 'locateItems__asset', 'calibrationReminders',
    'productionEquipment', 'rtiTracking__asset', 'geofencing',
  ]},
  { name: 'Work in Process', keys: [
    'cycleCount__wip', 'locateItems__wip', 'workOrderTracking',
    'qualityExceptionTracking', 'expeditedExceptionTracking',
    'rtiTracking__wip', 'workingCapitalImprovement',
  ]},
  { name: 'Shipment Tracking', keys: [
    'picklistVerification', 'shipReceiveVerification', 'misShipReduction',
    'fasterFulfillment', 'proofOfDelivery', 'dockTurnSpeed',
    'goodsReceipt', 'automatedPackCount', 'outboundAudit', 'returnsTransfers',
  ]},
  { name: 'Package Delivery', keys: ['internalDelivery'] },
];

const ROLE_DISPLAY = {
  materialHandler: 'Material Handler',
  planner:         'Planner',
  indirect:        'Indirect / Leadership',
  direct:          'Direct Employee',
};

function fmtVal(v, type) {
  if (v === '' || v === undefined || v === null) return '—';
  if (type === '$') return fmt$(v);
  if (type === 'p') return fmtPct(v);
  if (type === 'pct') return String(v) + '%';
  return String(Number.isInteger(v) ? v : parseFloat(Number(v).toFixed(2)));
}

function arrayBufferToBase64(buf) {
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function loadInterFont(doc) {
  try {
    const [boldRes, regRes] = await Promise.all([
      fetch('/fonts/Inter-Bold.ttf'),
      fetch('/fonts/Inter-Regular.ttf'),
    ]);
    if (!boldRes.ok || !regRes.ok) throw new Error('font fetch failed');
    const [boldBuf, regBuf] = await Promise.all([boldRes.arrayBuffer(), regRes.arrayBuffer()]);
    doc.addFileToVFS('Inter-Bold.ttf', arrayBufferToBase64(boldBuf));
    doc.addFont('Inter-Bold.ttf', 'Inter', 'bold');
    doc.addFileToVFS('Inter-Regular.ttf', arrayBufferToBase64(regBuf));
    doc.addFont('Inter-Regular.ttf', 'Inter', 'normal');
    return 'Inter';
  } catch {
    return 'Helvetica';
  }
}

async function loadImg(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise(resolve => {
      const fr = new FileReader();
      fr.onloadend = () => resolve(fr.result);
      fr.readAsDataURL(blob);
    });
  } catch { return null; }
}

function buildDoc(doc, fontName, logo, ops, useCases, fin, result, contactInfo, customCategories) {
  const company     = ops.companyName?.trim() || 'Your Facility';
  const ctxComp     = contactInfo?.company?.trim() || company;
  const first       = contactInfo?.firstName?.trim() || '';
  const last        = contactInfo?.lastName?.trim() || '';
  const now         = new Date();
  const dateDisplay = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const dateISO     = now.toISOString().slice(0, 10);

  const sf  = (...rgb) => doc.setFillColor(...rgb);
  const sc  = (...rgb) => doc.setTextColor(...rgb);
  const sd  = (...rgb) => doc.setDrawColor(...rgb);
  const lw  = (w)      => doc.setLineWidth(w);
  const box = (x, y, w, h) => doc.rect(x, y, w, h, 'F');
  const fn  = (style = 'normal', size = 9) => { doc.setFont(fontName, style); doc.setFontSize(size); };

  function logoOrText(x, y, w, h, fallbackSize = 13) {
    if (logo) {
      try { doc.addImage(logo, 'PNG', x, y, w, h); } catch {}
    } else {
      fn('bold', fallbackSize); sc(...WHITE);
      doc.text('XEMELGO', x, y + h * 0.75);
    }
  }

  function sectionHead(label, x, y_text, x_end) {
    fn('bold', 7.5); sc(...NAVY);
    doc.text(label, x, y_text);
    const tw = doc.getTextWidth(label);
    sd(...GRAY99); lw(0.4);
    doc.line(x + tw + 8, y_text - 4, x_end, y_text - 4);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGE 1
  // ─────────────────────────────────────────────────────────────────────────────

  // Hero band (navy, full width, y=0..220)
  sf(...NAVY); box(0, 0, W, 220);

  // Blue accent strip at very top (y=0..6)
  sf(...BLUE); box(0, 0, W, 6);

  // Logo (x=24, y=14)
  logoOrText(24, 14, 130, 34, 13);

  // Identity — right side
  fn('normal', 11); sc(...WHITE);
  doc.text('ROI Analysis Report', W - 24, 26, { align: 'right' });
  fn('normal', 9); sc(...LBLUE);
  doc.text(ctxComp, W - 24, 40, { align: 'right' });
  fn('normal', 8); sc(...GRAY99);
  doc.text(dateDisplay, W - 24, 52, { align: 'right' });

  // Horizontal rule at y=82
  sd(...BLUE); lw(0.5);
  doc.line(0, 82, W, 82);

  // 3 metric columns — labels, values, descriptions
  const payStr = result.paybackWeeks ? fmtWks(result.paybackWeeks) : 'N/A';
  const metricsData = [
    { label: 'NET ANNUAL VALUE', value: fmt$(result.netAnnualValue), desc: 'Net of platform costs' },
    { label: 'PAYBACK PERIOD',   value: payStr,                      desc: 'Time to recover investment' },
    { label: '5-YEAR ROI',       value: fmtPct(result.fiveYrRoi - 1), desc: 'Return over 5 years' },
  ];
  const COL_W = W / 3; // 204

  metricsData.forEach(({ label, value, desc }, i) => {
    const cx = COL_W * i + COL_W / 2;
    fn('normal', 8); sc(...GRAY99);
    doc.text(label, cx, 110, { align: 'center' });
    // Auto-shrink value font to fit column
    let vSize = 36;
    fn('bold', vSize); sc(...WHITE);
    while (doc.getTextWidth(value) > COL_W - 12 && vSize > 16) {
      vSize -= 1;
      doc.setFontSize(vSize);
    }
    doc.text(value, cx, 160, { align: 'center' });
    fn('italic', 7); sc(...GRAY99);
    doc.text(desc, cx, 186, { align: 'center' });
  });

  // Light vertical dividers between metric columns
  sd(60, 90, 150); lw(0.5);
  doc.line(204, 90, 204, 210);
  doc.line(408, 90, 408, 210);

  // Narrative block (y=222..252, white fill)
  sf(...WHITE); box(0, 222, W, 30);

  const npvStr = fmt$(result.npv);
  const SENT_Y = 240;
  const prefix = 'At these inputs, ';
  fn('normal', 9); sc(...GRAY66);
  doc.text(prefix, 24, SENT_Y);
  let sx = 24 + doc.getTextWidth(prefix);
  fn('bold', 9); sc(...NAVY);
  doc.text(ctxComp, sx, SENT_Y);
  sx += doc.getTextWidth(ctxComp);
  fn('normal', 9); sc(...GRAY66);
  const mid1 = ' would recover its full investment in ';
  doc.text(mid1, sx, SENT_Y);
  sx += doc.getTextWidth(mid1);
  fn('bold', 9); sc(...NAVY);
  doc.text(payStr, sx, SENT_Y);
  sx += doc.getTextWidth(payStr);
  fn('normal', 9); sc(...GRAY66);
  const mid2 = ' and generate ';
  doc.text(mid2, sx, SENT_Y);
  sx += doc.getTextWidth(mid2);
  fn('bold', 9); sc(...NAVY);
  doc.text(npvStr, sx, SENT_Y);
  sx += doc.getTextWidth(npvStr);
  fn('normal', 9); sc(...GRAY66);
  doc.text(' in net value over 5 years.', sx, SENT_Y);

  // Section bar (y=254..276, blue fill)
  sf(...BLUE); box(0, 254, W, 22);
  fn('bold', 9); sc(...WHITE);
  doc.text('HOW YOU GET THERE', 24, 269);

  // ── Table (left, x=0..310) + bar chart (right, x=314..596) ──
  const TABLE_X  = 16;
  const TABLE_W  = 294;
  const TABLE_R  = TABLE_X + TABLE_W; // 310
  const CHART_X  = 318;
  const CHART_R  = W - 16;
  const ROW_H    = 18;

  // Table column headers row
  sf(...NAVY); box(0, 278, TABLE_R, 14);
  fn('bold', 6.5); sc(...WHITE);
  doc.text('USE CASE', TABLE_X + 10, 289);
  doc.text('CATEGORY', TABLE_X + 155, 289);
  doc.text('ANNUAL VALUE', TABLE_R - 4, 289, { align: 'right' });

  let ty = 292;
  let rowAlt = false;

  result.buckets.forEach(bucket => {
    if (!bucket.lineItems.length) return;
    const pillColor = BUCKET_COLORS[bucket.name] || NAVY;
    bucket.lineItems.forEach(li => {
      sf(...(rowAlt ? BGBLUE : WHITE)); box(0, ty, TABLE_R, ROW_H);
      sf(...pillColor); box(TABLE_X, ty + 6, 6, 6);
      fn('normal', 7); sc(...NAVY);
      const ucNameStr = doc.splitTextToSize(li.name, 128)[0];
      doc.text(ucNameStr, TABLE_X + 10, ty + 12);
      fn('normal', 6.5); sc(...GRAY66);
      const catShort = bucket.name.split(' & ')[0];
      doc.text(catShort, TABLE_X + 155, ty + 12);
      fn('bold', 7.5); sc(...NAVY);
      doc.text(fmt$(li.annualValue), TABLE_R - 4, ty + 12, { align: 'right' });
      ty += ROW_H;
      rowAlt = !rowAlt;
    });
    // Bucket subtotal row
    sf(...BGBLUE); box(0, ty, TABLE_R, ROW_H);
    fn('bold', 7.5); sc(...NAVY);
    doc.text(bucket.name, TABLE_X + 10, ty + 12);
    doc.text(fmt$(bucket.subtotal), TABLE_R - 4, ty + 12, { align: 'right' });
    ty += ROW_H;
    rowAlt = false;
  });

  // Totals section
  sd(...NAVY); lw(0.5); doc.line(TABLE_X, ty, TABLE_R, ty); ty += 4;

  fn('bold', 8); sc(...NAVY);
  doc.text('Total Gross Annual', TABLE_X + 10, ty + 12);
  doc.text(fmt$(result.totalGrossAnnual), TABLE_R - 4, ty + 12, { align: 'right' });
  ty += ROW_H;

  fn('normal', 7.5); sc(...RED);
  doc.text('Annual Platform Cost', TABLE_X + 10, ty + 12);
  doc.text(`(${fmt$(result.annualSaasFee)})`, TABLE_R - 4, ty + 12, { align: 'right' });
  ty += ROW_H;

  sd(...BLUE); lw(0.5); doc.line(TABLE_X, ty, TABLE_R, ty);
  fn('bold', 8.5); sc(...BLUE);
  doc.text('Net Annual Value', TABLE_X + 10, ty + 12);
  doc.text(fmt$(result.netAnnualValue), TABLE_R - 4, ty + 12, { align: 'right' });
  ty += ROW_H;
  sd(...BLUE); lw(0.5); doc.line(TABLE_X, ty, TABLE_R, ty);

  // Bar chart — sorted largest → smallest
  const activeBuckets = result.buckets.filter(b => b.subtotal > 0);
  const sortedBuckets = [...activeBuckets].sort((a, b) => b.subtotal - a.subtotal);
  const maxVal = Math.max(...sortedBuckets.map(b => b.subtotal), 1);
  const MAX_BAR_W = CHART_R - CHART_X - 70;
  const BAR_H = 14, BAR_SPACING = 14;

  fn('normal', 7); sc(...GRAY66);
  doc.text('SAVINGS BY CATEGORY', CHART_X, 290);

  let chy = 304;
  sortedBuckets.forEach(bucket => {
    const pillColor = BUCKET_COLORS[bucket.name] || NAVY;
    const barW = Math.max(4, Math.round((bucket.subtotal / maxVal) * MAX_BAR_W));
    fn('normal', 7); sc(...NAVY);
    doc.text(bucket.name, CHART_X, chy);
    chy += 10;
    sf(...pillColor); box(CHART_X, chy, barW, BAR_H);
    fn('bold', 7); sc(...NAVY);
    doc.text(fmt$(bucket.subtotal), CHART_X + barW + 4, chy + BAR_H - 2);
    chy += BAR_H + BAR_SPACING;
  });

  // Investment snapshot strip (y=712..754, blue fill)
  sf(...BLUE); box(0, 712, W, 42);

  const invItems = [
    { label: 'CapEx',               value: fmt$((Number(fin.hardwareCapex) || 0) + (Number(fin.setupCapex) || 0)) },
    { label: 'Annual Platform Fee',  value: fmt$(result.annualSaasFee)  },
    { label: 'WACC',                 value: fmtPct(fin.wacc)            },
  ];
  invItems.forEach((item, i) => {
    const icx = COL_W * i + COL_W / 2;
    fn('normal', 7); sc(...WHITE);
    doc.text(item.label, icx, 726, { align: 'center' });
    fn('bold', 10); sc(...WHITE);
    doc.text(item.value, icx, 744, { align: 'center' });
  });
  // Dividers between investment items
  sd(30, 70, 160); lw(0.4);
  doc.line(204, 718, 204, 748);
  doc.line(408, 718, 408, 748);

  // Footer (y=762..792, navy fill)
  sf(...NAVY); box(0, 762, W, 30);
  logoOrText(24, 766, 60, 18, 7);
  fn('italic', 6.5); sc(...GRAY99);
  doc.text(
    'This analysis is based on inputs provided by the user and Xemelgo customer benchmarks. Actual results may vary.',
    W - 16, 778, { align: 'right', maxWidth: 380 }
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGE 2 — Inputs & Assumptions
  // ─────────────────────────────────────────────────────────────────────────────
  doc.addPage();

  sf(...NAVY); box(0, 0, W, 60);
  sf(...BLUE); box(0, 0, W, 6);
  logoOrText(24, 14, 108, 32, 14);
  fn('normal', 11); sc(...WHITE);
  doc.text('Inputs & Assumptions', W - 24, 22, { align: 'right' });
  fn('normal', 9); sc(...LBLUE);
  doc.text(ctxComp, W - 24, 37, { align: 'right' });
  fn('normal', 8); sc(...GRAY99);
  doc.text('Continued from Page 1', W - 24, 52, { align: 'right' });

  let y = 64;
  const LX = 24, LW = 275, RX = 307, RW = 279;
  const RH = 16;

  sectionHead('FACILITY OVERVIEW', LX, y + 12, LX + LW);
  sectionHead('TEAM HEADCOUNT & RATES', RX, y + 12, RX + RW);
  y += 18;

  const unitsLbl  = UNITS_LABEL[ops.industry] ?? UNITS_LABEL[''];
  const shiftsLbl = ops.industry === 'retail' ? 'Operating hours / day' : 'Shifts per day';
  const facRows = [
    ['Industry',             ops.industry ? ops.industry.charAt(0).toUpperCase() + ops.industry.slice(1) : '—'],
    [unitsLbl,               (ops.unitsPerMonth || 0).toLocaleString()],
    ['Working days / week',  ops.workDaysPerWeek],
    ['Working weeks / year', ops.workWeeksPerYear],
    [shiftsLbl,              ops.shiftsPerDay],
  ];

  let ly = y;
  facRows.forEach((row, i) => {
    sf(...(i % 2 === 0 ? WHITE : BGBLUE)); box(LX, ly, LW, RH);
    fn('normal', 7.5); sc(...GRAY66);
    doc.text(String(row[0]), LX + 8, ly + 11);
    fn('bold', 8); sc(...NAVY);
    doc.text(String(row[1]), LX + LW - 8, ly + 11, { align: 'right' });
    ly += RH;
  });

  let ry = y;
  sf(...BGBLUE); box(RX, ry, RW, 14);
  fn('bold', 6.5); sc(...GRAY66);
  doc.text('ROLE', RX + 8, ry + 10);
  doc.text('HC', RX + RW * 0.58, ry + 10, { align: 'center' });
  doc.text('RATE / HR', RX + RW - 8, ry + 10, { align: 'right' });
  ry += 14;

  const teamRows = [
    ['Material Handlers',     ops.materialHandlerCount, ops.materialHandlerRate],
    ['Planners',              ops.plannerCount,         ops.plannerRate        ],
    ['Indirect / Leadership', ops.indirectCount,        ops.indirectRate       ],
    ['Direct Employees',      ops.directCount,          ops.directRate         ],
  ];
  teamRows.forEach((row, i) => {
    sf(...(i % 2 === 0 ? WHITE : BGBLUE)); box(RX, ry, RW, RH);
    fn('normal', 7.5); sc(...GRAY66);
    doc.text(String(row[0]), RX + 8, ry + 11);
    fn('bold', 8); sc(...NAVY);
    doc.text(String(row[1]), RX + RW * 0.58, ry + 11, { align: 'center' });
    doc.text(`$${row[2]}/hr`, RX + RW - 8, ry + 11, { align: 'right' });
    ry += RH;
  });

  y = Math.max(ly, ry) + 16;

  // ─────────────────────────────────────────────────────────────────────────────
  // FINANCE SECTION
  // ─────────────────────────────────────────────────────────────────────────────
  const BOTTOM_MARGIN = 740;
  const PAGE_HDR_H   = 58;

  function addNewPage() {
    doc.addPage();
    sf(...NAVY); box(0, 0, W, 52);
    sf(...BLUE); box(0, 0, W, 6);
    logoOrText(24, 12, 90, 28, 10);
    fn('normal', 9); sc(...WHITE);
    doc.text('Inputs Appendix', W - 24, 22, { align: 'right' });
    fn('normal', 8); sc(...LBLUE);
    doc.text(ctxComp, W - 24, 37, { align: 'right' });
    y = PAGE_HDR_H;
  }

  function needPage(h) {
    if (y + h > BOTTOM_MARGIN) addNewPage();
  }

  needPage(120);
  sectionHead('FINANCE', LX, y + 12, W - LX);
  y += 20;

  const finRows = [
    ['Hardware & Installation',      fmt$(Number(fin.hardwareCapex) || 0)],
    ['Xemelgo Setup Cost',           fmt$(Number(fin.setupCapex) || 0)],
    ['Contingency Rate',             fmtPct(fin.contingencyRate)],
    ['Total CapEx with Contingency', fmt$(result.totalCapex)],
    ['Monthly Platform Fee',         fmt$(Number(fin.monthlyPlatformFee) || 0)],
    ['WACC',                         fmtPct(fin.wacc)],
  ];
  finRows.forEach(([label, val], i) => {
    sf(...(i % 2 === 0 ? WHITE : BGBLUE)); box(LX, y, W - LX * 2, 15);
    fn('normal', 7.5); sc(...GRAY66);
    doc.text(label, LX + 8, y + 11);
    fn('bold', 8); sc(...NAVY);
    doc.text(val, W - LX - 8, y + 11, { align: 'right' });
    y += 15;
  });

  y += 20;

  // ─────────────────────────────────────────────────────────────────────────────
  // USE CASES & SAVINGS DRIVERS SECTION
  // ─────────────────────────────────────────────────────────────────────────────
  needPage(50);
  sectionHead('USE CASES & SAVINGS DRIVERS', LX, y + 12, W - LX);
  y += 24;

  const CARD_X = 24, CARD_END = W - 24, FULL_W = CARD_END - CARD_X;

  // ── Inner helpers (all share `y` by closure) ──

  function fieldRow(label, val, type) {
    const displayVal = fmtVal(val, type);
    if (displayVal === '—' && val === '') return; // skip empty optional fields
    needPage(13);
    fn('normal', 7); sc(...GRAY66);
    doc.text(label + ':', CARD_X + 12, y);
    fn('bold', 7.5); sc(...NAVY);
    doc.text(displayVal, CARD_END - 12, y, { align: 'right' });
    y += 13;
  }

  function driverTag(label) {
    needPage(18);
    y += 5;
    fn('bold', 6.5); sc(...GRAY66);
    doc.text(label, CARD_X + 12, y);
    y += 13;
  }

  function renderRoleRow(row) {
    needPage(13);
    const roleName = row.role === 'custom'
      ? (row.customRoleName || 'Custom Role')
      : (ROLE_DISPLAY[row.role] || row.role);
    // 4-part inline row: role | hrs/day | HC | rate
    const x1 = CARD_X + 12, x2 = x1 + 160, x3 = x2 + 110, x4 = x3 + 90;
    fn('normal', 6.5); sc(...GRAY66); doc.text('Role:', x1, y);
    fn('bold', 7);     sc(...NAVY);   doc.text(roleName, x1 + 28, y);
    fn('normal', 6.5); sc(...GRAY66); doc.text('Hrs lost/day:', x2, y);
    fn('bold', 7);     sc(...NAVY);   doc.text(String(row.hoursLostPerDay ?? '—'), x2 + 58, y);
    fn('normal', 6.5); sc(...GRAY66); doc.text('HC:', x3, y);
    fn('bold', 7);     sc(...NAVY);   doc.text(String(row.headcount ?? '—'), x3 + 20, y);
    fn('normal', 6.5); sc(...GRAY66); doc.text('Rate:', x4, y);
    fn('bold', 7);     sc(...NAVY);   doc.text(fmt$(row.burdenedRate ?? 0) + '/hr', CARD_END - 12, y, { align: 'right' });
    y += 13;
  }

  function renderJustification(text) {
    const trimmed = (text || '').trim();
    if (trimmed) {
      const lines = doc.splitTextToSize(trimmed, FULL_W - 30);
      const bH    = 8 + lines.length * 10;
      needPage(bH + 8);
      const iy = y;
      sf(...BGBLUE); box(CARD_X + 8, iy, FULL_W - 16, bH);
      sd(...LBLUE); lw(2);
      doc.line(CARD_X + 8, iy, CARD_X + 8, iy + bH);
      sd(...GRAY99); lw(0.3);
      fn('normal', 7); sc(...GRAY66);
      doc.text(lines, CARD_X + 18, iy + 10);
      y = iy + bH + 6;
    } else {
      needPage(14);
      fn('italic', 7); sc(...GRAY99);
      doc.text('No justification entered.', CARD_X + 12, y);
      y += 14;
    }
  }

  function renderCustomDriver(cd) {
    driverTag((cd.name || 'Custom') + ' (CUSTOM DRIVER)');
    needPage(13);
    fn('normal', 7); sc(...GRAY66);
    doc.text('Annual value:', CARD_X + 12, y);
    fn('bold', 7.5); sc(...NAVY);
    doc.text(fmt$(Number(cd.annualValue) || 0), CARD_END - 12, y, { align: 'right' });
    y += 13;
    if (cd.justification?.trim()) {
      const lines = doc.splitTextToSize(cd.justification.trim(), FULL_W - 30);
      const bH    = 8 + lines.length * 10;
      needPage(bH + 8);
      const iy = y;
      sf(...BGBLUE); box(CARD_X + 8, iy, FULL_W - 16, bH);
      sd(...LBLUE); lw(2);
      doc.line(CARD_X + 8, iy, CARD_X + 8, iy + bH);
      sd(...GRAY99); lw(0.3);
      fn('normal', 7); sc(...GRAY66);
      doc.text(lines, CARD_X + 18, iy + 10);
      y = iy + bH + 6;
    }
  }

  // Compact 3-column grid for standard UCs
  function renderStdGrid(uc, base) {
    const defs = (UC_DEFS[base] || []).filter(([, f]) => {
      const v = uc[f];
      return v !== undefined && v !== '';
    });
    if (!defs.length) return;
    const colW   = FULL_W / 3;
    const colX   = [CARD_X, CARD_X + colW, CARD_X + colW * 2];
    let colIdx   = 0;
    defs.forEach((def, i) => {
      const [label, field, type] = def;
      if (colIdx === 0) needPage(13);
      const cx = colX[colIdx];
      fn('normal', 6.5); sc(...GRAY66);
      doc.text(label + ':', cx + 8, y);
      fn('bold', 7); sc(...NAVY);
      doc.text(fmtVal(uc[field], type), cx + colW - 8, y, { align: 'right' });
      colIdx++;
      if (colIdx === 3 || i === defs.length - 1) { y += 13; colIdx = 0; }
    });
  }

  // cycleCount handles both modes
  function renderCycleCountFields(uc) {
    if ((uc.mode || 'reductionPct') === 'employeeDelta') {
      fieldRow('Employees before', uc.employeesBefore, 'n');
      fieldRow('Hours per count (before)', uc.hoursPerCountBefore, 'n');
      fieldRow('Employees after', uc.employeesAfter, 'n');
      fieldRow('Hours per count (after)', uc.hoursPerCountAfter, 'n');
      fieldRow('Counts per year', uc.countsPerYear, 'n');
      fieldRow('Burdened rate', uc.burdenedRate, '$');
    } else {
      fieldRow('Hours per count session', uc.hoursPerSession, 'n');
      fieldRow('Count sessions per week', uc.sessionsPerWeek, 'n');
      fieldRow('People counting simultaneously per session', uc.peoplePerSession, 'n');
      fieldRow('Burdened rate', uc.burdenedRate, '$');
      fieldRow('Efficiency improvement', uc.reductionPct, 'p');
    }
  }

  // Full UC card renderer
  function renderUcCard(key, uc) {
    const base        = getBaseUcKey(key);
    const annualValue = calcUseCaseValue(key, uc, ops, fin);
    const displayName = getUcDisplayName(key) || UC_NAMES[base] || base;
    const isZero      = annualValue <= 0;

    // Header — ensure at least header + first content line fit
    needPage(isZero ? 50 : 60);
    sf(...BGBLUE); box(CARD_X, y, FULL_W, 20);
    fn('bold', 8.5); sc(...BLUE);
    const nameStr = doc.splitTextToSize(displayName, FULL_W - 110)[0];
    doc.text(nameStr, CARD_X + 10, y + 14);
    fn('bold', 9); sc(...GREEN);
    doc.text(fmt$(annualValue), CARD_END - 10, y + 14, { align: 'right' });
    y += 23;

    if (isZero) {
      fn('italic', 7); sc(...GRAY66);
      doc.text('Enabled but not yet configured — contributes $0 to the total.', CARD_X + 12, y);
      y += 14;
    } else if (base === 'cycleCount') {
      renderCycleCountFields(uc);
      y += 3;
      renderJustification(uc.justification);
    } else if (base === 'locateItems' || base === 'workOrderTracking') {
      const isLocate = base === 'locateItems';
      if (uc.driver1Enabled !== false) {
        driverTag(isLocate
          ? 'DRIVER 1 — FLOOR WORKER SEARCH TIME'
          : 'DRIVER 1 — TIME SPENT MANUALLY TRACKING');
        (uc.roleRows || []).forEach(renderRoleRow);
        fieldRow('Efficiency improvement', uc.reductionPct, 'p');
        renderJustification(uc.driver1Justification);
      }
      if (uc.driver2Enabled !== false) {
        driverTag(isLocate
          ? 'DRIVER 2 — SUPERVISORY VISIBILITY TIME'
          : 'DRIVER 2 — SUPERVISOR EXPEDITING VISIBILITY TIME');
        fieldRow(isLocate ? 'Supervisor hours spent locating per week' : 'Supervisor hours spent expediting per week', uc.supervisorHoursPerWeek, 'n');
        fieldRow('Number of supervisors', uc.supervisorHeadcount, 'n');
        fieldRow('Supervisor burdened rate', uc.supervisorBurdenedRate, '$');
        fieldRow('Efficiency improvement', uc.reductionPct, 'p');
        renderJustification(uc.driver2Justification);
      }
    } else if (base === 'picklistVerification') {
      if (uc.driver1Enabled !== false) {
        driverTag('DRIVER 1 — ERROR COST REDUCTION');
        fieldRow('Picks per day', uc.picksPerDay, 'n');
        fieldRow('Error rate today (%)', uc.errorRate, 'pct');
        fieldRow('Cost per error', uc.costPerError, '$');
        fieldRow('Error reduction', uc.reductionPct, 'p');
        renderJustification(uc.driver1Justification);
      }
      if (uc.driver2Enabled !== false) {
        driverTag('DRIVER 2 — TIME SAVED PER PICK');
        fieldRow('Picks per day', uc.picksPerDay, 'n');
        fieldRow('Minutes saved per pick', uc.minutesSavedPerPick, 'n');
        fieldRow('Burdened rate', uc.burdenedRate, '$');
        renderJustification(uc.driver2Justification);
      }
    } else {
      renderStdGrid(uc, base);
      y += 3;
      renderJustification(uc.justification);
    }

    // Custom drivers
    (uc.customDrivers || []).forEach(renderCustomDriver);

    // Bottom separator
    needPage(10);
    sd(...GRAY99); lw(0.3);
    doc.line(CARD_X, y, CARD_END, y);
    y += 10;
  }

  // Render solution groups
  let anyUC = false;
  SOLUTION_GROUPS.forEach(({ name, keys }) => {
    const enabledKeys = keys.filter(k => useCases[k]?.enabled);
    if (!enabledKeys.length) return;
    anyUC = true;

    needPage(32);
    fn('bold', 8); sc(...NAVY);
    doc.text(name, CARD_X, y);
    sd(...BLUE); lw(0.5);
    doc.line(CARD_X, y + 4, CARD_END, y + 4);
    y += 16;

    enabledKeys.forEach(k => renderUcCard(k, useCases[k]));
    y += 4;
  });

  // Custom categories
  const cats = customCategories || [];
  if (cats.length) {
    anyUC = true;
    needPage(32);
    fn('bold', 8); sc(...NAVY);
    doc.text('Custom', CARD_X, y);
    sd(...BLUE); lw(0.5);
    doc.line(CARD_X, y + 4, CARD_END, y + 4);
    y += 16;

    cats.forEach(cc => {
      const val = Number(cc.annualSavings) || 0;
      needPage(50);
      sf(...BGBLUE); box(CARD_X, y, FULL_W, 20);
      fn('bold', 8.5); sc(...BLUE);
      doc.text(cc.name || 'Custom Category', CARD_X + 10, y + 14);
      fn('bold', 9); sc(...GREEN);
      doc.text(fmt$(val), CARD_END - 10, y + 14, { align: 'right' });
      y += 23;
      renderJustification(cc.justification);
      sd(...GRAY99); lw(0.3);
      doc.line(CARD_X, y, CARD_END, y);
      y += 10;
    });
  }

  if (!anyUC) {
    fn('italic', 7); sc(...GRAY99);
    doc.text('No use cases enabled.', CARD_X, y);
    y += 16;
  }

  // Footer on last page (fixed position at bottom)
  sd(...GRAY99); lw(0.4); doc.line(0, 762, W, 762);
  fn('bold', 6); sc(...GRAY99);
  doc.text('xemelgo', 24, 778);
  fn('italic', 6.5); sc(...GRAY99);
  doc.text(
    'This analysis is based on inputs provided by the user and Xemelgo customer benchmarks. Actual results may vary.',
    W - 16, 778, { align: 'right', maxWidth: 380 }
  );

  return dateISO;
}

export async function generatePDF(ops, useCases, fin, result, contactInfo, customCategories) {
  const company = ops.companyName?.trim() || 'Your Facility';
  const logo    = await loadImg('/xemelgo_logo_light.png');

  try {
    const doc      = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
    const fontName = await loadInterFont(doc);
    const dateISO  = buildDoc(doc, fontName, logo, ops, useCases, fin, result, contactInfo, customCategories);
    const fname    = `Xemelgo_ROI_Report_${company.replace(/\s+/g, '_')}_${dateISO}.pdf`;
    doc.save(fname);
    return;
  } catch (err) {
    console.error('[generatePDF] First attempt failed. Retrying with Helvetica fallback.', err);
  }

  try {
    const doc     = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
    const dateISO = buildDoc(doc, 'Helvetica', logo, ops, useCases, fin, result, contactInfo, customCategories);
    const fname   = `Xemelgo_ROI_Report_${company.replace(/\s+/g, '_')}_${dateISO}.pdf`;
    doc.save(fname);
  } catch (fallbackErr) {
    console.error('[generatePDF] Helvetica fallback also failed.', fallbackErr);
    throw fallbackErr;
  }
}
