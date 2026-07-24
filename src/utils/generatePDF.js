import jsPDF from 'jspdf';
import { fmt$, fmtPct, fmtWks } from './format';
import { getBaseUcKey, getUcDisplayName } from './calculations';

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

// Driver labels shown on PDF when driverMode === 'or'
const UC_DRIVER_LABELS = {
  picklistVerification: { 1: 'Error reduction', 2: 'Time saved per scan' },
  locateItems:          { 1: 'Search time saved', 2: 'Supervisory visibility time saved' },
  workOrderTracking:    { 1: 'Labor time lost tracking', 2: 'Expediting visibility time saved' },
};

const UC_DEFS = {
  cycleCount:              [['Hours per session','hoursPerSession','n'],['Sessions per week','sessionsPerWeek','n'],['People per session','peoplePerSession','n'],['Burdened rate','burdenedRate','$'],['Efficiency improvement','reductionPct','p']],
  audit:                   [['People per audit','people','n'],['Days per audit','daysPerAudit','n'],['Hours per day','hoursPerDay','n'],['Audits per year','auditsPerYear','n'],['Burdened rate','burdenedRate','$'],['Efficiency improvement','reductionPct','p']],
  locateItems:             [['Role rows','roleRows','custom',1],['Supervisor hours per week','supervisorHoursPerWeek','n',2],['Supervisor headcount','supervisorHeadcount','n',2],['Supervisor burdened rate','supervisorBurdenedRate','$',2]],
  workOrderTracking:       [['Role rows','roleRows','custom',1],['Supervisor hours per week','supervisorHoursPerWeek','n',2],['Supervisor headcount','supervisorHeadcount','n',2],['Supervisor burdened rate','supervisorBurdenedRate','$',2]],
  picklistVerification:    [['Picks per day','picksPerDay','n'],['Error rate','errorRate','pct',1],['Cost per error','costPerError','$',1],['Error reduction','reductionPct','p'],['Minutes saved per pick','minutesSavedPerPick','n',2],['Burdened rate (time driver)','burdenedRate','$',2]],
  shipReceiveVerification: [['Minutes saved per transaction','minutesSavedPerTransaction','n'],['Transactions per day','transactionsPerDay','n'],['Dock headcount','dockStaff','n'],['Burdened rate','burdenedRate','$'],['Time reduction','reductionPct','p']],
  internalDelivery:        [['Minutes per transfer','minutesPerTransfer','n'],['Transfers per day','transfersPerDay','n'],['People per transfer','peoplePerTransfer','n'],['Burdened rate','burdenedRate','$'],['Time reduction','reductionPct','p']],
  expiredProducts:         [['Incidents per year','incidentsPerYear','n'],['Cost per incident','costPerIncident','$'],['Incident reduction','reductionPct','p']],
  calibrationReminders:    [['Failures per year','failuresPerYear','n'],['Cost per failure','costPerFailure','$'],['Failure reduction','reductionPct','p']],
  geofencing:              [['Incidents per year','incidentsPerYear','n'],['Cost per incident','costPerIncident','$'],['Incident reduction','reductionPct','p']],
  goodsReceipt:            [['Minutes saved per transaction','minutesSavedPerTransaction','n'],['Transactions per day','transactionsPerDay','n'],['Receiving staff','dockStaff','n'],['Burdened rate','burdenedRate','$'],['Time reduction','reductionPct','p']],
  automatedPackCount:      [['Minutes saved per pack count','minutesSavedPerTransaction','n'],['Pack counts per day','transactionsPerDay','n'],['Staff','dockStaff','n'],['Burdened rate','burdenedRate','$'],['Time reduction','reductionPct','p']],
  outboundAudit:           [['Minutes saved per shipment','minutesSaved','n'],['Outbound shipments per day','transactionsPerDay','n'],['Dock staff','dockStaff','n'],['Burdened rate','burdenedRate','$'],['Time reduction','reductionPct','p']],
  returnsTransfers:        [['Minutes per transfer','minutesPerTransfer','n'],['Transfers per day','transfersPerDay','n'],['People per transfer','peoplePerTransfer','n'],['Burdened rate','burdenedRate','$'],['Time reduction','reductionPct','p']],
  inventoryRequests:       [['Hours per week on requests','hoursPerWeek','n'],['People involved','peopleInvolved','n'],['Burdened rate','burdenedRate','$'],['Time reduction','reductionPct','p']],
  shrinkage:               [['Incidents per year','incidentsPerYear','n'],['Cost per incident','costPerIncident','$'],['Incident reduction','reductionPct','p']],
  productionEquipment:     [['Incidents per year','incidentsPerYear','n'],['Cost per incident','costPerIncident','$'],['Incident reduction','reductionPct','p']],
  rtiTracking:             [['Incidents per year','incidentsPerYear','n'],['Cost per incident','costPerIncident','$'],['Incident reduction','reductionPct','p']],
  proofOfDelivery:         [['Claims per year','incidentsPerYear','n'],['Cost per claim','costPerIncident','$'],['Claim reduction','reductionPct','p']],
  qualityExceptionTracking:   [['Exceptions per year','exceptionsPerYear','n'],['Rework cost per exception','reworkCostPerException','$'],['Scrap cost per exception','scrapCostPerException','$'],['Reduction rate','reductionPct','p']],
  expeditedExceptionTracking: [['Late shipments per month','lateShipmentsPerMonth','n'],['Cost per late shipment','costPerLateShipment','$'],['Reduction rate','reductionPct','p']],
  workingCapitalImprovement:  [['Avg WIP inventory value','wipInventoryValue','$'],['Inventory reduction','reductionPct','p']],
  fasterFulfillment:       [['Current cycle time (hrs)','currentCycleTime','n'],['Target cycle time (hrs)','targetCycleTime','n'],['Orders per month','ordersPerMonth','n'],['Revenue per order','revenuePerOrder','$']],
  misShipReduction:        [['Mis-ships per month','misShipsPerMonth','n'],['Cost per mis-ship','costPerMisShip','$'],['Reduction rate','reductionPct','p']],
  dockTurnSpeed:           [['Minutes saved per transaction','minutesSaved','n'],['Transactions per day','transactionsPerDay','n'],['Dock staff','dockStaff','n'],['Burdened rate','burdenedRate','$'],['Reduction rate','reductionPct','p']],
};

function fmtVal(v, type) {
  if (type === '$') return fmt$(v);
  if (type === 'p') return fmtPct(v);
  if (type === 'pct') return String(v) + '%';
  return String(Number.isInteger(v) ? v : parseFloat(v.toFixed(2)));
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
      // Truncate long UC names to fit
      const ucNameStr = doc.splitTextToSize(li.name, 128)[0];
      doc.text(ucNameStr, TABLE_X + 10, ty + 12);
      fn('normal', 6.5); sc(...GRAY66);
      // Shorten category label to first word group before '&'
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
  const MAX_BAR_W = CHART_R - CHART_X - 70; // leave room for value label
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
    { label: 'CapEx',               value: fmt$(Number(fin.capex) || 0) },
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

  y = Math.max(ly, ry) + 12;

  sectionHead('USE CASE INPUTS & ASSUMPTIONS', 24, y + 12, W - 24);
  y += 18;

  fn('italic', 7); sc(...GRAY66);
  doc.text(
    'These are the inputs used to calculate your annual opportunity. Values reflect what you entered in the calculator.',
    24, y + 10, { maxWidth: W - 48 }
  );
  y += 22;

  const enabledUcs = Object.entries(useCases).filter(([, uc]) => uc.enabled);
  const CARD_W = 270, CARD_GAP = 14;
  const CL_X = 24, CR_X = 24 + CARD_W + CARD_GAP;

  const justLines = ([, uc]) => {
    const j = uc.justification?.trim();
    return j ? doc.splitTextToSize(j, CARD_W - 20) : [];
  };

  for (let i = 0; i < enabledUcs.length; i += 2) {
    const pair = enabledUcs.slice(i, i + 2);
    const heights = pair.map((entry) => {
      const [key, uc] = entry;
      const base = getBaseUcKey(key);
      const defs = UC_DEFS[base] || [];
      const driverMode = uc.driverMode || 'and';
      const activeDriver = uc.activeDriver || 1;
      const cnt  = defs.filter(([, f, type, driver]) => {
        if (uc[f] === undefined) return false;
        if (type === 'custom') return false;
        if (!driver) return true;
        if (driverMode === 'and') return true;
        return driver === activeDriver;
      }).length;
      const jl   = justLines(entry);
      const hasDriverLine = driverMode === 'or' && !!UC_DRIVER_LABELS[base];
      return 12 + 13 + (hasDriverLine ? 11 : 0) + cnt * 11 + 6 + (jl.length ? 10 + jl.length * 8 : 0);
    });
    const rowH = Math.max(...heights, 50);
    pair.forEach((entry, col) => {
      const [key, uc] = entry;
      const base = getBaseUcKey(key);
      const cx   = col === 0 ? CL_X : CR_X;
      const defs = UC_DEFS[base] || [];
      const ucDriverMode   = uc.driverMode || 'and';
      const ucActiveDriver = uc.activeDriver || 1;
      fn('bold', 8); sc(...BLUE);
      doc.text(getUcDisplayName(key) || UC_NAMES[base] || key, cx + 10, y + 14);
      let iy = y + 26;
      // Show "Driver used" label when or-mode
      if (ucDriverMode === 'or' && UC_DRIVER_LABELS[base]) {
        const driverLabel = UC_DRIVER_LABELS[base][ucActiveDriver];
        fn('italic', 7); sc(...GRAY66);
        doc.text(`Driver used: ${driverLabel}`, cx + 10, iy);
        iy += 11;
      }
      defs.forEach(([label, field, type, driver]) => {
        if (uc[field] === undefined) return;
        if (type === 'custom') return;
        // Filter by active driver in 'or' mode
        if (driver && ucDriverMode === 'or' && driver !== ucActiveDriver) return;
        fn('normal', 7); sc(...GRAY99);
        doc.text(`${label}:`, cx + 10, iy);
        fn('bold', 7.5); sc(...NAVY);
        doc.text(fmtVal(uc[field], type), cx + 140, iy);
        iy += 11;
      });
      const jl = justLines(entry);
      if (jl.length) {
        iy += 3;
        sd(...BGBLUE); lw(0.5);
        doc.line(cx + 10, iy, cx + CARD_W - 10, iy);
        iy += 9;
        fn('italic', 7); sc(...GRAY66);
        doc.text(jl, cx + 10, iy);
      }
      sd(...BGBLUE); lw(0.5);
      doc.line(cx, y + rowH, cx + CARD_W, y + rowH);
    });
    y += rowH + 6;
  }

  y += 8;
  sectionHead('INVESTMENT INPUTS', 24, y + 12, W - 24);
  y += 18;

  const invRows = [
    ['CapEx (hardware & installation)',  fmt$(Number(fin.capex) || 0)],
    ['Contingency rate',                 fmtPct(fin.contingencyRate)],
    ['Total CapEx with contingency',     fmt$(result.totalCapex)],
    ['Monthly platform fee',             fmt$(Number(fin.monthlyPlatformFee) || 0)],
    ['Annual platform fee',              fmt$(result.annualSaasFee)],
    ['WACC',                             fmtPct(fin.wacc)],
  ];
  invRows.forEach((row, i) => {
    sf(...(i % 2 === 0 ? WHITE : BGBLUE)); box(0, y, W, 16);
    fn('normal', 7.5); sc(...GRAY66);
    doc.text(row[0], 24, y + 11);
    fn('bold', 8); sc(...NAVY);
    doc.text(row[1], W - 24, y + 11, { align: 'right' });
    y += 16;
  });

  // Footer for page 2
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
