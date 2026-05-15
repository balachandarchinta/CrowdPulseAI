import React, { useState } from 'react';

const LiveCommentary = ({ commentary, history }) => {
  const [lang, setLang] = useState('en');

  const langs = [
    { code: 'en', label: 'EN' },
    { code: 'hi', label: 'हिं' },
    { code: 'ta', label: 'தமி' },
  ];

  return (
    <div className="glass-card card-purple commentary-card" style={{ flex: 1 }}>
      <div className="commentary-header">
        <span className="commentary-title">⚡ AI Live Commentary</span>
        <div className="lang-pills">
          {langs.map(l => (
            <button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`lang-pill ${lang === l.code ? 'active' : ''}`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      <div className="commentary-body">
        {history && history.slice(-6).reverse().map((item, i) => (
          <div key={i} className="commentary-line" style={{ opacity: 1 - i * 0.15 }}>
            <span className="commentary-dot">●</span>
            <p className="commentary-text">
              {item.commentary?.[lang] || item.description || '—'}
            </p>
          </div>
        ))}
        {(!history || history.length === 0) && (
          <div className="commentary-line">
            <span className="commentary-dot" style={{ color: 'rgba(155,89,255,0.4)' }}>○</span>
            <p className="commentary-text" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Waiting for match to begin...
            </p>
          </div>
        )}
      </div>

      <div className="commentary-footer">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        AI analysis powered by Gemini 2.0 Flash · CrowdPulse AI
      </div>
    </div>
  );
};

export default LiveCommentary;
