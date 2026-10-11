import React from "react";

export default function SliderPanel({
  title,
  subtitle,
  sliders,
  values,
  onChange,
  onReset
}) {
  // Normalize slider values: W_i = u_i / sum(u)
  const sum = sliders.reduce((acc, s) => acc + (Number(values[s.id]) || 0), 0);
  const normalizedPcts = {};
  sliders.forEach((s) => {
    const raw = Number(values[s.id]) || 0;
    normalizedPcts[s.id] = sum > 0 ? Math.round((raw / sum) * 100) : 0;
  });

  return (
    <div className="slider-panel">
      <div className="slider-header">
        <div>
          <h3>{title}</h3>
          <p>{subtitle || "Weights normalize dynamically such that Σ W_i = 100%."}</p>
        </div>
        {onReset && (
          <button type="button" className="btn btn-sm" onClick={onReset}>
            Reset Defaults (70 / 30)
          </button>
        )}
      </div>

      <div className="slider-grid">
        {sliders.map((s) => (
          <div key={s.id} className="slider-control">
            <div className="slider-label-row">
              <span>{s.label}</span>
              <span className="slider-pct">{normalizedPcts[s.id]}% weight</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={values[s.id] ?? s.defaultVal}
              onChange={(e) => onChange(s.id, Number(e.target.value))}
              className="slider-input"
            />
            <div className="slider-subtext">
              Raw value: {values[s.id] ?? s.defaultVal} | {s.desc}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
