import React, { useState, useEffect, useRef, useCallback } from 'react';
import PulseMeter from './components/PulseMeter';
import WinProbChart from './components/WinProbChart';
import LiveCommentary from './components/LiveCommentary';

// ── Match context ────────────────────────────────────────────────────────────
const TEAM1 = { name: 'CSK', full: 'Chennai Super Kings',    color: '#f7b731', abbr: 'CSK' };
const TEAM2 = { name: 'LSG', full: 'Lucknow Super Giants',   color: '#00b4d8', abbr: 'LSG' };
const MATCH_INFO = { tournament: 'TATA IPL 2026', match: '59th Match · Ekana Cricket Stadium' };

const POLLS = [
  { q: 'Will CSK successfully chase the target?', opts: ['Yes, easily!', 'Close finish', 'No chance', 'Super over!'] },
  { q: 'Who is your MVP so far?', opts: ['MS Dhoni', 'Rishabh Pant', 'Mitchell Marsh', 'Mohammed Shami'] },
  { q: 'CSK\'s predicted final score?', opts: ['180+', '170-180', '160-170', 'Below 160'] },
];

const getEventAlert = (event) => {
  const alerts = {
    W:   { icon: '⚠️', msg: 'WICKET! The game shifts — LSG take control!',      col: '#ff2d78' },
    '6': { icon: '🔥', msg: 'SIX! Into the upper tier! CSK crowd goes wild!',   col: '#f7b731' },
    '4': { icon: '💥', msg: 'FOUR! Raced away to the boundary!',                col: '#00f2ff' },
    WD:  { icon: '🟡', msg: 'Wide! Free hit coming. CSK fans on their feet!',   col: '#9b59ff' },
    NB:  { icon: '🔴', msg: 'No ball! FREE HIT! The pressure is immense!',      col: '#9b59ff' },
  };
  return alerts[event] || { icon: '📍', msg: 'Tactical battle — both sides probing.',  col: 'rgba(255,255,255,0.4)' };
};

function App() {
  const [matchData, setMatchData]   = useState(null);
  const [history, setHistory]       = useState([]);
  const [status, setStatus]         = useState('connecting');
  const [poll, setPoll]             = useState(POLLS[0]);
  const [votes, setVotes]           = useState({ 0: 34, 1: 28, 2: 22, 3: 16 });
  const [voted, setVoted]           = useState(null);
  const [sentiment, setSentiment]   = useState({ positive: 68, neutral: 22, negative: 10 });
  const ws = useRef(null);
  const reconnectTimer = useRef(null);

  const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/match';

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;
    ws.current = new WebSocket(WS_URL);
    ws.current.onopen  = () => { setStatus('connected'); clearTimeout(reconnectTimer.current); };
    ws.current.onclose = () => {
      setStatus('disconnected');
      reconnectTimer.current = setTimeout(connect, 3000);
    };
    ws.current.onmessage = (e) => {
      const data = JSON.parse(e.data);
      setMatchData(data);
      setHistory(prev => [...prev, data].slice(-30));
      setSentiment({
        positive: Math.min(90, Math.max(20, Math.round(40 + data.win_prob * 0.4 + Math.random() * 8))),
        neutral:  Math.round(15 + Math.random() * 15),
        negative: Math.min(55, Math.max(5, Math.round(100 - (40 + data.win_prob * 0.4) - 20))),
      });
    };
  }, [WS_URL]);

  useEffect(() => {
    connect();
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

  // Compute RRR
  const computeRRR = () => {
    if (!matchData) return '—';
    const runsScored = parseInt(matchData.score?.split('/')[0] || 0);
    const runsLeft   = matchData.target - runsScored;
    if (runsLeft <= 0) return 'WON 🏆';
    const [ov, bl] = (matchData.overs || '0.0').split('.').map(Number);
    const oversLeft = 20 - (ov + (bl || 0) / 6);
    if (oversLeft <= 0) return 'LOST';
    return Math.max(0, runsLeft / oversLeft).toFixed(1);
  };

  const tickerText = matchData
    ? `IPL 2026 · ${MATCH_INFO.match} · CSK: ${matchData.score} (${matchData.overs} ov) · Target: ${matchData.target} · RRR: ${computeRRR()} · Win Prob: ${matchData.win_prob}% · ${matchData.description}`
    : 'CrowdPulse AI · Connecting to live match stream...';

  return (
    <div className="app-shell">
      {/* ── Header ── */}
      <header className="glass-card card-cyan header-bar">
        {/* Brand */}
        <div className="header-brand">
          <h1 className="orbitron glow-cyan">CROWDPULSE AI</h1>
          <div className="header-status">
            <span className={`status-dot ${status}`} />
            {MATCH_INFO.tournament} · {MATCH_INFO.match}
            {matchData?.atmosphere && (
              <span className="glow-amber" style={{ marginLeft: 12, fontSize: '0.7rem' }}>
                {matchData.atmosphere}
              </span>
            )}
          </div>
        </div>

        {/* Teams + Score */}
        <div className="header-score">
          {/* Team 1 */}
          <div style={{ textAlign: 'center' }}>
            <p className="score-label" style={{ color: TEAM1.color }}>{TEAM1.name}</p>
            <p className="score-value" style={{ color: TEAM1.color, textShadow: `0 0 20px ${TEAM1.color}88` }}>
            {(matchData?.score || '—').split('/').map((part, i, arr) => (
              <React.Fragment key={i}>
                {part}
                {i < arr.length - 1 && <span style={{ margin: '0 8px', opacity: 0.5 }}>/</span>}
              </React.Fragment>
            ))}
            </p>
          </div>
          <div className="score-divider" />
          {/* Overs + RRR */}
          <div style={{ textAlign: 'center' }}>
            <p className="score-label">Overs</p>
            <p className="overs-value">{matchData?.overs || '0.0'}</p>
            <p style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'Orbitron', marginTop: 4 }}>
              RRR <span style={{ color: '#f7b731' }}>{computeRRR()}</span>
            </p>
          </div>
          <div className="score-divider" />
          {/* Team 2 */}
          <div style={{ textAlign: 'center' }}>
            <p className="score-label" style={{ color: TEAM2.color }}>{TEAM2.name}</p>
            <p className="target-value" style={{ color: TEAM2.color, textShadow: `0 0 20px ${TEAM2.color}88` }}>
              {matchData?.target || '185'}
            </p>
            <p style={{ fontSize: '0.58rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'Orbitron', marginTop: 4 }}>TARGET</p>
          </div>
        </div>

        {/* Venue */}
        <div className="header-target" style={{ flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span style={{ fontSize: '0.6rem', fontFamily: 'Orbitron', color: 'rgba(255,255,255,0.3)', letterSpacing: 2, textTransform: 'uppercase' }}>Venue</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Ekana Cricket</span>
          <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)' }}>Lucknow</span>
        </div>
      </header>

      {/* ── Stats Mini Row ── */}
      <div className="stats-row">
        {[
          { lbl: 'Win Prob',  val: `${matchData?.win_prob || 50}%`,               cls: 'glow-pink',   card: 'card-pink'   },
          { lbl: 'Momentum',  val: `${Math.round(matchData?.momentum || 50)}%`,   cls: 'glow-cyan',   card: 'card-cyan'   },
          { lbl: 'Pressure',  val: `${Math.round(matchData?.pressure || 30)}%`,   cls: 'glow-amber',  card: 'card-amber'  },
          { lbl: 'Fan Hype',  val: `${Math.round(matchData?.crowd_pulse || 0)}%`, cls: 'glow-green',  card: 'card-purple' },
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
              <span className="momentum-label">CSK Batting Momentum</span>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: TEAM1.color }}>{Math.round(matchData?.momentum || 50)}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${matchData?.momentum || 50}%`, background: `linear-gradient(90deg, #a07000, ${TEAM1.color})`, boxShadow: `0 0 10px ${TEAM1.color}88` }} />
            </div>

            <div className="pressure-section">
              <div className="momentum-row">
                <span className="pressure-label">LSG Bowling Pressure</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: TEAM2.color }}>{Math.round(matchData?.pressure || 30)}%</span>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${matchData?.pressure || 30}%`, background: `linear-gradient(90deg, #005580, ${TEAM2.color})`, boxShadow: `0 0 10px ${TEAM2.color}88` }} />
              </div>
            </div>
          </div>

          {/* Fan Sentiment */}
          <div className="glass-card" style={{ borderColor: 'rgba(155,89,255,0.3)', boxShadow: '0 0 20px rgba(155,89,255,0.1)', overflow: 'hidden' }}>
            <p style={{ fontSize: '0.62rem', fontFamily: 'Orbitron', textTransform: 'uppercase', letterSpacing: '2px', color: 'var(--neon-purple)', marginBottom: '16px' }}>
              📡 Fan Sentiment Analysis
            </p>
            <div className="sentiment-row">
              {[
                { emoji: '🔥', pct: sentiment.positive, lbl: 'CSK Hyped',  cls: 'glow-green', border: 'rgba(57,255,20,0.2)', bg: 'rgba(57,255,20,0.05)'   },
                { emoji: '😐', pct: sentiment.neutral,  lbl: 'Neutral',    cls: 'glow-amber', border: 'rgba(255,183,0,0.2)', bg: 'rgba(255,183,0,0.05)'  },
                { emoji: '😟', pct: sentiment.negative, lbl: 'LSG Fans',   cls: 'glow-pink',  border: 'rgba(255,45,120,0.2)',bg: 'rgba(255,45,120,0.05)' },
              ].map(s => (
                <div key={s.lbl} className="sentiment-card" style={{ border: `1px solid ${s.border}`, background: s.bg, borderRadius: 12 }}>
                  <div className="sentiment-emoji">{s.emoji}</div>
                  <div className={`sentiment-pct ${s.cls}`}>{s.pct}%</div>
                  <div className="sentiment-lbl">{s.lbl}</div>
                </div>
              ))}
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
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
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

          {/* Fan Poll */}
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
                    {pct !== null && (
                      <span className="poll-pct" style={{ color: voted === i ? 'var(--neon-amber)' : 'var(--neon-cyan)' }}>
                        {pct}%
                      </span>
                    )}
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
            {tickerText} &nbsp;&nbsp;&nbsp;◆&nbsp;&nbsp;&nbsp; {tickerText}
          </span>
        </div>
      </footer>
    </div>
  );
}

export default App;
