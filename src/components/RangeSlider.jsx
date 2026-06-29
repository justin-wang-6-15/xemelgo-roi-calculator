export default function RangeSlider({ min = 0, max = 100, value, onChange, className = '' }) {
  const pct = max === min ? 0 : ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={`slider-custom ${className}`}
      style={{
        background: `linear-gradient(to right, #2563eb ${pct}%, #e5e7eb ${pct}%)`,
      }}
    />
  );
}
