import Tooltip from './Tooltip';
import { getFormulaEntry } from '../utils/formulaDisplay';

function getBaseUcKey(key) {
  return key.split('__')[0];
}

function fmtD(v) {
  return '$' + Math.round(Number(v) || 0).toLocaleString();
}

function DriverBlock({ driver, isOnly }) {
  const dimmed = !driver.enabled;
  return (
    <div className={dimmed ? 'opacity-40' : ''}>
      {!isOnly && (
        <div className="font-semibold text-teal-300 mb-0.5">
          {driver.label}{dimmed ? ' (off)' : ''}
        </div>
      )}
      <ul className="space-y-0.5">
        {driver.lines.map((line, i) => (
          <li key={i} className="text-gray-300">{line}</li>
        ))}
      </ul>
      {!isOnly && (
        <div className="mt-1 text-white font-medium">= {fmtD(driver.subtotal)} / year</div>
      )}
      {driver.note && (
        <div className="mt-1 text-yellow-300 text-[10px] italic leading-snug">{driver.note}</div>
      )}
    </div>
  );
}

export default function FormulaTooltip({ ucKey, uc, ops, fin }) {
  const baseKey = getBaseUcKey(ucKey);
  const entry = getFormulaEntry(baseKey, uc, ops, fin);
  if (!entry) return null;

  const { drivers, total } = entry;
  const customTotal = (uc.customDrivers || []).reduce((s, d) => s + (Number(d.annualValue) || 0), 0);
  const isOnly = drivers.length === 1;

  const content = (
    <div>
      <div className="font-semibold text-white mb-2 border-b border-gray-700 pb-1">
        How this is calculated
      </div>
      <div className="space-y-3">
        {drivers.map((d, i) => (
          <DriverBlock key={i} driver={d} isOnly={isOnly} />
        ))}
      </div>
      {customTotal > 0 && (
        <div className="mt-2 text-gray-300">+ {fmtD(customTotal)} from your custom driver(s)</div>
      )}
      <div className="mt-2 pt-2 border-t border-gray-700 text-white font-semibold">
        = {fmtD(total + customTotal)} / year
      </div>
      <div className="mt-2 text-gray-500 text-[10px] italic">
        Updates automatically as you change the fields below.
      </div>
    </div>
  );

  return (
    <Tooltip content={content} variant="formula" position="bottom">
      <span
        className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-teal-500 text-white text-[11px] italic font-bold cursor-pointer select-none flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
        title="View formula"
      >
        ƒ
      </span>
    </Tooltip>
  );
}
