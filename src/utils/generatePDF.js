import jsPDF from 'jspdf';
import { fmt$, fmtPct, fmtWks } from './format';

// Brand constants
const NAVY   = [11, 16, 40];
const BLUE   = [0, 79, 219];
const BG_BLUE = [237, 245, 255];
const GRAY   = [107, 114, 128];
const GRAY_LIGHT = [229, 231, 235];
const RED    = [220, 38, 38];
const WHITE  = [255, 255, 255];

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 36;
const HEADER_H = 86;
const METRICS_H = 54;
const BODY_TOP = 150;
const FOOTER_TOP = 756;
const LEFT_X = 36;
const LEFT_W = 322;
const RIGHT_X = 374;
const RIGHT_W = 202;
const ROW_H = 16;

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

const UC_INPUT_DEFS = {
  auditCycleCount: [
    ['Hours per count', 'hoursPerCount', 'n'],
    ['Counts per year', 'countsPerYear', 'n'],
    ['Planners per count', 'plannersPerCount', 'n'],
    ['Reduction %', 'reductionPct', 'p'],
  ],
  locateItems: [
    ['Search minutes', 'searchMinutes', 'n'],
    ['Incidents per day', 'incidentsPerDay', 'n'],
    ['Reduction %', 'reductionPct', 'p'],
  ],
  picklistVerification: [
    ['Picks per day', 'picksPerDay', 'n'],
    ['Error rate', 'errorRate', 'p'],
    ['Cost per error', 'costPerError', '$'],
    ['Reduction %', 'reductionPct', 'p'],
  ],
  shipReceiveVerification: [
    ['Min per transaction', 'minutesPerTransaction', 'n'],
    ['Transactions per day', 'transactionsPerDay', 'n'],
    ['Dock headcount', 'dockHeadcount', 'n'],
    ['Reduction %', 'reductionPct', 'p'],
  ],
  internalDelivery: [
    ['Min per transfer', 'minutesPerTransfer', 'n'],
    ['Transfers per day', 'transfersPerDay', 'n'],
    ['Headcount', 'headcount', 'n'],
    ['Reduction %', 'reductionPct', 'p'],
  ],
  expiredProducts: [
    ['Incidents per year', 'incidentsPerYear', 'n'],
    ['Cost per incident', 'costPerIncident', '$'],
    ['Reduction %', 'reductionPct', 'p'],
  ],
  calibrationReminders: [
    ['Failures per year', 'failuresPerYear', 'n'],
    ['Cost per failure', 'costPerFailure', '$'],
    ['Reduction %', 'reductionPct', 'p'],
  ],
  geofencing: [
    ['Incidents per year', 'incidentsPerYear', 'n'],
    ['Cost per incident', 'costPerIncident', '$'],
    ['Reduction %', 'reductionPct', 'p'],
  ],
  fasterFulfillment: [
    ['Current cycle time (hrs)', 'currentCycleTime', 'n'],
    ['Target cycle time (hrs)', 'targetCycleTime', 'n'],
    ['Orders per month', 'ordersPerMonth', 'n'],
    ['Revenue per order', 'revenuePerOrder', '$'],
  ],
  misShipReduction: [
    ['Mis-ships per month', 'misShipsPerMonth', 'n'],
    ['Cost per mis-ship', 'costPerMisShip', '$'],
    ['Reduction %', 'reductionPct', 'p'],
  ],
  dockTurnSpeed: [
    ['Transactions per day', 'transactionsPerDay', 'n'],
    ['Delay cost/transaction', 'delayCostPerTransaction', '$'],
    ['Savings min/transaction', 'savingsMinutesPerTransaction', 'n'],
  ],
};

function fmtVal(val, type) {
  if (type === '$') return fmt$(val);
  if (type === 'p') return fmtPct(val);
  return String(Number.isInteger(val) ? val : Math.round(val * 100) / 100);
}

export async function generatePDF(ops, useCases, fin, result) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
  const companyName = ops.companyName?.trim() || 'Your Facility';
  const today = new Date().toISOString().slice(0, 10);

  // Load logo with graceful fallback
  let logoDataUrl = null;
  try {
    const res = await fetch('/xemelgo_logo_light.png');
    if (res.ok) {
      const blob = await res.blob();
      logoDataUrl = await new Promise((resolve) => {
        const fr = new FileReader();
        fr.onloadend = () => resolve(fr.result);
        fr.readAsDataURL(blob);
      });
    }
  } catch (_) { /* use text fallback */ }

  function setColor(rgb) { doc.setTextColor(...rgb); }
  function setFill(rgb) { doc.setFillColor(...rgb); }

  function drawHeader() {
    setFill(NAVY);
    doc.rect(0, 0, PAGE_W, HEADER_H, 'F');
    if (logoDataUrl) {
      try { doc.addImage(logoDataUrl, 'PNG', MARGIN, 18, 108, 50); } catch (_) {}
    } else {
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(16);
      setColor(WHITE);
      doc.text('XEMELGO', MARGIN, 52);
    }
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(13);
    setColor(WHITE);
    doc.text('ROI Analysis Report', PAGE_W - MARGIN, 28, { align: 'right' });
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(companyName, PAGE_W - MARGIN, 46, { align: 'right' });
    doc.setFontSize(8);
    setColor([180, 185, 210]);
    doc.text(today, PAGE_W - MARGIN, 62, { align: 'right' });
  }

  function drawMetricsBar() {
    setFill(BG_BLUE);
    doc.rect(0, HEADER_H, PAGE_W, METRICS_H, 'F');
    const metrics = [
      { label: 'NET ANNUAL VALUE', value: fmt$(result.netAnnualValue) },
      { label: 'PAYBACK PERIOD', value: result.paybackWeeks ? fmtWks(result.paybackWeeks) : 'N/A' },
      { label: '5-YEAR NPV', value: fmt$(result.npv) },
    ];
    const boxW = PAGE_W / 3;
    metrics.forEach((m, i) => {
      const cx = i * boxW + boxW / 2;
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(7.5);
      setColor(BLUE);
      doc.text(m.label, cx, HEADER_H + 16, { align: 'center' });
      doc.setFontSize(17);
      setColor(NAVY);
      doc.text(m.value, cx, HEADER_H + 40, { align: 'center' });
    });
  }

  function drawFooter() {
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, FOOTER_TOP, PAGE_W - MARGIN, FOOTER_TOP);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    setColor(GRAY);
    doc.text('Prepared by Xemelgo | xemelgo.com', MARGIN, FOOTER_TOP + 18);
    doc.setFontSize(7);
    doc.setFont('Helvetica', 'italic');
    doc.text(
      'This analysis is based on inputs provided by the user and Xemelgo customer benchmarks. Actual results may vary.',
      PAGE_W - MARGIN, FOOTER_TOP + 18,
      { align: 'right', maxWidth: 320 }
    );
  }

  // Draw page 1
  drawHeader();
  drawMetricsBar();

  let leftY = BODY_TOP;
  let rightY = BODY_TOP;
  let onSamePage = true; // tracks if left and right are still on same page

  function ensureLeft(needed) {
    if (leftY + needed > FOOTER_TOP - 8) {
      drawFooter();
      doc.addPage();
      drawHeader();
      drawMetricsBar();
      leftY = BODY_TOP;
      if (onSamePage) { rightY = BODY_TOP; }
    }
  }

  function ensureRight(needed) {
    if (rightY + needed > FOOTER_TOP - 8) {
      drawFooter();
      doc.addPage();
      drawHeader();
      drawMetricsBar();
      rightY = BODY_TOP;
      onSamePage = false;
    }
  }

  // ── LEFT COLUMN: Savings Breakdown ────────────────────────────────

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  setColor(BLUE);
  doc.text('Savings Breakdown by Use Case', LEFT_X, leftY);
  leftY += 18;

  // Thin divider
  doc.setDrawColor(...GRAY_LIGHT);
  doc.setLineWidth(0.5);
  doc.line(LEFT_X, leftY, LEFT_X + LEFT_W, leftY);
  leftY += 8;

  let rowAlt = false;
  result.buckets.forEach((bucket) => {
    if (bucket.lineItems.length === 0) return;
    bucket.lineItems.forEach((li) => {
      ensureLeft(ROW_H);
      if (rowAlt) {
        setFill(BG_BLUE);
        doc.rect(LEFT_X, leftY - 11, LEFT_W, ROW_H, 'F');
      }
      rowAlt = !rowAlt;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      setColor([55, 65, 81]);
      doc.text(li.name, LEFT_X + 4, leftY);
      setColor(NAVY);
      doc.text(fmt$(li.annualValue), LEFT_X + LEFT_W - 2, leftY, { align: 'right' });
      leftY += ROW_H;
    });
    // Bucket subtotal
    ensureLeft(ROW_H + 2);
    setFill([243, 244, 246]);
    doc.rect(LEFT_X, leftY - 11, LEFT_W, ROW_H, 'F');
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    setColor(GRAY);
    doc.text(`${bucket.name} subtotal`, LEFT_X + 4, leftY);
    doc.text(fmt$(bucket.subtotal), LEFT_X + LEFT_W - 2, leftY, { align: 'right' });
    leftY += ROW_H + 4;
  });

  // Grand totals
  ensureLeft(ROW_H * 4 + 10);
  doc.setDrawColor(...GRAY_LIGHT);
  doc.line(LEFT_X, leftY - 4, LEFT_X + LEFT_W, leftY - 4);

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  setColor(NAVY);
  doc.text('Total Gross Annual', LEFT_X + 4, leftY + 4);
  doc.text(fmt$(result.totalGrossAnnual), LEFT_X + LEFT_W - 2, leftY + 4, { align: 'right' });
  leftY += ROW_H + 4;

  doc.setFont('Helvetica', 'normal');
  doc.setFontSize(8);
  setColor(RED);
  doc.text('Annual Platform Cost', LEFT_X + 4, leftY);
  doc.text(`(${fmt$(result.annualSaasFee)})`, LEFT_X + LEFT_W - 2, leftY, { align: 'right' });
  leftY += ROW_H + 2;

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(9);
  setColor(BLUE);
  doc.text('Net Annual Value', LEFT_X + 4, leftY);
  doc.text(fmt$(result.netAnnualValue), LEFT_X + LEFT_W - 2, leftY, { align: 'right' });

  // ── RIGHT COLUMN: Your Inputs ───────────────────────────────────

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(10);
  setColor(BLUE);
  doc.text('Your Inputs & Assumptions', RIGHT_X, BODY_TOP);
  rightY = BODY_TOP + 18;

  doc.setDrawColor(...GRAY_LIGHT);
  doc.line(RIGHT_X, rightY, RIGHT_X + RIGHT_W, rightY);
  rightY += 8;

  function rightSectionHeader(title) {
    ensureRight(16 + 6);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7.5);
    setColor(BLUE);
    doc.text(title.toUpperCase(), RIGHT_X, rightY);
    rightY += 13;
  }

  function rightRow(label, value) {
    ensureRight(13);
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(7.5);
    setColor(GRAY);
    doc.text(label, RIGHT_X, rightY);
    setColor(NAVY);
    // Right-align value
    doc.text(String(value), RIGHT_X + RIGHT_W, rightY, { align: 'right', maxWidth: RIGHT_W * 0.55 });
    rightY += 13;
  }

  rightSectionHeader('Facility');
  if (ops.industry) rightRow('Industry', ops.industry);
  rightRow('Work days / week', ops.workDaysPerWeek);
  rightRow('Work weeks / year', ops.workWeeksPerYear);
  rightRow('Shifts / day', ops.shiftsPerDay);
  rightY += 4;

  rightSectionHeader('Team Headcount & Rates');
  const ROLES = [
    ['Material Handlers', 'materialHandlerCount', 'materialHandlerRate'],
    ['Planners', 'plannerCount', 'plannerRate'],
    ['Indirect / Leadership', 'indirectCount', 'indirectRate'],
    ['Direct Employees', 'directCount', 'directRate'],
  ];
  ROLES.forEach(([label, cKey, rKey]) => {
    rightRow(label, `${ops[cKey]} ppl @ $${ops[rKey]}/hr`);
  });
  rightY += 4;

  rightSectionHeader('Investment');
  rightRow('CapEx (hardware)', fmt$(fin.capex));
  rightRow('Contingency', fmtPct(fin.contingencyRate));
  rightRow('Total CapEx', fmt$(result.totalCapex));
  rightRow('Monthly platform fee', fmt$(fin.monthlyPlatformFee));
  rightRow('WACC', fmtPct(fin.wacc));
  rightY += 4;

  rightSectionHeader('Use Case Inputs');
  Object.entries(useCases).forEach(([key, uc]) => {
    if (!uc.enabled) return;
    const defs = UC_INPUT_DEFS[key];
    if (!defs) return;
    ensureRight(12);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(7);
    setColor([75, 85, 99]);
    doc.text(UC_DISPLAY_NAMES[key] || key, RIGHT_X, rightY);
    rightY += 11;
    defs.forEach(([label, field]) => {
      if (uc[field] !== undefined) {
        const type = defs.find(d => d[1] === field)?.[2];
        rightRow(label, fmtVal(uc[field], type));
      }
    });
    rightY += 2;
  });

  drawFooter();

  const filename = `Xemelgo_ROI_Report_${companyName.replace(/\s+/g, '_')}_${today}.pdf`;
  doc.save(filename);
}
