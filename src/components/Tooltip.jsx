import { useState, useRef, useEffect } from 'react';

export default function Tooltip({ content, children, className = '', position = 'top' }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setVisible(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isBottom = position === 'bottom';
  const bubblePositionClasses = isBottom ? 'top-full mt-2' : 'bottom-full mb-2';
  const arrowPositionClasses = isBottom
    ? 'bottom-full border-b-gray-900'
    : 'top-full border-t-gray-900';

  return (
    <span
      ref={ref}
      className={`relative inline-flex items-center ${className}`.trim()}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onClick={() => setVisible((v) => !v)}
    >
      {children}
      {visible && (
        <span className={`absolute z-50 ${bubblePositionClasses} left-1/2 -translate-x-1/2 w-56 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl pointer-events-none leading-relaxed`}>
          {content}
          <span className={`absolute ${arrowPositionClasses} left-1/2 -translate-x-1/2 border-4 border-transparent`} />
        </span>
      )}
    </span>
  );
}
