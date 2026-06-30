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

// Bucket pill colors by name
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
  picklistVerification:    'Picklist Verification',
  shipReceiveVerification: 'Ship & Receive Verification',
  internalDelivery:        'Internal Delivery Verification',
  expiredProducts:         'Expired Products',
  calibrationReminders:    'Calibration Reminders',
  geofencing:              'Geofencing',
  fasterFulfillment:       'Faster Order Fulfillment',
  misShipReduction:        'Mis-Ship Reduction',
  dockTurnSpeed:           'Receiving and Shipping Throughput',
};

// Plain-English field labels
const UC_DEFS = {
  cycleCount:              [['Hours per count','hoursPerCount','n'],['Counts per week','countsPerWeek','n'],['People per count','people','n'],['Burdened rate','burdenedRate','$'],['Efficiency improvement','reductionPct','p']],
  audit:                   [['People per audit','people','n'],['Days per audit','daysPerAudit','n'],['Hours per day','hoursPerDay','n'],['Audits per year','auditsPerYear','n'],['Burdened rate','burdenedRate','$'],['Labor reduction','reductionPct','p']],
  locateItems:             [['Search time (min)','searchMinutes','n'],['Incidents per day','incidentsPerDay','n'],['Efficiency improvement','reductionPct','p']],
  picklistVerification:    [['Picks per day','picksPerDay','n'],['Error rate','errorRate','p'],['Cost per error','costPerError','$'],['Error reduction','reductionPct','p']],
  shipReceiveVerification: [['Minutes per transaction','minutesPerTransaction','n'],['Transactions per day','transactionsPerDay','n'],['Dock headcount','dockHeadcount','n'],['Time reduction','reductionPct','p']],
  internalDelivery:        [['Minutes per transfer','minutesPerTransfer','n'],['Transfers per day','transfersPerDay','n'],['Headcount','headcount','n'],['Time reduction','reductionPct','p']],
  expiredProducts:         [['Incidents per year','incidentsPerYear','n'],['Cost per incident','costPerIncident','$'],['Incident reduction','reductionPct','p']],
  calibrationReminders:    [['Failures per year','failuresPerYear','n'],['Cost per failure','costPerFailure','$'],['Failure reduction','reductionPct','p']],
  geofencing:              [['Incidents per year','incidentsPerYear','n'],['Cost per incident','costPerIncident','$'],['Incident reduction','reductionPct','p']],
  fasterFulfillment:       [['Current cycle time (hrs)','currentCycleTime','n'],['Target cycle time (hrs)','targetCycleTime','n'],['Orders per month','ordersPerMonth','n'],['Revenue per order','revenuePerOrder','$']],
  misShipReduction:        [['Mis-ships per month','misShipsPerMonth','n'],['Cost per mis-ship','costPerMisShip','$'],['Reduction rate','reductionPct','p']],
  dockTurnSpeed:           [['Transactions per day','transactionsPerDay','n'],['Delay cost per transaction','delayCostPerTransaction','$'],['Minutes saved per transaction','savingsMinutesPerTransaction','n']],
};

function fmtVal(v, type) {
  if (type === '$') return fmt$(v);
  if (type === 'p') return fmtPct(v);
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
    const [boldBuf, regBuf] = await Promise.all([
      fetch('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff').then(r => r.arrayBuffer()),
      fetch('https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff').then(r => r.arrayBuffer()),
    ]);
    doc.addFileToVFS('Inter-Bold.ttf', arrayBufferToBase64(boldBuf));
    doc.addFont('Inter-Bold.ttf', 'Inter', 'bold');
    doc.addFileToVFS('Inter-Regular.ttf', arrayBufferToBase64(regBuf));
    doc.addFont('Inter-Regular.ttf', 'Inter', 'normal');
    return 'Inter';
  } catch { return 'Helvetica'; }
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

export async function generatePDF(ops, useCases, fin, result, contactInfo) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });

  const company     = ops.companyName?.trim() || 'Your Facility';
  const ctxComp     = contactInfo?.company?.trim() || company;
  const first       = contactInfo?.firstName?.trim() || '';
  const last        = contactInfo?.lastName?.trim() || '';
  const person      = (first || last) ? `${first} ${last}`.trim() : 'Valued Customer';
  const now         = new Date();
  const dateDisplay = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const dateISO     = now.toISOString().slice(0, 10);

  const [fontName, logo] = await Promise.all([
    loadInterFont(doc),
    loadImg('/xemelgo_logo_light.png'),
  ]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
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

  function footer(pageY = 762) {
    sf(...NAVY); box(0, pageY, W, 30);
    logoOrText(24, pageY + 8, 56, 14, 8);
    fn('italic', 6.5); sc(...GRAY99);
    doc.text(
      'This analysis is based on inputs provided by the user and Xemelgo customer benchmarks. Actual results may vary.',
      W - 16, pageY + 20, { align: 'right', maxWidth: 380 }
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGE 1
  // ─────────────────────────────────────────────────────────────────────────────

  // ── Hero band (0–220, navy) ──────────────────────────────────────────────────
  sf(...NAVY); box(0, 0, W, 220);

  // 6pt blue accent strip at very top
  sf(...BLUE); box(0, 0, W, 6);

  // Logo (left)
  logoOrText(24, 20, 130, 34, 16);

  // Identity (right)
  fn('normal', 11); sc(...WHITE);
  doc.text('ROI Analysis Report', W - 24, 32, { align: 'right' });
  fn('normal', 9); sc(...LBLUE);
  doc.text(ctxComp, W - 24, 48, { align: 'right' });
  fn('normal', 8); sc(...GRAY99);
  doc.text(dateDisplay, W - 24, 63, { align: 'right' });

  // Horizontal rule at y=82
  sd(...BLUE); lw(0.5); doc.line(24, 82, W - 24, 82);

  // Hero metrics (3 columns)
  const bw = W / 3;
  const metrics3 = [
    { label: 'NET ANNUAL VALUE', value: fmt$(result.netAnnualValue),                                 desc: 'Annual savings minus platform cost'    },
    { label: 'PAYBACK PERIOD',   value: result.paybackWeeks ? fmtWks(result.paybackWeeks) : 'N/A',  desc: 'Weeks until ROI turns positive'         },
    { label: '5-YEAR ROI',       value: fmtPct(result.fiveYrRoi - 1),                               desc: 'Total return on full 5-year investment' },
  ];
  metrics3.forEach((m, i) => {
    const cx = i * bw + bw / 2;
    fn('normal', 8); sc(...GRAY99);
    doc.text(m.label, cx, 108, { align: 'center' });
    fn('bold', 44); sc(...WHITE);
    doc.text(m.value, cx, 162, { align: 'center' });
    fn('italic', 7); sc(...GRAY99);
    doc.text(m.desc, cx, 200, { align: 'center' });
  });
  // Column dividers inside hero
  sd(...BGBLUE); lw(0.8);
  doc.line(204, 90, 204, 212);
  doc.line(408, 90, 408, 212);

  // ── Narrative block (222–252) ─────────────────────────────────────────────────
  sf(...WHITE); box(0, 222, W, 30);
  const payStr = result.paybackWeeks ? fmtWks(result.paybackWeeks) : 'N/A';
  const npvStr = fmt$(result.npv);

  // Build inline sentence with bold variables: track x position
  const SENT_Y = 243;
  fn('normal', 9); sc(...GRAY66);
  const prefix = 'At these inputs, ';
  doc.text(prefix, 32, SENT_Y);
  let sx = 32 + doc.getTextWidth(prefix);

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

  // ── Section header bar (254–276) ──────────────────────────────────────────────
  sf(...BLUE); box(0, 254, W, 22);
  fn('bold', 9); sc(...WHITE);
  doc.text('HOW YOU GET THERE', 24, 269);

  // ── Table + Chart zone (278–710) ──────────────────────────────────────────────
  const TABLE_W = 310;
  const CHART_X = 318;
  const CHART_W = 278;

  // Table column headers
  sf(...BGBLUE); box(0, 278, TABLE_W, 20);
  fn('bold', 7.5); sc(...NAVY);
  doc.text('USE CASE', 28, 292);
  doc.text('CATEGORY', 168, 292);
  doc.text('ANNUAL VALUE', TABLE_W - 8, 292, { align: 'right' });

  let ty = 298;
  let alt = false;

  result.buckets.forEach(bucket => {
    if (!bucket.lineItems.length) return;
    const pillColor = BUCKET_COLORS[bucket.name] || NAVY;

    bucket.lineItems.forEach(li => {
      sf(...(alt ? BGBLUE : WHITE)); box(0, ty, TABLE_W, 18);
      // Bucket color pill
      sf(...pillColor); box(20, ty + 6, 5, 6);
      fn('normal', 7.5); sc(...NAVY);
      doc.text(li.name, 30, ty + 13);
      sc(...GRAY66);
      doc.text(bucket.name, 168, ty + 13);
      sc(...NAVY);
      doc.text(fmt$(li.annualValue), TABLE_W - 8, ty + 13, { align: 'right' });
      ty += 18; alt = !alt;
    });

    // Bucket subtotal
    sf(...BGBLUE); box(0, ty, TABLE_W, 19);
    fn('bold', 7.5); sc(...GRAY66);
    doc.text(`${bucket.name} subtotal`, 28, ty + 13);
    sc(...NAVY); doc.text(fmt$(bucket.subtotal), TABLE_W - 8, ty + 13, { align: 'right' });
    ty += 19; alt = false;
  });

  // Total Gross
  sf(...NAVY); box(0, ty, TABLE_W, 20);
  fn('bold', 8.5); sc(...WHITE);
  doc.text('Total Gross Annual', 28, ty + 14);
  doc.text(fmt$(result.totalGrossAnnual), TABLE_W - 8, ty + 14, { align: 'right' });
  ty += 20;

  // Platform Cost
  sf(...WHITE); box(0, ty, TABLE_W, 17);
  fn('normal', 7.5); sc(...RED);
  doc.text('Annual Platform Cost', 28, ty + 12);
  doc.text(`(${fmt$(result.annualSaasFee)})`, TABLE_W - 8, ty + 12, { align: 'right' });
  ty += 17;

  // Net Annual Value
  sf(...BLUE); box(0, ty, TABLE_W, 21);
  fn('bold', 8.5); sc(...WHITE);
  doc.text('Net Annual Value', 28, ty + 15);
  doc.text(fmt$(result.netAnnualValue), TABLE_W - 8, ty + 15, { align: 'right' });

  // ── Horizontal Bar Chart (right side) ─────────────────────────────────────────
  const activeBuckets = result.buckets.filter(b => b.subtotal > 0);
  const maxVal = Math.max(...activeBuckets.map(b => b.subtotal), 1);
  const MAX_BAR_W = 176;
  const BAR_H = 16;
  const BAR_GAP = 6;

  fn('bold', 7); sc(...GRAY66);
  doc.text('SAVINGS BY CATEGORY', CHART_X + CHART_W / 2, 292, { align: 'center' });

  // Sort by subtotal descending
  const sortedBuckets = [...activeBuckets].sort((a, b) => b.subtotal - a.subtotal);
  let cy = 304;
  sortedBuckets.forEach(bucket => {
    const barW = Math.round((bucket.subtotal / maxVal) * MAX_BAR_W);
    const pillColor = BUCKET_COLORS[bucket.name] || NAVY;

    fn('normal', 7); sc(...GRAY66);
    doc.text(bucket.name, CHART_X, cy + BAR_H - 3, { maxWidth: 100 });

    // Bar
    sf(...pillColor); box(CHART_X + 100, cy, barW, BAR_H);

    // Value
    fn('bold', 7); sc(...NAVY);
    doc.text(fmt$(bucket.subtotal), CHART_X + 104 + barW, cy + BAR_H - 3);

    cy += BAR_H + BAR_GAP;
  });

  // ── Investment snapshot strip (712–754) ──────────────────────────────────────
  sf(...BGBLUE); box(0, 712, W, 42);
  sd(...BLUE); lw(0.5); doc.line(0, 712, W, 712);
  const invItems = [
    { label: 'CapEx',               value: fmt$(fin.capex)           },
    { label: 'Annual Platform Fee',  value: fmt$(result.annualSaasFee)},
    { label: 'WACC',                 value: fmtPct(fin.wacc)          },
  ];
  invItems.forEach((item, i) => {
    const cx = i * bw + bw / 2;
    fn('normal', 7); sc(...GRAY66);
    doc.text(item.label, cx, 728, { align: 'center' });
    fn('bold', 9.5); sc(...NAVY);
    doc.text(item.value, cx, 746, { align: 'center' });
  });
  sd(...BGBLUE); lw(0.5);
  doc.line(204, 717, 204, 750);
  doc.line(408, 717, 408, 750);

  footer(762);

  // ─────────────────────────────────────────────────────────────────────────────
  // PAGE 2
  // ─────────────────────────────────────────────────────────────────────────────
  doc.addPage();

  // Header band (0–60)
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

  // Side-by-side section headers
  sf(...BLUE);
  box(LX, y, LW, 20);
  box(RX, y, RW, 20);
  fn('bold', 8); sc(...WHITE);
  doc.text('FACILITY OVERVIEW', LX + 10, y + 14);
  doc.text('TEAM HEADCOUNT & RATES', RX + 10, y + 14);
  y += 20;

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

  // Use Case section header
  sf(...BLUE); box(0, y, W, 20);
  fn('bold', 8); sc(...WHITE);
  doc.text('USE CASE INPUTS & ASSUMPTIONS', 24, y + 14);
  y += 20;

  fn('italic', 7); sc(...GRAY66);
  doc.text(
    'These are the inputs used to calculate your annual opportunity. Values reflect what you entered in the calculator.',
    24, y + 10, { maxWidth: W - 48 }
  );
  y += 22;

  // 2-column card grid
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

  // Investment Inputs
  sf(...BLUE); box(0, y, W, 20);
  fn('bold', 8); sc(...WHITE);
  doc.text('INVESTMENT INPUTS', 24, y + 14);
  y += 20;

  const invRows = [
    ['CapEx (hardware & installation)',  fmt$(fin.capex)],
    ['Contingency rate',                 fmtPct(fin.contingencyRate)],
    ['Total CapEx with contingency',     fmt$(result.totalCapex)],
    ['Monthly platform fee',             fmt$(fin.monthlyPlatformFee)],
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

  const fname = `Xemelgo_ROI_Report_${company.replace(/\s+/g, '_')}_${dateISO}.pdf`;
  doc.save(fname);
}
