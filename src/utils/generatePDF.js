import jsPDF from 'jspdf';
import { fmt$, fmtPct, fmtWks } from './format';

// Brand colors [R, G, B]
const NAVY     = [11,  16,  40 ];  // #0B1028
const BLUE     = [0,   79,  219];  // #004FDB
const LBLUE    = [13,  140, 255];  // #0D8CFF
const BGBLUE   = [237, 245, 255];  // #EDF5FF
const WHITE    = [255, 255, 255];
const RED      = [204, 0,   0  ];  // #CC0000
const GRAY66   = [102, 102, 102];  // #666666
const GRAY99   = [153, 153, 153];  // #999999

const W = 612;

const UNITS_LABEL = {
  '':            'Units Produced Per Month',
  manufacturing: 'Units Produced Per Month',
  aerospace:     'Work Orders Completed Per Month',
  lifesciences:  'Lots or Batches Completed Per Month',
  foodbeverage:  'Cases or Pallets Produced Per Month',
  automotive:    'Vehicles or Assemblies Per Month',
  electronics:   'PCBAs or Assemblies Per Month',
  retail:        'Orders Shipped Per Month',
  other:         'Units or Jobs Per Month',
};

const UC_NAMES = {
  auditCycleCount:        'Audit & Cycle Counting',
  locateItems:            'Locate Items',
  picklistVerification:   'Picklist Verification',
  shipReceiveVerification:'Ship & Receive Verification',
  internalDelivery:       'Internal Delivery Verification',
  expiredProducts:        'Expired Products',
  calibrationReminders:   'Calibration Reminders',
  geofencing:             'Geofencing',
  fasterFulfillment:      'Faster Order Fulfillment',
  misShipReduction:       'Mis-Ship Reduction',
  dockTurnSpeed:          'Receiving and Shipping Throughput',
};

const UC_DEFS = {
  auditCycleCount:        [['Hrs/count','hoursPerCount','n'],['Counts/yr','countsPerYear','n'],['Planners/count','plannersPerCount','n'],['Reduction','reductionPct','p']],
  locateItems:            [['Search min','searchMinutes','n'],['Incidents/day','incidentsPerDay','n'],['Reduction','reductionPct','p']],
  picklistVerification:   [['Picks/day','picksPerDay','n'],['Error rate','errorRate','p'],['Cost/error','costPerError','$'],['Reduction','reductionPct','p']],
  shipReceiveVerification:[['Min/transaction','minutesPerTransaction','n'],['Trans/day','transactionsPerDay','n'],['Dock HC','dockHeadcount','n'],['Reduction','reductionPct','p']],
  internalDelivery:       [['Min/transfer','minutesPerTransfer','n'],['Transfers/day','transfersPerDay','n'],['Headcount','headcount','n'],['Reduction','reductionPct','p']],
  expiredProducts:        [['Incidents/yr','incidentsPerYear','n'],['Cost/incident','costPerIncident','$'],['Reduction','reductionPct','p']],
  calibrationReminders:   [['Failures/yr','failuresPerYear','n'],['Cost/failure','costPerFailure','$'],['Reduction','reductionPct','p']],
  geofencing:             [['Incidents/yr','incidentsPerYear','n'],['Cost/incident','costPerIncident','$'],['Reduction','reductionPct','p']],
  fasterFulfillment:      [['Current cycle (hrs)','currentCycleTime','n'],['Target (hrs)','targetCycleTime','n'],['Orders/mo','ordersPerMonth','n'],['Rev/order','revenuePerOrder','$']],
  misShipReduction:       [['Mis-ships/mo','misShipsPerMonth','n'],['Cost/mis-ship','costPerMisShip','$'],['Reduction','reductionPct','p']],
  dockTurnSpeed:          [['Trans/day','transactionsPerDay','n'],['Delay cost/trans','delayCostPerTransaction','$'],['Savings min/trans','savingsMinutesPerTransaction','n']],
};

function fmtVal(v, type) {
  if (type === '$') return fmt$(v);
  if (type === 'p') return fmtPct(v);
  return String(Number.isInteger(v) ? v : parseFloat(v.toFixed(2)));
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

  const company  = ops.companyName?.trim() || 'Your Facility';
  const ctxComp  = contactInfo?.company?.trim() || company;
  const first    = contactInfo?.firstName?.trim() || '';
  const last     = contactInfo?.lastName?.trim() || '';
  const person   = (first || last) ? `${first} ${last}`.trim() : 'Valued Customer';

  const now        = new Date();
  const dateDisplay= now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const dateISO    = now.toISOString().slice(0, 10);

  const logo = await loadImg('/xemelgo_logo_light.png');

  const sf  = (...rgb) => doc.setFillColor(...rgb);
  const sc  = (...rgb) => doc.setTextColor(...rgb);
  const sd  = (...rgb) => doc.setDrawColor(...rgb);
  const lw  = (w)      => doc.setLineWidth(w);
  const box = (x, y, w, h) => doc.rect(x, y, w, h, 'F');
  const addLogo = (x, y, w, h) => { if (logo) { try { doc.addImage(logo, 'PNG', x, y, w, h); } catch {} } };

  function logoOrText(x, y, w, h, fallbackSize = 13) {
    if (logo) {
      addLogo(x, y, w, h);
    } else {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(fallbackSize);
      sc(...WHITE);
      doc.text('XEMELGO', x, y + h * 0.7);
    }
  }

  function footer(pageY = 762) {
    sf(...NAVY); box(0, pageY, W, 30);
    logoOrText(24, pageY + 8, 56, 14, 8);
    doc.setFont('Helvetica', 'italic'); doc.setFontSize(6.5); sc(...GRAY99);
    doc.text(
      'This analysis is based on inputs provided by the user and Xemelgo customer benchmarks. Actual results may vary.',
      W - 16, pageY + 20, { align: 'right', maxWidth: 380 }
    );
  }

  // ─────────────────────────────────────────────────────────────
  // PAGE 1
  // ─────────────────────────────────────────────────────────────

  // Header (0–80)
  sf(...NAVY); box(0, 0, W, 80);
  logoOrText(24, 24, 120, 32, 16);
  doc.setFont('Helvetica', 'normal'); doc.setFontSize(11); sc(...WHITE);
  doc.text('ROI Analysis Report', W - 24, 28, { align: 'right' });
  doc.setFontSize(9); sc(...LBLUE);
  doc.text(ctxComp, W - 24, 46, { align: 'right' });
  doc.setFontSize(8); sc(...GRAY99);
  doc.text(dateDisplay, W - 24, 62, { align: 'right' });

  // Prepared for (80–108)
  sf(...BGBLUE); box(0, 80, W, 28);
  doc.setFont('Helvetica', 'normal'); doc.setFontSize(9); sc(...NAVY);
  doc.text(`Prepared for: ${person}, ${ctxComp}`, 24, 99);
  doc.setFontSize(8); sc(...BLUE);
  doc.text('Prepared by Xemelgo | xemelgo.com', W - 24, 99, { align: 'right' });

  // Hero metrics (108–218)
  sf(...WHITE); box(0, 108, W, 110);
  sd(...BLUE); lw(3); doc.line(0, 108, W, 108); lw(0.5);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(8); sc(...BLUE);
  doc.text('YOUR ESTIMATED OPPORTUNITY', W / 2, 126, { align: 'center' });

  const metrics3 = [
    { label: 'NET ANNUAL VALUE',  value: fmt$(result.netAnnualValue),            desc: 'Annual savings minus platform cost'     },
    { label: 'PAYBACK PERIOD',    value: result.paybackWeeks ? fmtWks(result.paybackWeeks) : 'N/A', desc: 'Weeks until ROI turns positive' },
    { label: '5-YEAR ROI',        value: fmtPct(result.fiveYrRoi - 1),           desc: 'Total return on full 5-year investment'  },
  ];
  const bw = W / 3;
  metrics3.forEach((m, i) => {
    const cx = i * bw + bw / 2;
    doc.setFont('Helvetica', 'normal'); doc.setFontSize(8); sc(...GRAY99);
    doc.text(m.label, cx, 148, { align: 'center' });
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(28); sc(...NAVY);
    doc.text(m.value, cx, 181, { align: 'center' });
    doc.setFont('Helvetica', 'italic'); doc.setFontSize(7); sc(...GRAY66);
    doc.text(m.desc, cx, 203, { align: 'center' });
  });
  sd(...BGBLUE); lw(1);
  doc.line(204, 113, 204, 213);
  doc.line(408, 113, 408, 213);

  // "How you get there" section header (218–242)
  sf(...BLUE); box(0, 218, W, 24);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9); sc(...WHITE);
  doc.text('HOW YOU GET THERE', 24, 235);

  // Savings table column headers (242–262)
  sf(...BGBLUE); box(0, 242, W, 20);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(8); sc(...NAVY);
  doc.text('USE CASE', 28, 256);
  doc.text('CATEGORY', 270, 256);
  doc.text('ANNUAL VALUE', W - 24, 256, { align: 'right' });

  let ty = 262;
  let alt = false;

  result.buckets.forEach(bucket => {
    if (!bucket.lineItems.length) return;
    bucket.lineItems.forEach(li => {
      sf(...(alt ? BGBLUE : WHITE)); box(0, ty, W, 18);
      doc.setFont('Helvetica', 'normal'); doc.setFontSize(8);
      sc(...NAVY); doc.text(li.name, 28, ty + 13);
      sc(...GRAY66); doc.text(bucket.name, 270, ty + 13);
      sc(...NAVY); doc.text(fmt$(li.annualValue), W - 24, ty + 13, { align: 'right' });
      ty += 18; alt = !alt;
    });
    // Bucket subtotal
    sf(...BGBLUE); box(0, ty, W, 20);
    sd(...BLUE); lw(2); doc.line(W, ty, W, ty + 20); lw(0.5);
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(8);
    sc(...GRAY66); doc.text(`${bucket.name} subtotal`, 28, ty + 14);
    sc(...NAVY);  doc.text(fmt$(bucket.subtotal), W - 24, ty + 14, { align: 'right' });
    ty += 20; alt = false;
  });

  // Total Gross Annual
  sf(...NAVY); box(0, ty, W, 20);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9); sc(...WHITE);
  doc.text('Total Gross Annual', 28, ty + 14);
  doc.text(fmt$(result.totalGrossAnnual), W - 24, ty + 14, { align: 'right' });
  ty += 20;

  // Annual Platform Cost
  sf(...WHITE); box(0, ty, W, 18);
  doc.setFont('Helvetica', 'normal'); doc.setFontSize(8); sc(...RED);
  doc.text('Annual Platform Cost', 28, ty + 13);
  doc.text(`(${fmt$(result.annualSaasFee)})`, W - 24, ty + 13, { align: 'right' });
  ty += 18;

  // Net Annual Value
  sf(...BLUE); box(0, ty, W, 22);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(9); sc(...WHITE);
  doc.text('Net Annual Value', 28, ty + 16);
  doc.text(fmt$(result.netAnnualValue), W - 24, ty + 16, { align: 'right' });

  // Investment snapshot bar (722–762)
  sf(...BGBLUE); box(0, 722, W, 40);
  sd(...BLUE); lw(1); doc.line(0, 762, W, 762);
  const invItems = [
    { label: 'CapEx', value: fmt$(fin.capex) },
    { label: 'Annual Platform Fee', value: fmt$(result.annualSaasFee) },
    { label: 'WACC', value: fmtPct(fin.wacc) },
  ];
  invItems.forEach((item, i) => {
    const cx = i * bw + bw / 2;
    doc.setFont('Helvetica', 'normal'); doc.setFontSize(7); sc(...GRAY66);
    doc.text(item.label, cx, 736, { align: 'center' });
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(9); sc(...NAVY);
    doc.text(item.value, cx, 753, { align: 'center' });
  });
  sd(...BLUE); lw(0.5);
  doc.line(204, 727, 204, 757);
  doc.line(408, 727, 408, 757);

  footer(762);

  // ─────────────────────────────────────────────────────────────
  // PAGE 2
  // ─────────────────────────────────────────────────────────────
  doc.addPage();

  // Header (0–60)
  sf(...NAVY); box(0, 0, W, 60);
  logoOrText(24, 14, 108, 32, 14);
  doc.setFont('Helvetica', 'normal'); doc.setFontSize(11); sc(...WHITE);
  doc.text('Inputs & Assumptions', W - 24, 20, { align: 'right' });
  doc.setFontSize(9); sc(...LBLUE);
  doc.text(ctxComp, W - 24, 36, { align: 'right' });
  doc.setFontSize(8); sc(...GRAY99);
  doc.text('Continued from Page 1', W - 24, 52, { align: 'right' });

  let y = 64;
  const LX = 24, LW = 275, RX = 307, RW = 279;
  const RH = 16; // row height for two-column sections

  // Section headers (side by side)
  sf(...BLUE);
  box(LX, y, LW, 20);
  box(RX, y, RW, 20);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(8); sc(...WHITE);
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
    doc.setFont('Helvetica', 'normal'); doc.setFontSize(7.5); sc(...GRAY66);
    doc.text(String(row[0]), LX + 8, ly + 11);
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(8); sc(...NAVY);
    doc.text(String(row[1]), LX + LW - 8, ly + 11, { align: 'right' });
    ly += RH;
  });

  // Team table: mini-header then 4 data rows
  let ry = y;
  sf(...BGBLUE); box(RX, ry, RW, 14);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(6.5); sc(...GRAY66);
  doc.text('ROLE', RX + 8, ry + 10);
  doc.text('HC', RX + RW * 0.58, ry + 10, { align: 'center' });
  doc.text('RATE / HR', RX + RW - 8, ry + 10, { align: 'right' });
  ry += 14;

  const teamRows = [
    ['Material Handlers',    ops.materialHandlerCount, ops.materialHandlerRate],
    ['Planners',             ops.plannerCount,         ops.plannerRate        ],
    ['Indirect / Leadership',ops.indirectCount,        ops.indirectRate       ],
    ['Direct Employees',     ops.directCount,          ops.directRate         ],
  ];
  teamRows.forEach((row, i) => {
    sf(...(i % 2 === 0 ? WHITE : BGBLUE)); box(RX, ry, RW, RH);
    doc.setFont('Helvetica', 'normal'); doc.setFontSize(7.5); sc(...GRAY66);
    doc.text(String(row[0]), RX + 8, ry + 11);
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(8); sc(...NAVY);
    doc.text(String(row[1]), RX + RW * 0.58, ry + 11, { align: 'center' });
    doc.text(`$${row[2]}/hr`, RX + RW - 8, ry + 11, { align: 'right' });
    ry += RH;
  });

  y = Math.max(ly, ry) + 12;

  // Use Case Assumptions section header
  sf(...BLUE); box(0, y, W, 20);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(8); sc(...WHITE);
  doc.text('USE CASE INPUTS & ASSUMPTIONS', 24, y + 14);
  y += 20;

  doc.setFont('Helvetica', 'italic'); doc.setFontSize(7); sc(...GRAY66);
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

    // Compute row height from the card with more inputs
    const heights = pair.map(([key, uc]) => {
      const defs = UC_DEFS[key] || [];
      const cnt  = defs.filter(([, f]) => uc[f] !== undefined).length;
      return 12 + 13 + cnt * 11 + 6;
    });
    const rowH = Math.max(...heights);

    pair.forEach(([key, uc], col) => {
      const cx = col === 0 ? CL_X : CR_X;
      const defs = UC_DEFS[key] || [];

      // Use case name
      doc.setFont('Helvetica', 'bold'); doc.setFontSize(8); sc(...BLUE);
      doc.text(UC_NAMES[key] || key, cx + 10, y + 14);

      // Inputs
      let iy = y + 26;
      defs.forEach(([label, field, type]) => {
        if (uc[field] === undefined) return;
        doc.setFont('Helvetica', 'normal'); doc.setFontSize(7); sc(...GRAY99);
        doc.text(`${label}:`, cx + 10, iy);
        doc.setFont('Helvetica', 'bold'); doc.setFontSize(7.5); sc(...NAVY);
        doc.text(fmtVal(uc[field], type), cx + 110, iy);
        iy += 11;
      });

      // Bottom border
      sd(...BGBLUE); lw(0.5);
      doc.line(cx, y + rowH, cx + CARD_W, y + rowH);
    });

    y += rowH + 6;
  }

  y += 8;

  // Investment Inputs section
  sf(...BLUE); box(0, y, W, 20);
  doc.setFont('Helvetica', 'bold'); doc.setFontSize(8); sc(...WHITE);
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
    doc.setFont('Helvetica', 'normal'); doc.setFontSize(7.5); sc(...GRAY66);
    doc.text(row[0], 24, y + 11);
    doc.setFont('Helvetica', 'bold'); doc.setFontSize(8); sc(...NAVY);
    doc.text(row[1], W - 24, y + 11, { align: 'right' });
    y += 16;
  });

  footer(762);

  const fname = `Xemelgo_ROI_Report_${company.replace(/\s+/g, '_')}_${dateISO}.pdf`;
  doc.save(fname);
}
