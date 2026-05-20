import React from 'react';

export function ProgressBar({ value = 0 }) {
  const safe = Math.max(0, Math.min(100, Number(value || 0)));
  return <div className="progress-bar"><div className="progress-fill" style={{ width: `${safe}%` }} /></div>;
}

export function Stat({ icon, label, value }) {
  return <div className="stat-card"><div className="stat-icon">{icon}</div><div><b>{value}</b><span>{label}</span></div></div>;
}

export function Screen({ id, active, children }) {
  return <div id={id} className={`screen ${active ? 'active' : ''}`}>{children}</div>;
}
