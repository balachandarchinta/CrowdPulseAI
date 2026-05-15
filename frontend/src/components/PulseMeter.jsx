import React from 'react';

const PulseMeter = ({ value }) => {
  const radius = 55;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  const delays = [0, 0.1, 0.2, 0.3, 0.05, 0.15, 0.25, 0.35, 0.08, 0.18, 0.28, 0.38, 0.45, 0.55];

  return (
    <div className="glass-card card-cyan pulse-meter">
      <p className="pulse-label">Crowd Roar Intensity</p>

      <div className="pulse-ring-wrap">
        <svg width="140" height="140">
          <circle cx="70" cy="70" r={radius} stroke="rgba(0,242,255,0.1)" strokeWidth="10" fill="none" />
          <circle
            cx="70" cy="70" r={radius}
            stroke="var(--neon-cyan)"
            strokeWidth="10"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transform: 'rotate(-90deg)',
              transformOrigin: '70px 70px',
              transition: 'stroke-dashoffset 1s ease',
              filter: 'drop-shadow(0 0 8px var(--neon-cyan))',
            }}
          />
        </svg>
        <span className="pulse-pct">{Math.round(value)}%</span>
      </div>

      <div className="waveform">
        {delays.map((delay, i) => (
          <div
            key={i}
            className="wave-bar"
            style={{ animationDelay: `${delay}s`, animationDuration: `${0.6 + (i % 3) * 0.2}s` }}
          />
        ))}
      </div>
    </div>
  );
};

export default PulseMeter;
