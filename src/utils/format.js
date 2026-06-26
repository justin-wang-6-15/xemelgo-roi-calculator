export const fmt$ = (n) => n == null ? 'N/A' : '$' + Math.round(n).toLocaleString();
export const fmtPct = (n) => n == null ? 'N/A' : (n * 100).toFixed(1) + '%';
export const fmtWks = (n) => n == null ? 'N/A' : n.toFixed(1) + ' wks';
export const fmtHrs = (n) => n == null ? 'N/A' : n.toFixed(1) + ' hrs/wk';
