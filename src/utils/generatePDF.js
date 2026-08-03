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
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
    });

    // Letter dimensions in pt
    const PDF_W_PT = 612;
    const PDF_H_PT = 792;

    // How many canvas pixels correspond to one PDF point
    const pxPerPt = canvas.width / PDF_W_PT;
    // Canvas pixels per full PDF page height
    const pageHeightPx = PDF_H_PT * pxPerPt;
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

      const imgData = tmp.toDataURL('image/jpeg', 0.85);

      if (page > 0) doc.addPage();
      doc.addImage(imgData, 'JPEG', 0, 0, PDF_W_PT, pageHPt);
    }

    doc.save(fname);
  } finally {
    root.unmount();
    document.body.removeChild(container);
  }
}
