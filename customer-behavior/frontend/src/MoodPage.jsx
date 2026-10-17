import { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

const moods = [
  { id: 'focused',     emoji: '🎯', label: 'Focused',     color: '#6366f1', moodScore: 85, stressScore: 12, study: 55, entertainment: 20, social: 15, shopping: 10, desc: 'Highly concentrated browsing. Low tab-switching, deep reading time on productive domains.' },
  { id: 'productive',  emoji: '💼', label: 'Productive',  color: '#10b981', moodScore: 78, stressScore: 18, study: 60, entertainment: 15, social: 15, shopping: 10, desc: 'Strong work/study signals. Study apps dominate usage. Positive keyboard sentiment.' },
  { id: 'entertained', emoji: '🎬', label: 'Entertained', color: '#38bdf8', moodScore: 70, stressScore: 22, study: 15, entertainment: 55, social: 20, shopping: 10, desc: 'Heavy streaming and social media. Short bursts across many entertainment domains.' },
  { id: 'relaxed',     emoji: '😌', label: 'Relaxed',     color: '#a78bfa', moodScore: 74, stressScore: 14, study: 25, entertainment: 35, social: 25, shopping: 15, desc: 'Low-intensity browsing, long dwell times, reading-heavy pages. Low stress indicators.' },
  { id: 'stressed',    emoji: '😰', label: 'Stressed',    color: '#f59e0b', moodScore: 42, stressScore: 74, study: 20, entertainment: 30, social: 35, shopping: 15, desc: 'Rapid tab-switching, negative NLP sentiment, high bounce rate. Time for a break!' },
  { id: 'anxious',     emoji: '😟', label: 'Anxious',     color: '#ef4444', moodScore: 35, stressScore: 82, study: 15, entertainment: 25, social: 45, shopping: 15, desc: 'Frantic browsing patterns, doom-scrolling detected, high social-news co-visits.' },
  { id: 'angry',       emoji: '😤', label: 'Intense',     color: '#dc2626', moodScore: 30, stressScore: 88, study: 10, entertainment: 20, social: 50, shopping: 20, desc: 'High-frequency keypresses, rapid scroll velocity, aggressive UI interactions detected.' },
  { id: 'happy',       emoji: '😊', label: 'Happy',       color: '#f472b6', moodScore: 90, stressScore: 10, study: 30, entertainment: 40, social: 20, shopping: 10, desc: 'Positive sentiment in typed content, high emoji usage, social sharing activity up.' },
];

const moodHistory7 = [72, 58, 85, 44, 90, 76, 82];
const stressHistory = [22, 38, 15, 65, 10, 28, 18];

function RadarRing({ mood, size = 220 }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setMounted(true), 200); return () => clearTimeout(t); }, [mood]);
  const r = (size / 2) * 0.76;
  const circ = 2 * Math.PI * r;
  const score = 55 + Math.floor(Math.random() * 40);
  const offset = circ - (circ * score) / 100;
  return (
    <div className="mood-ring-wrap" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track rings */}
        {[1.2, 1.0, 0.8].map((s, i) => (
          <circle key={i} cx={size/2} cy={size/2} r={r * s * 0.85} fill="none" stroke={`${mood.color}08`} strokeWidth={i === 1 ? 14 : 2} />
        ))}
        {/* Main ring */}
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={14} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={mood.color} strokeWidth={14}
          strokeLinecap="round" strokeDasharray={circ}
          strokeDashoffset={mounted ? offset : circ}
          style={{ transition: 'stroke-dashoffset 1.6s cubic-bezier(.22,1,.36,1)', filter: `drop-shadow(0 0 12px ${mood.color})` }} />
        {/* Glow dots at ends */}
        <circle cx={size/2} cy={size/2 - r} r={6} fill={mood.color} style={{ filter: `drop-shadow(0 0 8px ${mood.color})`, opacity: mounted ? 1 : 0, transition: 'opacity 0.5s 1s' }} />
      </svg>
      <div className="mood-ring-center">
        <span style={{ fontSize: '3rem', display: 'block', animation: 'float 3s ease-in-out infinite' }}>{mood.emoji}</span>
        <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.1rem', color: mood.color, marginTop: '0.3rem' }}>{mood.label}</div>
        <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.1rem' }}>Current Mood</div>
      </div>
    </div>
  );
}

export default function MoodPage() {
  const [currentMood, setCurrentMood] = useState(moods[0]);
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 100); return () => clearTimeout(t); }, []);

  const moodChartData = {
    labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
    datasets: [
      {
        label: 'Mood Score',
        data: moodHistory7,
        borderColor: currentMood.color,
        backgroundColor: `${currentMood.color}15`,
        fill: true, tension: 0.5, pointRadius: 5,
        pointBackgroundColor: currentMood.color,
        pointBorderColor: 'var(--bg)',
        pointBorderWidth: 2,
      },
      {
        label: 'Stress Level',
        data: stressHistory,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.06)',
        fill: true, tension: 0.5, pointRadius: 4,
        pointBackgroundColor: '#ef4444',
      },
    ],
  };

  const moodScore   = currentMood.moodScore;
  const stressScore  = currentMood.stressScore;

  return (
    <div className={`page-content ${ready ? 'page-enter' : ''}`}>
      {/* Header */}
      <div style={{ padding: '1.2rem 1.2rem 0', background: `linear-gradient(180deg, ${currentMood.color}12 0%, transparent 100%)`, transition: 'background 0.6s ease' }}>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.2rem' }}>
          😊 My Mood Analytics
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>How your web habits reveal your emotional state</p>
      </div>

      {/* Mood ring */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '1rem', paddingBottom: '0.5rem' }}>
        <RadarRing mood={currentMood} size={220} key={currentMood.id} />
      </div>

      {/* Mood desc */}
      <div className="px pb">
        <div style={{ background: `${currentMood.color}10`, border: `1px solid ${currentMood.color}25`, borderRadius: 12, padding: '0.9rem 1rem', fontSize: '0.82rem', color: 'var(--text2)', lineHeight: 1.6, textAlign: 'center' }}>
          <span style={{ color: currentMood.color, fontWeight: 700 }}>AI Analysis: </span>{currentMood.desc}
        </div>
      </div>

      {/* Mood selector grid */}
      <div className="section-head" style={{ paddingBottom: '0.5rem' }}>
        <span className="section-title">🎭 Select / Explore Moods</span>
      </div>
      <div className="px pb">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem' }}>
          {moods.map(m => (
            <button key={m.id} onClick={() => setCurrentMood(m)}
              style={{ padding: '0.7rem 0.4rem', borderRadius: 12, background: currentMood.id === m.id ? `${m.color}20` : 'var(--surface)', border: `1.5px solid ${currentMood.id === m.id ? m.color : 'var(--border)'}`, cursor: 'pointer', transition: 'all 0.25s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: '1.4rem', animation: currentMood.id === m.id ? 'float 2s ease-in-out infinite' : 'none' }}>{m.emoji}</span>
              <span style={{ fontSize: '0.62rem', fontWeight: 700, color: currentMood.id === m.id ? m.color : 'var(--text2)' }}>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Score cards */}
      <div className="px pb">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
          {[
            { label: 'Mood Score', val: moodScore, color: currentMood.color, icon: currentMood.emoji, sub: 'Based on URL patterns' },
            { label: 'Stress Level', val: stressScore, color: stressScore > 50 ? '#ef4444' : '#10b981', icon: stressScore > 50 ? '😰' : '😌', sub: 'NLP + browse velocity' },
          ].map((s, i) => (
            <div key={`${currentMood.id}-${i}`} className="card" style={{ padding: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.4rem' }}>{s.icon}</div>
              <div style={{ fontFamily: 'Space Grotesk', fontSize: '2rem', fontWeight: 900, color: s.color, lineHeight: 1, transition: 'color 0.4s ease' }}>{s.val}</div>
              <div style={{ fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text3)', marginBottom: '0.4rem' }}>{s.label}</div>
              <div className="prog-bar" style={{ marginTop: '0.4rem' }}>
                <div className="prog-bar-fill" style={{ width: `${s.val}%`, background: s.color, transition: 'width 0.8s cubic-bezier(.22,1,.36,1)' }} />
              </div>
              <div style={{ fontSize: '0.63rem', color: 'var(--text2)', marginTop: '0.3rem' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Mood + Stress chart */}
      <div className="px pb">
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>📈 Mood vs Stress (7 Days)</div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span className="chip" style={{ background: `${currentMood.color}15`, color: currentMood.color, border: `1px solid ${currentMood.color}30`, fontSize: '0.6rem' }}>Mood</span>
              <span className="chip" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', fontSize: '0.6rem' }}>Stress</span>
            </div>
          </div>
          <div style={{ height: 180 }}>
            <Line data={moodChartData} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 10 } }, border: { display: false } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569', font: { size: 10 } }, border: { display: false }, min: 0, max: 100 } } }} />
          </div>
        </div>
      </div>

      {/* Usage breakdown for selected mood */}
      <div className="px pb">
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)', marginBottom: '0.8rem' }}>📊 Usage Pattern — {currentMood.label} Mode</div>
          {[
            { label: 'Study / Work',    val: currentMood.study,         color: '#10b981', icon: '📚' },
            { label: 'Entertainment',   val: currentMood.entertainment,  color: '#38bdf8', icon: '🎬' },
            { label: 'Social Media',    val: currentMood.social,         color: '#a78bfa', icon: '💬' },
            { label: 'Shopping',        val: currentMood.shopping,       color: '#f59e0b', icon: '🛒' },
          ].map((row, i) => (
            <div key={i} style={{ marginBottom: '0.65rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>{row.icon} {row.label}</span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: row.color }}>{row.val}%</span>
              </div>
              <div className="prog-bar">
                <div className="prog-bar-fill" style={{ width: `${row.val}%`, background: row.color, transition: 'width 0.9s cubic-bezier(.22,1,.36,1)', transitionDelay: `${i * 0.06}s` }} />
              </div>
            </div>
          ))}
          <div style={{ fontSize: '0.65rem', color: 'var(--text3)', textAlign: 'right', marginTop: '0.3rem' }}>
            Total: {currentMood.study + currentMood.entertainment + currentMood.social + currentMood.shopping}%
          </div>
        </div>
      </div>

      {/* Mood triggers */}
      <div className="section-head" style={{ paddingBottom: '0.5rem' }}>
        <span className="section-title">⚡ Mood Triggers Detected</span>
      </div>
      <div className="px pb">
        <div className="card">
          {[
            { icon: '🎬', trigger: 'Long YouTube sessions', effect: '+Entertained', effectColor: '#38bdf8' },
            { icon: '📰', trigger: 'News doom-scrolling', effect: '+Stressed', effectColor: '#f59e0b' },
            { icon: '📚', trigger: 'Coursera study sessions', effect: '+Focused', effectColor: '#6366f1' },
            { icon: '🛒', trigger: 'Shopping after 8 PM', effect: 'Impulse Risk', effectColor: '#ef4444' },
            { icon: '💬', trigger: 'Social media > 1h', effect: '+Anxious', effectColor: '#ef4444' },
            { icon: '🎵', trigger: 'Music streaming breaks', effect: '+Relaxed', effectColor: '#a78bfa' },
          ].map((t, i) => (
            <div key={i} className="activity-row">
              <div className="activity-icon" style={{ background: 'var(--surface2)' }}>{t.icon}</div>
              <div className="activity-info">
                <div className="activity-name">{t.trigger}</div>
                <div className="activity-meta">Detected pattern</div>
              </div>
              <span className="chip" style={{ background: `${t.effectColor}15`, color: t.effectColor, border: `1px solid ${t.effectColor}30` }}>{t.effect}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
