import jsPDF from 'jspdf';
import { fmt$, fmtPct, fmtWks } from './format';

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
  fasterFulfillment:       'Faster Order Fulfillment',
  misShipReduction:        'Mis-Ship Reduction',
  dockTurnSpeed:           'Receiving and Shipping Throughput',
};

const UC_DEFS = {
  cycleCount:              [['Hours per session','hoursPerSession','n'],['Sessions per week','sessionsPerWeek','n'],['People per session','peoplePerSession','n'],['Burdened rate','burdenedRate','$'],['Reduction','reductionPct','p']],
  audit:                   [['People per audit','people','n'],['Days per audit','daysPerAudit','n'],['Hours per day','hoursPerDay','n'],['Audits per year','auditsPerYear','n'],['Burdened rate','burdenedRate','$'],['Reduction','reductionPct','p']],
  locateItems:             [['Role rows','roleRows','custom']],
  workOrderTracking:       [['Role rows','roleRows','custom']],
  picklistVerification:    [['Picks/day','picksPerDay','n'],['Error rate','errorRate','pct'],['Cost/error','costPerError','$'],['Reduction','reductionPct','p']],
  shipReceiveVerification: [['Min saved/transaction','minutesSavedPerTransaction','n'],['Transactions/day','transactionsPerDay','n'],['Dock staff','dockStaff','n'],['Burdened rate','burdenedRate','$'],['Reduction','reductionPct','p']],
  internalDelivery:        [['Min/transfer','minutesPerTransfer','n'],['Transfers/day','transfersPerDay','n'],['People/transfer','peoplePerTransfer','n'],['Burdened rate','burdenedRate','$'],['Reduction','reductionPct','p']],
  expiredProducts:         [['Incidents per year','incidentsPerYear','n'],['Cost per incident','costPerIncident','$'],['Incident reduction','reductionPct','p']],
  calibrationReminders:    [['Failures per year','failuresPerYear','n'],['Cost per failure','costPerFailure','$'],['Failure reduction','reductionPct','p']],
  geofencing:              [['Incidents per year','incidentsPerYear','n'],['Cost per incident','costPerIncident','$'],['Incident reduction','reductionPct','p']],
  goodsReceipt:            [['Min saved/transaction','minutesSavedPerTransaction','n'],['Transactions/day','transactionsPerDay','n'],['Receiving staff','dockStaff','n'],['Burdened rate','burdenedRate','$'],['Reduction','reductionPct','p']],
  automatedPackCount:      [['Min saved/pack count','minutesSavedPerTransaction','n'],['Pack counts/day','transactionsPerDay','n'],['Staff','dockStaff','n'],['Burdened rate','burdenedRate','$'],['Reduction','reductionPct','p']],
  outboundAudit:           [['Min saved/shipment','minutesSaved','n'],['Outbound shipments/day','transactionsPerDay','n'],['Dock staff','dockStaff','n'],['Burdened rate','burdenedRate','$'],['Reduction','reductionPct','p']],
  returnsTransfers:        [['Min/transfer','minutesPerTransfer','n'],['Transfers/day','transfersPerDay','n'],['People/transfer','peoplePerTransfer','n'],['Burdened rate','burdenedRate','$'],['Reduction','reductionPct','p']],
  inventoryRequests:       [['Hrs/week on requests','hoursPerWeek','n'],['People involved','peopleInvolved','n'],['Burdened rate','burdenedRate','$'],['Reduction','reductionPct','p']],
  shrinkage:               [['Incidents per year','incidentsPerYear','n'],['Cost per incident','costPerIncident','$'],['Incident reduction','reductionPct','p']],
  productionEquipment:     [['Incidents per year','incidentsPerYear','n'],['Cost per incident','costPerIncident','$'],['Incident reduction','reductionPct','p']],
  rtiTracking:             [['Incidents per year','incidentsPerYear','n'],['Cost per incident','costPerIncident','$'],['Incident reduction','reductionPct','p']],
  proofOfDelivery:         [['Claims per year','incidentsPerYear','n'],['Cost per claim','costPerIncident','$'],['Claim reduction','reductionPct','p']],
  fasterFulfillment:       [['Current cycle time (hrs)','currentCycleTime','n'],['Target cycle time (hrs)','targetCycleTime','n'],['Orders per month','ordersPerMonth','n'],['Revenue per order','revenuePerOrder','$']],
  misShipReduction:        [['Mis-ships/month','misShipsPerMonth','n'],['Cost/mis-ship','costPerMisShip','$'],['Reduction','reductionPct','p']],
  dockTurnSpeed:           [['Min saved/transaction','minutesSaved','n'],['Transactions/day','transactionsPerDay','n'],['Dock staff','dockStaff','n'],['Burdened rate','burdenedRate','$'],['Reduction','reductionPct','p']],
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

// Load Inter TTF from locally-bundled files in /public/fonts/.
// Falls back to Helvetica if the fetch fails or the font can't be embedded.
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

// Core drawing function — builds all pages onto `doc` with the given font and logo.
function buildDoc(doc, fontName, logo, ops, useCases, fin, result, contactInfo, customCategories) {
  const company     = ops.companyName?.trim() || 'Your Facility';
  const ctxComp     = contactInfo?.company?.trim() || company;
  const first       = contactInfo?.firstName?.trim() || '';
  const last        = contactInfo?.lastName?.trim() || '';
  const now         = new Date();
  const dateDisplay = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const dateISO     = now.toISOString().slice(0, 10);
  const person      = (first || last) ? `${first} ${last}`.trim() : 'Valued Customer';

  const sf  = (...rgb) => doc.setFillColor(...rgb);
  const sc  = (...rgb) => doc.setTextColor(...rgb);
  const sd  = (...rgb) => doc.setDrawColor(...rgb);
  const lw  = (w)      => doc.setLineWidth(w);
  const box = (x, y, w, h) => doc.rect(x, y, w, h, 'F');
  const fn  = (style = 'normal', size = 9) => { doc.setFont(fontName, style); doc.setFontSize(size); };

  // Layout constants
  const SPINE_W  = 110;
  const CX       = 126;
  const CR       = 588;
  const CW       = CR - CX; // 462pt

  // Decorative muted colors for spine elements
  const SPINEDIV = [50, 65, 90];
  const TICKGRAY = [70, 90, 120];

  function logoOrText(x, y, w, h, fallbackSize = 13) {
    if (logo) {
      try { doc.addImage(logo, 'PNG', x, y, w, h); } catch {}
    } else {
      fn('bold', fallbackSize); sc(...WHITE);
      doc.text('XEMELGO', x, y + h * 0.75);
    }
  }

  function hairline(x1, y, x2, color, weight) {
    sd(...(color || GRAY99)); lw(weight || 0.4);
    doc.line(x1, y, x2, y);
  }

  function sectionHead(label, x, y_text, x_end) {
    fn('bold', 7.5); sc(...NAVY);
    doc.text(label, x, y_text);
    const tw = doc.getTextWidth(label);
    hairline(x + tw + 8, y_text - 4, x_end);
  }

  function footer(pageY = 740) {
    hairline(0, pageY, W, GRAY99, 0.4);
    fn('bold', 6); sc(...GRAY99);
    doc.text('xemelgo', 24, pageY + 16);
    fn('italic', 6.5); sc(...GRAY99);
    doc.text(
      'This analysis is based on inputs provided by the user and Xemelgo customer benchmarks. Actual results may vary.',
      W - 16, pageY + 16, { align: 'right', maxWidth: 380 }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGE 1
  // ─────────────────────────────────────────────────────────────────────────────

  // Left navy spine — full page height
  sf(...NAVY); box(0, 0, SPINE_W, 756);

  // Logo in spine
  logoOrText(16, 20, 60, 18, 8);

  // Stacked eyebrow labels in spine
  fn('normal', 6.5); sc(...LBLUE);
  doc.text('ROI',      55, 54, { align: 'center' });
  doc.text('ANALYSIS', 55, 65, { align: 'center' });
  doc.text('REPORT',   55, 76, { align: 'center' });

  // Thin muted divider below eyebrow
  sd(...SPINEDIV); lw(0.5);
  doc.line(16, 86, 94, 86);

  // Company name — white bold, word-wrapped within spine
  fn('bold', 7.5); sc(...WHITE);
  const compLines = doc.splitTextToSize(ctxComp, 88);
  doc.text(compLines, 55, 100, { align: 'center' });

  // Date — muted gray below company name
  fn('normal', 6); sc(...GRAY99);
  const dateY = 100 + compLines.length * 10;
  doc.text(dateDisplay, 55, dateY, { align: 'center', maxWidth: 88 });

  // Decorative tick marks near bottom of spine
  [698, 710, 722, 734, 746].forEach((ty, i) => {
    const len = i % 2 === 0 ? 8 : 14;
    sd(...TICKGRAY); lw(0.6);
    doc.line(55 - len / 2, ty, 55 + len / 2, ty);
  });

  // ── Hero metric ────────────────────────────────────────────────────────────
  fn('normal', 6.5); sc(...GRAY99);
  doc.text('NET ANNUAL VALUE', CX, 40);

  fn('bold', 38); sc(...NAVY);
  doc.text(fmt$(result.netAnnualValue), CX, 82);

  // Blue accent rule beneath hero number
  sf(...BLUE); box(CX, 87, 26, 2.5);

  // ── Secondary stats (Payback + 5-Year ROI) ────────────────────────────────
  const payStr = result.paybackWeeks ? fmtWks(result.paybackWeeks) : 'N/A';
  const S1X = 432, S2X = 536, DIV_X = 484;

  // Thin vertical hairline divider between secondary stats
  sd(...GRAY99); lw(0.4);
  doc.line(DIV_X, 42, DIV_X, 80);

  fn('normal', 6); sc(...GRAY99);
  doc.text('PAYBACK PERIOD', S1X, 50, { align: 'center' });
  fn('bold', 13); sc(...NAVY);
  doc.text(payStr, S1X, 70, { align: 'center' });

  fn('normal', 6); sc(...GRAY99);
  doc.text('5-YEAR ROI', S2X, 50, { align: 'center' });
  fn('bold', 13); sc(...NAVY);
  doc.text(fmtPct(result.fiveYrRoi - 1), S2X, 70, { align: 'center' });

  // ── Narrative sentence ────────────────────────────────────────────────────
  const npvStr = fmt$(result.npv);
  const SENT_Y = 112;
  fn('normal', 9); sc(...GRAY66);
  const prefix = 'At these inputs, ';
  doc.text(prefix, CX, SENT_Y);
  let sx = CX + doc.getTextWidth(prefix);
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

  // ── "HOW YOU GET THERE" section header ────────────────────────────────────
  sectionHead('HOW YOU GET THERE', CX, 136, CR);

  // ── Full-width bucket bar chart ────────────────────────────────────────────
  const activeBuckets = result.buckets.filter(b => b.subtotal > 0);
  const sortedBuckets = [...activeBuckets].sort((a, b) => b.subtotal - a.subtotal);
  const maxVal = Math.max(...sortedBuckets.map(b => b.subtotal), 1);
  const BAR_H = 15;
  const BUCKET_SPACING = 42;

  let by = 150;
  sortedBuckets.forEach(bucket => {
    const pillColor = BUCKET_COLORS[bucket.name] || NAVY;
    const barW = Math.max(4, Math.round((bucket.subtotal / maxVal) * CW));
    fn('normal', 7.5); sc(...NAVY);
    doc.text(bucket.name, CX, by);
    fn('bold', 7.5); sc(...NAVY);
    doc.text(fmt$(bucket.subtotal), CR, by, { align: 'right' });
    sf(...pillColor); box(CX, by + 4, barW, BAR_H);
    by += BUCKET_SPACING;
  });

  // Hairline after chart
  hairline(CX, by, CR);
  by += 10;

  // ── Condensed itemized use case list ──────────────────────────────────────
  const ROW_H = 11;
  result.buckets.forEach(bucket => {
    if (!bucket.lineItems.length) return;
    bucket.lineItems.forEach(li => {
      fn('normal', 6.5); sc(...GRAY66);
      doc.text(li.name, CX, by);
      doc.text(fmt$(li.annualValue), CR, by, { align: 'right' });
      by += ROW_H;
    });
    hairline(CX, by + 2, CR, GRAY99, 0.3);
    by += 8;
  });

  by += 6;

  // Total Gross Annual — bold NAVY border line above, no fill
  hairline(CX, by - 2, CR, NAVY, 0.6);
  fn('bold', 8); sc(...NAVY);
  doc.text('Total Gross Annual', CX, by + 9);
  doc.text(fmt$(result.totalGrossAnnual), CR, by + 9, { align: 'right' });
  by += 17;

  // Annual Platform Cost — RED text, no fill
  fn('normal', 7.5); sc(...RED);
  doc.text('Annual Platform Cost', CX, by + 9);
  doc.text(`(${fmt$(result.annualSaasFee)})`, CR, by + 9, { align: 'right' });
  by += 15;

  // Net Annual Value — bold BLUE text, BLUE hairlines above and below, no fill
  hairline(CX, by, CR, BLUE, 0.6);
  fn('bold', 8.5); sc(...BLUE);
  doc.text('Net Annual Value', CX, by + 11);
  doc.text(fmt$(result.netAnnualValue), CR, by + 11, { align: 'right' });
  hairline(CX, by + 16, CR, BLUE, 0.6);
  by += 22;

  // ── Investment snapshot strip ─────────────────────────────────────────────
  const INV_TOP = Math.max(by + 22, 660);
  const invW = CW / 3;
  hairline(CX, INV_TOP, CR, GRAY99, 0.5);

  const invItems = [
    { label: 'CapEx',               value: fmt$(Number(fin.capex) || 0) },
    { label: 'Annual Platform Fee',  value: fmt$(result.annualSaasFee)  },
    { label: 'WACC',                 value: fmtPct(fin.wacc)            },
  ];
  invItems.forEach((item, i) => {
    const icx = CX + i * invW + invW / 2;
    fn('normal', 7); sc(...GRAY66);
    doc.text(item.label, icx, INV_TOP + 14, { align: 'center' });
    fn('bold', 10); sc(...NAVY);
    doc.text(item.value, icx, INV_TOP + 30, { align: 'center' });
  });

  // Vertical dividers between investment items
  sd(...GRAY99); lw(0.4);
  doc.line(CX + invW,     INV_TOP + 6, CX + invW,     INV_TOP + 38);
  doc.line(CX + invW * 2, INV_TOP + 6, CX + invW * 2, INV_TOP + 38);
  hairline(CX, INV_TOP + 42, CR, GRAY99, 0.5);

  footer(740);

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGE 2
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

  // Section headers as eyebrow + hairline rule
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

  for (let i = 0; i < enabledUcs.length; i += 2) {
    const pair = enabledUcs.slice(i, i + 2);
    const heights = pair.map(([key, uc]) => {
      const defs = UC_DEFS[key] || [];
      const cnt  = defs.filter(([, f]) => uc[f] !== undefined).length;
      return 12 + 13 + cnt * 11 + 6;
    });
    const rowH = Math.max(...heights, 50);
    pair.forEach(([key, uc], col) => {
      const cx   = col === 0 ? CL_X : CR_X;
      const defs = UC_DEFS[key] || [];
      fn('bold', 8); sc(...BLUE);
      doc.text(UC_NAMES[key] || key, cx + 10, y + 14);
      let iy = y + 26;
      defs.forEach(([label, field, type]) => {
        if (uc[field] === undefined) return;
        if (type === 'custom') return;
        fn('normal', 7); sc(...GRAY99);
        doc.text(`${label}:`, cx + 10, iy);
        fn('bold', 7.5); sc(...NAVY);
        doc.text(fmtVal(uc[field], type), cx + 128, iy);
        iy += 11;
      });
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

  footer(762);

  return dateISO;
}

export async function generatePDF(ops, useCases, fin, result, contactInfo, customCategories) {
  const company = ops.companyName?.trim() || 'Your Facility';
  const logo    = await loadImg('/xemelgo_logo_light.png');

  // First attempt: Inter font loaded from bundled TTF files
  try {
    const doc      = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
    const fontName = await loadInterFont(doc);
    const dateISO  = buildDoc(doc, fontName, logo, ops, useCases, fin, result, contactInfo, customCategories);
    const fname    = `Xemelgo_ROI_Report_${company.replace(/\s+/g, '_')}_${dateISO}.pdf`;
    doc.save(fname);
    return;
  } catch (err) {
    console.error('[generatePDF] First attempt failed (font embedding or save). Retrying with Helvetica fallback.', err);
  }

  // Fallback: rebuild with Helvetica — user still gets a usable PDF
  try {
    const doc     = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
    const dateISO = buildDoc(doc, 'Helvetica', logo, ops, useCases, fin, result, contactInfo, customCategories);
    const fname   = `Xemelgo_ROI_Report_${company.replace(/\s+/g, '_')}_${dateISO}.pdf`;
    doc.save(fname);
  } catch (fallbackErr) {
    console.error('[generatePDF] Helvetica fallback also failed. doc.save() threw:', fallbackErr);
    throw fallbackErr;
  }
}
