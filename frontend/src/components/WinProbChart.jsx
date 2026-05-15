import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const WinProbChart = ({ data }) => (
  <div className="glass-card card-pink chart-card">
    <p className="chart-label">Win Probability %</p>
    <div className="chart-area">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="winGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#ff2d78" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#ff2d78" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="overs" hide />
          <YAxis domain={[0, 100]} stroke="#334155" fontSize={10} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: '#0d0f1e',
              border: '1px solid rgba(255,45,120,0.4)',
              borderRadius: '8px',
              fontSize: '11px',
            }}
            itemStyle={{ color: '#ff2d78' }}
            labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}
          />
          <Area
            type="monotone"
            dataKey="win_prob"
            stroke="#ff2d78"
            strokeWidth={2.5}
            fill="url(#winGrad)"
            dot={false}
            activeDot={{ r: 4, fill: '#ff2d78', stroke: '#fff', strokeWidth: 2 }}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default WinProbChart;
