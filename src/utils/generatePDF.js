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
    // Render off-screen
    await new Promise((resolve) => {
      root.render(
        React.createElement(PrintableReport, { ops, useCases, fin, result, customCategories })
      );
      // Two RAF passes: first lets React commit, second lets the browser lay out and paint
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    });

    const canvas = await html2canvas(container.firstElementChild, {
      scale: 1.5,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // Letter dimensions in pt
    const PDF_W_PT   = 612;
    const PDF_H_PT   = 792;
    const MARGIN_PT  = 36; // half-inch margin on all sides
    const USABLE_W_PT = PDF_W_PT - 2 * MARGIN_PT;
    const USABLE_H_PT = PDF_H_PT - 2 * MARGIN_PT;

    // How many canvas pixels correspond to one usable PDF point
    const pxPerPt = canvas.width / USABLE_W_PT;
    // Canvas pixels per full usable page height
    const pageHeightPx = USABLE_H_PT * pxPerPt;
    const totalPages = Math.ceil(canvas.height / pageHeightPx);

    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });

    for (let page = 0; page < totalPages; page++) {
      const srcY    = Math.round(page * pageHeightPx);
      const srcH    = Math.min(Math.round(pageHeightPx), canvas.height - srcY);
      const pageHPt = srcH / pxPerPt;

      // Slice this page's strip into a temp canvas
      const tmp    = document.createElement('canvas');
      tmp.width    = canvas.width;
      tmp.height   = srcH;
      tmp.getContext('2d').drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

      const imgData = tmp.toDataURL('image/jpeg', 0.75);

      if (page > 0) doc.addPage();
      doc.addImage(imgData, 'JPEG', MARGIN_PT, MARGIN_PT, USABLE_W_PT, pageHPt);

      doc.setDrawColor(230, 230, 230);
      doc.line(MARGIN_PT, PDF_H_PT - 28, PDF_W_PT - MARGIN_PT, PDF_H_PT - 28);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Prepared for ${company}`, MARGIN_PT, PDF_H_PT - 16);
      doc.text(`Page ${page + 1} of ${totalPages}`, PDF_W_PT / 2, PDF_H_PT - 16, { align: 'center' });
      doc.text('Xemelgo confidential', PDF_W_PT - MARGIN_PT, PDF_H_PT - 16, { align: 'right' });
    }

    doc.save(fname);
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}
