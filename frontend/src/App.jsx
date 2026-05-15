import React, { useState, useEffect, useRef, useCallback } from 'react';
import PulseMeter from './components/PulseMeter';
import WinProbChart from './components/WinProbChart';
import LiveCommentary from './components/LiveCommentary';

// ── Polls ──────────────────────────────────────
const POLLS = [
  { q: 'Will India win chasing 185?', opts: ['Yes, easily!', 'Close finish', 'No chance', 'Super over!'] },
  { q: 'MVP of the match?', opts: ['Kohli', 'Rohit', 'Starc', 'Bumrah'] },
  { q: 'Score prediction at 20 overs?', opts: ['180+', '170-180', '160-170', 'Below 160'] },
];

const getEventAlert = (event) => {
  const alerts = {
    W:  { icon: '⚠️', msg: 'WICKET DOWN! Massive shift in momentum — bowling side dominant!', col: '#ff2d78' },
    '6': { icon: '🔥', msg: 'SIX! Out of the stadium! Crowd is on its feet!', col: '#ffb700' },
    '4': { icon: '💥', msg: 'FOUR! Perfect placement, boundary riders had no chance!', col: '#00f2ff' },
    WD: { icon: '🟡', msg: 'Wide delivery — free hit incoming! Batting side advantage.', col: '#9b59ff' },
    NB: { icon: '🔴', msg: 'No ball! Free hit — this could be huge for the batting side!', col: '#9b59ff' },
  };
  return alerts[event] || { icon: '📍', msg: 'Tactical play in progress. Both sides probing.', col: 'rgba(255,255,255,0.4)' };
};

function App() {
  const [matchData, setMatchData]   = useState(null);
  const [history, setHistory]       = useState([]);
  const [status, setStatus]         = useState('connecting');
  const [poll, setPoll]             = useState(POLLS[0]);
  const [votes, setVotes]           = useState({ 0: 34, 1: 28, 2: 22, 3: 16 });
  const [voted, setVoted]           = useState(null);
  const [sentiment, setSentiment]   = useState({ positive: 58, neutral: 27, negative: 15 });
  const ws = useRef(null);
  const reconnectTimer = useRef(null);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;
    ws.current = new WebSocket('ws://localhost:8000/ws/match');

    ws.current.onopen  = () => { setStatus('connected'); clearTimeout(reconnectTimer.current); };
    ws.current.onclose = () => {
      setStatus('disconnected');
      reconnectTimer.current = setTimeout(connect, 3000);
    };
    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setMatchData(data);
      setHistory(prev => {
        const next = [...prev, { ...data }];
        return next.slice(-30);
      });
      // Animate sentiment
      setSentiment({
        positive: Math.min(90, Math.max(20, Math.round(40 + data.win_prob * 0.4 + Math.random() * 8))),
        neutral:  Math.round(15 + Math.random() * 15),
        negative: Math.min(60, Math.max(5,  Math.round(100 - (40 + data.win_prob * 0.4) - 20 + Math.random() * 5))),
      });
    };
  }, []);

  useEffect(() => {
    connect();
    // Rotate poll every 60s
    const pollTimer = setInterval(() => {
      setPoll(prev => {
        const idx = (POLLS.indexOf(prev) + 1) % POLLS.length;
        setVoted(null);
        setVotes({ 0: Math.round(20 + Math.random() * 40), 1: Math.round(15 + Math.random() * 35), 2: Math.round(10 + Math.random() * 30), 3: Math.round(5 + Math.random() * 20) });
        return POLLS[idx];
      });
    }, 60000);
    return () => { ws.current?.close(); clearTimeout(reconnectTimer.current); clearInterval(pollTimer); };
  }, [connect]);

  const handleVote = (idx) => {
    if (voted !== null) return;
    setVoted(idx);
    setVotes(v => ({ ...v, [idx]: v[idx] + 1 }));
  };

  const totalVotes = Object.values(votes).reduce((a, b) => a + b, 0);
  const alert = matchData ? getEventAlert(matchData.event) : null;

  const tickerText = matchData
    ? `CrowdPulse AI · ${matchData.teams} · Score ${matchData.score} (${matchData.overs} ov) · Win Probability: ${matchData.win_prob}% · Crowd Pulse: ${Math.round(matchData.crowd_pulse)}% · ${matchData.description} · Momentum Index: ${Math.round(matchData.momentum)}%`
    : 'CrowdPulse AI · Connecting to live match stream...';

  return (
    <div className="app-shell">
      {/* ── Header ── */}
      <header className="glass-card card-cyan header-bar">
        <div className="header-brand">
          <h1 className="orbitron glow-cyan">CROWDPULSE AI</h1>
          <div className="header-status">
            <span className={`status-dot ${status}`} />
            Live Emotional Analytics · {matchData?.teams || 'India vs Australia'}
            {matchData?.atmosphere && (
              <span className="glow-amber" style={{ marginLeft: '12px', fontSize: '0.7rem' }}>
                ATMOSPHERE: {matchData.atmosphere}
              </span>
            )}
          </div>
        </div>

        <div className="header-score">
          <div>
            <p className="score-label">Score</p>
            <p className="score-value">{matchData?.score || '—'}</p>
          </div>
          <div className="score-divider" />
          <div>
            <p className="score-label">Overs</p>
            <p className="overs-value">{matchData?.overs || '0.0'}</p>
          </div>
          <div className="score-divider" />
          <div>
            <p className="score-label">RRR</p>
            <p className="overs-value" style={{ color: 'var(--neon-amber)' }}>
              {matchData ? (() => {
                const runsLeft = matchData.target - parseInt(matchData.score?.split('/')[0] || 0);
                const [ov, bl] = (matchData.overs || '0.0').split('.').map(Number);
                const oversRemaining = 20 - (ov + (bl || 0) / 6);
                if (runsLeft <= 0) return 'WON';
                if (oversRemaining <= 0) return runsLeft > 0 ? 'LOST' : 'WON';
                const rrr = (runsLeft / oversRemaining);
                return Math.max(0, rrr).toFixed(1);
              })() : '—'}
            </p>
          </div>
        </div>

        <div className="header-target">
          <div style={{ textAlign: 'right' }}>
            <p className="score-label">Target</p>
            <p className="target-value">{matchData?.target || '185'}</p>
          </div>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--neon-pink)" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
          </svg>
        </div>
      </header>

      {/* ── Stats Mini Row ── */}
      <div className="stats-row">
        {[
          { lbl: 'Win Prob', val: `${matchData?.win_prob || '50'}%`, cls: 'glow-pink', card: 'card-pink' },
          { lbl: 'Momentum', val: `${Math.round(matchData?.momentum || 50)}%`, cls: 'glow-cyan', card: 'card-cyan' },
          { lbl: 'Pressure', val: `${Math.round(matchData?.pressure || 30)}%`, cls: 'glow-amber', card: 'card-amber' },
          { lbl: 'Fan Hype',  val: `${Math.round(matchData?.crowd_pulse || 0)}%`, cls: 'glow-green', card: 'card-purple' },
        ].map(s => (
          <div key={s.lbl} className={`glass-card ${s.card} stat-mini`}>
            <p className={`stat-mini-val ${s.cls}`}>{s.val}</p>
            <p className="stat-mini-lbl">{s.lbl}</p>
          </div>
        ))}
      </div>

      {/* ── Main Grid ── */}
      <div className="main-grid">
        {/* Left column */}
        <div className="left-col">
          <PulseMeter value={matchData?.crowd_pulse || 0} />

          {/* Momentum + Pressure */}
          <div className="glass-card card-cyan momentum-card">
            <div className="momentum-row">
              <span className="momentum-label">Batting Momentum</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neon-cyan)' }}>
                {Math.round(matchData?.momentum || 50)}%
              </span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${matchData?.momentum || 50}%` }} />
            </div>

            <div className="pressure-section">
              <div className="momentum-row">
                <span className="pressure-label">Pressure Index</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--neon-pink)' }}>
                  {Math.round(matchData?.pressure || 30)}%
                </span>
              </div>
              <div className="progress-track">
                <div className="progress-fill pink" style={{ width: `${matchData?.pressure || 30}%` }} />
              </div>
            </div>
          </div>

          {/* Fan Sentiment */}
          <div className="glass-card" style={{ borderColor: 'rgba(155,89,255,0.3)', boxShadow: '0 0 20px rgba(155,89,255,0.1)', overflow: 'hidden' }}>
            <p style={{ fontSize: '0.62rem', fontFamily: 'Orbitron', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--neon-purple)', marginBottom: '16px' }}>
              📡 Fan Sentiment Analysis
            </p>
            <div className="sentiment-row">
              <div className="sentiment-card" style={{ border: '1px solid rgba(57,255,20,0.2)', background: 'rgba(57,255,20,0.05)', borderRadius: '12px' }}>
                <div className="sentiment-emoji">🔥</div>
                <div className="sentiment-pct glow-green">{sentiment.positive}%</div>
                <div className="sentiment-lbl">Hyped</div>
              </div>
              <div className="sentiment-card" style={{ border: '1px solid rgba(255,183,0,0.2)', background: 'rgba(255,183,0,0.05)', borderRadius: '12px' }}>
                <div className="sentiment-emoji">😐</div>
                <div className="sentiment-pct glow-amber">{sentiment.neutral}%</div>
                <div className="sentiment-lbl">Neutral</div>
              </div>
              <div className="sentiment-card" style={{ border: '1px solid rgba(255,45,120,0.2)', background: 'rgba(255,45,120,0.05)', borderRadius: '12px' }}>
                <div className="sentiment-emoji">😟</div>
                <div className="sentiment-pct glow-pink">{sentiment.negative}%</div>
                <div className="sentiment-lbl">Worried</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="right-col">
          <div className="right-top">
            <LiveCommentary commentary={matchData?.commentary} history={history} />

          <div className="right-sidebar">
              <WinProbChart data={history} />

              {/* Key Moment Alert */}
              {alert && (
                <div className="glass-card card-pink alert-card">
                  <p className="alert-title">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--neon-pink)" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    Key Moment Alert
                  </p>
                  <div className="alert-badge" style={{ borderColor: `${alert.col}40`, color: alert.col, background: `${alert.col}12` }}>
                    {alert.icon} {alert.msg}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Interactive Poll */}
          <div className="glass-card card-amber poll-card">
            <p className="poll-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--neon-amber)" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
              </svg>
              Live Fan Poll
            </p>
            <p className="poll-question">{poll.q}</p>
            <div className="poll-options">
              {poll.opts.map((opt, i) => {
                const pct = voted !== null ? Math.round((votes[i] / totalVotes) * 100) : null;
                return (
                  <button
                    key={i}
                    className={`poll-option ${voted === i ? 'voted' : ''}`}
                    onClick={() => handleVote(i)}
                    style={{ cursor: voted !== null ? 'default' : 'pointer' }}
                  >
                    {voted !== null && <span className="poll-pct" style={{ color: voted === i ? 'var(--neon-amber)' : 'var(--neon-cyan)' }}>{pct}%</span>}
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>
            {voted !== null && (
              <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', textAlign: 'center' }}>
                {totalVotes.toLocaleString()} fans voted
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Ticker Footer ── */}
      <footer className="glass-card ticker-footer">
        <span className="ticker-live">LIVE</span>
        <div className="ticker-track">
          <span className="ticker-text" key={tickerText.slice(0, 30)}>
            {tickerText} &nbsp;&nbsp;&nbsp; {tickerText}
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
