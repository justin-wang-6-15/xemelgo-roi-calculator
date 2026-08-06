import { useState, useEffect, useRef } from 'react';
import { SOLUTIONS, UC_LABELS, UC_LABEL_OVERRIDES } from './steps/Step2_UseCases';
import { getBaseUcKey } from '../utils/calculations';

function getLabel(key) {
  return UC_LABEL_OVERRIDES[key] ?? UC_LABELS[getBaseUcKey(key)] ?? key;
}

export default function UseCaseNav({ useCases, collapsedUCs, setCollapsedUCs }) {
  const [activeKey, setActiveKey] = useState(null);
  const observerRef = useRef(null);

  const selectedSolutions = SOLUTIONS.filter((sol) =>
    sol.defaults.some((key) => useCases[key]?.enabled)
  );

  const enabledKeysSorted = selectedSolutions
    .flatMap((sol) => [...sol.defaults, ...sol.extras])
    .filter((key) => useCases[key]?.enabled)
    .sort()
    .join(',');

  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    const keys = enabledKeysSorted ? enabledKeysSorted.split(',') : [];
    if (keys.length === 0) return;

    const entries = new Map();

    const observer = new IntersectionObserver(
      (observed) => {
        observed.forEach((entry) => {
          entries.set(entry.target.id, entry);
        });
        let best = null;
        let bestRatio = -1;
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > bestRatio) {
            bestRatio = entry.intersectionRatio;
            best = entry.target.id.replace('uc-anchor-', '');
          }
        });
        if (best) setActiveKey(best);
      },
      { threshold: [0, 0.1, 0.25, 0.5, 1.0], rootMargin: '-10% 0px -60% 0px' }
    );

    keys.forEach((key) => {
      const el = document.getElementById(`uc-anchor-${key}`);
      if (el) observer.observe(el);
    });

    observerRef.current = observer;
    return () => observer.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledKeysSorted]);

  function handleClick(key) {
    if (collapsedUCs.has(key)) {
      setCollapsedUCs((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.getElementById(`uc-anchor-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    } else {
      document.getElementById(`uc-anchor-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  return (
    <div className="hidden lg:block sticky top-8 max-h-[calc(100vh-4rem)]">
      <div className="overflow-y-auto max-h-[calc(100vh-4rem)] pr-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Use Cases</p>
        <div className="space-y-4">
          {selectedSolutions.map((sol) => {
            const visibleKeys = [...sol.defaults, ...sol.extras].filter(
              (key) => useCases[key]?.enabled
            );
            if (visibleKeys.length === 0) return null;
            return (
              <div key={sol.id}>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  {sol.name}
                </p>
                <ul className="space-y-0.5">
                  {visibleKeys.map((key) => {
                    const isActive = activeKey === key;
                    return (
                      <li key={key}>
                        <button
                          onClick={() => handleClick(key)}
                          className={`w-full text-left text-xs px-2 py-1 rounded transition-colors ${
                            isActive
                              ? 'text-blue-600 bg-blue-50 font-medium'
                              : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                          }`}
                        >
                          {getLabel(key)}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
