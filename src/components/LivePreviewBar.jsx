import { useRef, useState, useEffect } from 'react';
import { calcUseCaseTotals } from '../utils/calculations';
import { fmt$ } from '../utils/format';

export default function LivePreviewBar({ ops, useCases, fin, customCategories }) {
  const { totalGrossAnnual } = calcUseCaseTotals(useCases, ops, customCategories || [], fin);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleMouseDown(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, []);

  const annualDisplay = fmt$(totalGrossAnnual);

  return (
    <>
      {/* Mobile: fixed bottom bar — Annual Opportunity only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-blue-700 text-white px-4 py-2 shadow-lg">
        <div className="flex justify-center items-center">
          <div className="text-center">
            <p className="text-xs text-blue-200">Annual Opportunity</p>
            <p className="text-sm font-bold">{annualDisplay}</p>
          </div>
        </div>
      </div>

      {/* Desktop: collapsed pill with expandable card */}
      <div
        ref={wrapperRef}
        className="hidden lg:block fixed top-24 right-[calc((100vw-1024px)/2+1rem)] z-30"
      >
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-2 bg-blue-700 text-white rounded-full shadow-lg px-4 py-2 text-sm font-semibold"
        >
          {annualDisplay}
          <svg
            className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="mt-2 w-48 bg-blue-700 text-white rounded-xl shadow-lg p-4">
            <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-2">Live Estimate</p>
            <p className="text-xs text-blue-300">Annual Opportunity</p>
            <p className="text-xl font-bold">{annualDisplay}</p>
          </div>
        )}
      </div>
    </>
  );
}
