import React from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import PrintableReport from '../components/PrintableReport';

export async function generatePDF(ops, useCases, fin, result, contactInfo, customCategories) {
  const company  = ops.companyName?.trim() || 'Your Facility';
  const dateISO  = new Date().toISOString().slice(0, 10);
  const fname    = `Xemelgo_ROI_Report_${company.replace(/\s+/g, '_')}_${dateISO}.pdf`;

  const container = document.createElement('div');
  container.style.cssText = 'position:fixed;left:-9999px;top:0;width:800px;background:#ffffff;';
  document.body.appendChild(container);
  const root = createRoot(container);

  try {
    await new Promise((resolve) => {
      root.render(
        React.createElement(PrintableReport, { ops, useCases, fin, result, customCategories, contactInfo })
      );
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    // Measure keep-together blocks while the container is still in the DOM
    const contentEl = container.firstElementChild;
    const containerRect = contentEl.getBoundingClientRect();
    const keepTogetherEls = Array.from(contentEl.querySelectorAll('[data-keep-together]'));

    const canvas = await html2canvas(contentEl, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // Letter dimensions in pt
    const PDF_W_PT    = 612;
    const PDF_H_PT    = 792;
    const MARGIN_X_PT = 51;
    const MARGIN_Y_PT = 45;
    const USABLE_W_PT = PDF_W_PT - 2 * MARGIN_X_PT;
    const USABLE_H_PT = PDF_H_PT - 2 * MARGIN_Y_PT;

    // Empirical scale: canvas pixels per CSS pixel
    const scaleFactor = canvas.width / contentEl.offsetWidth;
    const measuredContentHeightPx = Math.ceil(contentEl.offsetHeight * scaleFactor);
    const effectiveCanvasHeight = Math.min(canvas.height, measuredContentHeightPx);
    const pxPerPt     = canvas.width / USABLE_W_PT;
    const pageHeightPx = USABLE_H_PT * pxPerPt;

    // Map each keep-together element to canvas-pixel coordinates
    const blocks = keepTogetherEls.map((el) => {
      const r = el.getBoundingClientRect();
      return {
        top:    (r.top    - containerRect.top) * scaleFactor,
        bottom: (r.bottom - containerRect.top) * scaleFactor,
      };
    });

    function computeBreaks(canvasHeight, pageHPx, blks) {
      const breaks = [0];
      let cursor = 0;
      while (canvasHeight - cursor > 4) {
        let candidate = Math.min(cursor + pageHPx, canvasHeight);
        for (const b of blks) {
          if (b.top > cursor && b.top < candidate && b.bottom > candidate) {
            candidate = b.top;
          }
        }
        if (candidate <= cursor) candidate = Math.min(cursor + pageHPx, canvasHeight);
        breaks.push(candidate);
        cursor = candidate;
      }
      return breaks;
    }

    const breaks     = computeBreaks(effectiveCanvasHeight, pageHeightPx, blocks);
    const totalPages = breaks.length - 1;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });

    for (let page = 0; page < totalPages; page++) {
      const srcY    = Math.round(breaks[page]);
      const srcH    = Math.round(breaks[page + 1] - breaks[page]);
      const pageHPt = srcH / pxPerPt;

      const tmp    = document.createElement('canvas');
      tmp.width    = canvas.width;
      tmp.height   = srcH;
      tmp.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

      const imgData = tmp.toDataURL('image/png');

      if (page > 0) doc.addPage();
      doc.addImage(imgData, 'PNG', MARGIN_X_PT, MARGIN_Y_PT, USABLE_W_PT, pageHPt);

      doc.setDrawColor(230, 230, 230);
      doc.line(MARGIN_X_PT, PDF_H_PT - 28, PDF_W_PT - MARGIN_X_PT, PDF_H_PT - 28);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.1);
      doc.setTextColor(136, 144, 163);
      doc.text(
        'All figures are calculated based on user provided inputs. Nothing is final until validated.',
        PDF_W_PT / 2,
        PDF_H_PT - 22,
        { align: 'center' }
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Prepared for ${company}`, MARGIN_X_PT, PDF_H_PT - 13);
      doc.text(`Page ${page + 1} of ${totalPages}`, PDF_W_PT / 2, PDF_H_PT - 13, { align: 'center' });
      doc.text('Xemelgo confidential', PDF_W_PT - MARGIN_X_PT, PDF_H_PT - 13, { align: 'right' });
    }

    doc.save(fname);
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}
