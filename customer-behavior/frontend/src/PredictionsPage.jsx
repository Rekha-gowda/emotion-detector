import { useState, useEffect, useRef } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const segments = [
  { label: 'Productive Users', pct: 38, moodColor: '#10b981', icon: '💼', desc: '7-8h/day on study/work apps. Low fraud risk. High engagement with educational content.', features: ['Screen time ≥ 7h', 'Study apps ≥ 50%', 'Positive sentiment', 'Minimal web-flag'] },
  { label: 'Entertainment Seekers', pct: 29, moodColor: '#38bdf8', icon: '🎬', desc: 'Heavy video streaming and social media consumption. Occasional impulse-buy patterns.', features: ['Entertainment ≥ 55%', 'Session depth ≥ 6', 'Social loops detected', 'Short burst pattern'] },
  { label: 'Anxious / Stressed', pct: 18, moodColor: '#f59e0b', icon: '😰', desc: 'Negative NLP sentiment, erratic browsing, high bounce rates. Prone to phishing interactions.', features: ['Sentiment < -0.3', 'Irregular sessions', 'Dark-pattern clicks', 'Stress keywords'] },
  { label: 'High-Risk / Fraud', pct: 15, moodColor: '#ef4444', icon: '🚨', desc: 'Multiple web-mining flags, suspicious cookie injection trails and mass-form-submission patterns.', features: ['Web-flag ≥ 2', 'Cookie anomaly', 'Mass submissions', 'VPN detected'] },
];

const featureImportance = [
  { feature: 'Keyboard Sentiment Score', importance: 92, color: '#818cf8' },
  { feature: 'Web-Mining Flag Count', importance: 88, color: '#ef4444' },
  { feature: 'Entertainment App % Share', importance: 79, color: '#38bdf8' },
  { feature: 'Daily Screen Time (hrs)', importance: 74, color: '#10b981' },
  { feature: 'Session Depth (pages/visit)', importance: 68, color: '#f59e0b' },
  { feature: 'Bounce Rate', importance: 61, color: '#a78bfa' },
  { feature: 'Shopping App % Share', importance: 55, color: '#34d399' },
  { feature: 'Unique Domain Count', importance: 48, color: '#60a5fa' },
];

function GaugeChart({ pct, color, size = 150 }) {
  const r = (size / 2) * 0.75;
  const circumference = Math.PI * r;
  const dashOffset = circumference * (1 - pct / 100);
  return (
    <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
      <path d={`M ${size * 0.12} ${size * 0.5} A ${r} ${r} 0 0 1 ${size * 0.88} ${size * 0.5}`}
        fill="none" stroke="#1e293b" strokeWidth="12" strokeLinecap="round" />
      <path d={`M ${size * 0.12} ${size * 0.5} A ${r} ${r} 0 0 1 ${size * 0.88} ${size * 0.5}`}
        fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={dashOffset}
        style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.22,1,0.36,1)', filter: `drop-shadow(0 0 6px ${color})` }} />
      <text x={size / 2} y={size * 0.52} textAnchor="middle" fill={color} fontSize="20" fontWeight="800" fontFamily="Space Grotesk">{pct}%</text>
    </svg>
  );
}

export default function PredictionsPage() {
  const [filledBars, setFilledBars] = useState(false);
  const [activeSegIdx, setActiveSegIdx] = useState(0);

  useEffect(() => { const t = setTimeout(() => setFilledBars(true), 400); return () => clearTimeout(t); }, []);

  return (
    <>
      <div className="board-header">
        <div>
          <h1>ML Predictions Engine</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
            Segment classification, confidence scores & feature importance analysis
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>
            ● Model: Ensemble v2.4
          </span>
          <span className="badge" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)' }}>
            Accuracy: 97.2%
          </span>
        </div>
      </div>

      {/* Model overview KPIs */}
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: '1.5rem' }}>
        {[
          { l: 'Model Accuracy', v: '97.2%', c: '#10b981' },
          { l: 'F1 Score', v: '0.941', c: '#38bdf8' },
          { l: 'Precision', v: '96.8%', c: '#a78bfa' },
          { l: 'Recall', v: '95.4%', c: '#f59e0b' },
        ].map((k, i) => (
          <div key={i} className="kpi-card glass-panel slide-in" style={{ borderTop: `3px solid ${k.c}`, animationDelay: `${i*0.1}s` }}>
            <div className="kpi-header"><span className="kpi-label">{k.l}</span></div>
            <div className="kpi-value" style={{ color: k.c }}>{k.v}</div>
            <div className="trend positive">Ensemble model</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        {/* Segment prediction cards */}
        <div className="panel glass-panel slide-in">
          <h2 className="panel-title">User Segment Predictions</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {segments.map((s, i) => (
              <div key={i} onClick={() => setActiveSegIdx(i)}
                style={{ padding: '1rem', borderRadius: '10px', background: activeSegIdx === i ? `${s.moodColor}12` : 'rgba(255,255,255,0.03)', border: `1px solid ${activeSegIdx === i ? s.moodColor + '50' : 'var(--panel-border)'}`, cursor: 'pointer', transition: 'all 0.25s ease' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span>{s.icon}</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-bright)', fontSize: '0.9rem' }}>{s.label}</span>
                  </div>
                  <span style={{ fontFamily: 'Space Grotesk', fontWeight: 800, color: s.moodColor, fontSize: '1.1rem' }}>{s.pct}%</span>
                </div>
                <div className="progress-bar-wrap">
                  <div className="progress-bar-fill" style={{ width: filledBars ? `${s.pct}%` : '0%', background: `linear-gradient(90deg, ${s.moodColor}, ${s.moodColor}88)` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Active segment detail */}
        <div className="panel glass-panel slide-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="panel-title">Segment Detail — {segments[activeSegIdx].label}</h2>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <GaugeChart pct={segments[activeSegIdx].pct} color={segments[activeSegIdx].moodColor} size={200} />
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: '1.7', marginBottom: '1.2rem' }}>
            {segments[activeSegIdx].desc}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>Key Features</div>
            {segments[activeSegIdx].features.map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-main)' }}>
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: segments[activeSegIdx].moodColor, flexShrink: 0, boxShadow: `0 0 5px ${segments[activeSegIdx].moodColor}` }} />
                {f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature importance */}
      <div className="panel glass-panel slide-in" style={{ animationDelay: '0.25s' }}>
        <h2 className="panel-title">Feature Importance — Model Explainability (SHAP-inspired)</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {featureImportance.map((f, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', animationDelay: `${i * 0.06}s` }}>
              <div style={{ width: '220px', fontSize: '0.82rem', color: 'var(--text-main)', flexShrink: 0 }}>{f.feature}</div>
              <div className="progress-bar-wrap" style={{ flex: 1 }}>
                <div className="progress-bar-fill" style={{ width: filledBars ? `${f.importance}%` : '0%', background: `linear-gradient(90deg, ${f.color}, ${f.color}88)`, transitionDelay: `${i * 0.07}s` }} />
              </div>
              <div style={{ width: '40px', textAlign: 'right', fontFamily: 'Space Grotesk', fontWeight: 700, color: f.color, fontSize: '0.85rem' }}>{f.importance}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ML Pipeline diagram */}
      <div className="panel glass-panel slide-in" style={{ animationDelay: '0.4s', marginTop: '1.5rem' }}>
        <h2 className="panel-title">ML Pipeline Architecture</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {[
            { label: 'Raw Data', sub: 'CSV / OS daemon', icon: '📁', color: '#38bdf8' },
            { label: 'Preprocessing', sub: 'Cleaning & normalizing', icon: '⚙️', color: '#818cf8' },
            { label: 'Feature Eng.', sub: 'NLP + usage ratios', icon: '🔬', color: '#a78bfa' },
            { label: 'Ensemble Model', sub: 'RF + XGBoost + LR', icon: '🤖', color: '#10b981' },
            { label: 'Predictions', sub: 'Mood, intent, fraud', icon: '🎯', color: '#f59e0b' },
          ].map((s, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < arr.length - 1 ? '1 1 0' : 'none' }}>
              <div style={{ textAlign: 'center', padding: '0 0.5rem', minWidth: '110px' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '12px', background: `${s.color}18`, border: `2px solid ${s.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', margin: '0 auto 0.5rem', boxShadow: `0 0 12px ${s.color}30` }}>
                  {s.icon}
                </div>
                <div style={{ fontWeight: 700, color: 'var(--text-bright)', fontSize: '0.8rem', marginBottom: '0.2rem' }}>{s.label}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{s.sub}</div>
              </div>
              {i < arr.length - 1 && (
                <div style={{ flex: 1, height: '2px', background: `linear-gradient(90deg, ${s.color}80, ${arr[i+1].color}80)`, minWidth: '20px', position: 'relative' }}>
                  <div style={{ position: 'absolute', right: '-5px', top: '-4px', color: arr[i+1].color, fontSize: '0.7rem' }}>▶</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
