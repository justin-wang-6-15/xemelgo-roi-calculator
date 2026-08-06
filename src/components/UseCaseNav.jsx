import { useState, useEffect, useRef } from 'react';
import { SOLUTIONS, UC_LABELS, UC_LABEL_OVERRIDES } from './steps/Step2_UseCases';
import { getBaseUcKey } from '../utils/calculations';

function getLabel(key) {
  return UC_LABEL_OVERRIDES[key] ?? UC_LABELS[getBaseUcKey(key)] ?? key;
}

export default function UseCaseNav({ useCases, collapsedUCs, setCollapsedUCs }) {
  const [activeKey, setActiveKey] = useState(null);
  const observerRef = useRef(null);
  const rafRef = useRef(null);

  const selectedSolutions = SOLUTIONS.filter((sol) =>
    sol.defaults.some((key) => useCases[key]?.enabled)
  );

  // Stable string dependency — only changes when use cases are enabled/disabled,
  // not on every keypress inside an input field.
  const enabledKeysSorted = selectedSolutions
    .flatMap((sol) => [...sol.defaults, ...sol.extras])
    .filter((key) => useCases[key]?.enabled)
    .sort()
    .join(',');

  useEffect(() => {
    // Clean up any pending RAF from a previous run
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (observerRef.current) observerRef.current.disconnect();

    const keys = enabledKeysSorted ? enabledKeysSorted.split(',') : [];
    if (keys.length === 0) return;

    const visibleEntries = new Map();

    const observer = new IntersectionObserver(
      (observed) => {
        observed.forEach((entry) => {
          visibleEntries.set(entry.target.id, entry);
        });
        // Pick the entry closest to the top of the viewport that is intersecting
        let best = null;
        let bestTop = Infinity;
        visibleEntries.forEach((entry) => {
          if (entry.isIntersecting) {
            const top = entry.boundingClientRect.top;
            if (top >= 0 && top < bestTop) {
              bestTop = top;
              best = entry.target.id.replace('uc-anchor-', '');
            }
          }
        });
        if (best) setActiveKey(best);
      },
      // Watch the upper 60% of the viewport — generous enough to always
      // have at least one card intersecting as the user scrolls
      { threshold: [0, 0.05, 0.1, 0.5], rootMargin: '0px 0px -40% 0px' }
    );

    // Defer one frame so the card DOM elements are fully painted before
    // we try to observe them (the nav mounts before the card list renders)
    rafRef.current = requestAnimationFrame(() => {
      keys.forEach((key) => {
        const el = document.getElementById(`uc-anchor-${key}`);
        if (el) observer.observe(el);
      });
      rafRef.current = null;
    });

    observerRef.current = observer;
    return () => {
      observer.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabledKeysSorted]);

  function handleClick(key) {
    if (collapsedUCs.has(key)) {
      setCollapsedUCs((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      // Two rAFs: first lets React commit the state update (card expands),
      // second lets the browser paint the new height before scrolling —
      // without this the scroll lands short because the card's full height
      // doesn't exist in the layout yet.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          document.getElementById(`uc-anchor-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    } else {
      document.getElementById(`uc-anchor-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  if (selectedSolutions.length === 0) return null;

  return (
    <div className="hidden lg:block sticky top-8 max-h-[calc(100vh-4rem)]">
      <div className="overflow-y-auto max-h-[calc(100vh-4rem)] pr-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Jump to</p>
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
