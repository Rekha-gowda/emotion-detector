import { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Filler } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Filler);

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const categories = [
  { key: 'study',         label: 'Study/Work',    color: '#10b981', icon: '📚' },
  { key: 'entertainment', label: 'Entertainment',  color: '#38bdf8', icon: '🎬' },
  { key: 'social',        label: 'Social Media',   color: '#a78bfa', icon: '💬' },
  { key: 'shopping',      label: 'Shopping',       color: '#f59e0b', icon: '🛒' },
];


function make30Days() {
  return Array.from({ length: 35 }, (_, i) => ({ v: Math.random(), day: i }));
}

const topSites = [
  { icon: '🎬', name: 'youtube.com',    time: '—', pct: 0, color: '#ef4444', cat: 'Entertainment' },
  { icon: '📚', name: 'coursera.org',   time: '—', pct: 0, color: '#10b981', cat: 'Education' },
  { icon: '🐦', name: 'twitter.com',    time: '—', pct: 0, color: '#38bdf8', cat: 'Social' },
  { icon: '💻', name: 'github.com',     time: '—', pct: 0, color: '#a78bfa', cat: 'Development' },
  { icon: '🛒', name: 'amazon.in',      time: '—', pct: 0, color: '#f59e0b', cat: 'Shopping' },
  { icon: '📰', name: 'reddit.com',     time: '—', pct: 0, color: '#f97316', cat: 'Social' },
  { icon: '🎵', name: 'spotify.com',    time: '—', pct: 0, color: '#1ed760', cat: 'Entertainment' },
  { icon: '📖', name: 'medium.com',     time: '—', pct: 0, color: '#6366f1', cat: 'Education' },
];

function getHeatColor(v) {
  if (v > 0.85) return '#10b981';
  if (v > 0.65) return '#38bdf8';
  if (v > 0.45) return '#6366f1';
  if (v > 0.25) return '#a78bfa';
  if (v > 0.05) return 'rgba(99,102,241,0.2)';
  return 'rgba(255,255,255,0.05)';
}

export default function BehaviourPage() {
  const [week, setWeek] = useState([]);
  const [days30] = useState(make30Days);
  const [selectedDay, setSelectedDay] = useState(6); // default = today (last item)
  const [activeTab, setActiveTab] = useState('week');
  const [filled, setFilled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/week?user_id=default`)
      .then(r => r.json())
      .then(data => {
        setWeek(data.days || []);
        setLoading(false);
        setTimeout(() => setFilled(true), 300);
      })
      .catch(() => setLoading(false));
  }, []);

  const day = week[selectedDay] || {};
  const isLogged = Boolean(day.study || day.entertainment || day.social || day.shopping);


  const labels = week.map(d => d.day_label || '—');

  const screenTimeData = {
    labels,
    datasets: [{
      label: 'Screen Time (hrs)',
      data: week.map(d => parseFloat(d.screen_time) || 0),
      backgroundColor: week.map((_, i) => i === selectedDay ? '#6366f1' : 'rgba(99,102,241,0.25)'),
      borderRadius: 8, borderSkipped: false,
    }],
  };

  const usageTrendData = {
    labels,
    datasets: categories.map(c => ({
      label: c.label,
      data: week.map(d => d[c.key] || 0),
      borderColor: c.color,
      backgroundColor: `${c.color}12`,
      fill: false, tension: 0.45, pointRadius: 4, pointBackgroundColor: c.color,
    })),
  };

  const chartOpts = {
    responsive: true, maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 11 } }, border: { display: false } },
      y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#475569', font: { size: 11 } }, border: { display: false } },
    },
  };

  return (
    <div className="page-content page-enter">
      {/* Header */}
      <div style={{ padding: '1.2rem 1.2rem 0.5rem', background: 'linear-gradient(180deg, rgba(56,189,248,0.07) 0%, transparent 100%)' }}>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.2rem' }}>
          📈 My Behaviour History
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text2)', lineHeight: 1.5 }}>
          Your personal web usage patterns, site rankings & screen time over time.
        </p>
      </div>

      {/* Tab selector */}
      <div className="px" style={{ paddingTop: '0.8rem' }}>
        <div style={{ display: 'flex', background: 'var(--surface)', borderRadius: 'var(--radius-sm)', padding: '3px', gap: '3px' }}>
          {['week', 'month', 'sites'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)}
              style={{ flex: 1, padding: '0.5rem', borderRadius: 8, fontWeight: 700, fontSize: '0.78rem', border: 'none', cursor: 'pointer', transition: 'all 0.2s', background: activeTab === t ? 'var(--accent)' : 'transparent', color: activeTab === t ? 'white' : 'var(--text2)' }}>
              {t === 'week' ? '📅 Weekly' : t === 'month' ? '🗓️ Monthly' : '🌐 Sites'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'week' && (
        <>
          {loading ? (
            <div style={{ textAlign:'center', padding:'2rem', color:'var(--text2)', fontSize:'0.85rem' }}>Loading week data…</div>
          ) : (
          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'space-between' }}>
            {week.map((d, i) => (
              <div key={i} onClick={() => setSelectedDay(i)} style={{ flex: 1, textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ width: '100%', paddingBottom: '100%', position: 'relative', borderRadius: 10, background: i === selectedDay ? 'var(--accent)' : 'var(--surface)', border: `1.5px solid ${i === selectedDay ? 'var(--accent)' : 'var(--border)'}`, transition: 'all 0.2s', marginBottom: 3 }}>
                  <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem' }}>
                    {(d.study || d.entertainment || d.social || d.shopping) ? (d.mood?.emoji || '○') : '○'}
                  </span>
                </div>
                <div style={{ fontSize: '0.58rem', color: i === selectedDay ? 'var(--accent)' : 'var(--text3)', fontWeight: 600 }}>{d.day_label}</div>
              </div>
            ))}
          </div>
          )}

          {/* Selected day detail */}
          <div className="px" style={{ paddingTop: '0.8rem' }}>
            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text)' }}>{day.day_label || '—'}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text2)' }}>⏱️ {day.screen_time || 0}h screen time</div>
                </div>
                <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.8rem' }}>{isLogged ? (day.mood?.emoji || '○') : '○'}</div>
              </div>
              {!isLogged ? (
                <div style={{ textAlign:'center', padding:'0.8rem 0', color:'var(--text2)', fontSize:'0.82rem' }}>No activity logged for this day.<br/><span style={{ fontSize:'0.72rem', color:'var(--text3)' }}>Use Home → + button to log today.</span></div>
              ) : (
                categories.map(c => (
                  <div key={c.key} style={{ marginBottom: '0.6rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>{c.icon} {c.label}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: c.color }}>{day[c.key] || 0}%</span>
                    </div>
                    <div className="prog-bar">
                      <div className="prog-bar-fill" style={{ width: filled ? `${day[c.key] || 0}%` : '0%', background: c.color }} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Screen time bar chart */}
          <div className="px" style={{ paddingTop: '0.8rem' }}>
            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)', marginBottom: '0.8rem' }}>⏱️ Screen Time per Day</div>
              <div style={{ height: 140 }}>
                <Bar data={screenTimeData} options={{ ...chartOpts, scales: { ...chartOpts.scales, y: { ...chartOpts.scales.y, max: 12 } } }} />
              </div>
            </div>
          </div>

          {/* Multi-line trend */}
          <div className="px" style={{ paddingTop: '0.8rem', paddingBottom: '0.5rem' }}>
            <div className="card" style={{ padding: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)' }}>📊 Usage Category Trends</div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {categories.map(c => (
                    <span key={c.key} className="chip" style={{ background: `${c.color}15`, color: c.color, border: `1px solid ${c.color}30`, fontSize: '0.6rem', padding: '0.15rem 0.45rem' }}>{c.icon}</span>
                  ))}
                </div>
              </div>
              <div style={{ height: 160 }}>
                <Line data={usageTrendData} options={{ ...chartOpts, plugins: { legend: { display: false } } }} />
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'month' && (
        <div className="px" style={{ paddingTop: '1rem' }}>
          <div className="card" style={{ padding: '1rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.5rem', color: 'var(--text)' }}>🗓️ 30-Day Activity Heatmap</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text2)', marginBottom: '0.8rem' }}>Colour = usage intensity (green = productive)</div>
            <div className="heatmap-grid">
              {days30.map((d, i) => (
                <div key={i} className="heat-cell" style={{ background: getHeatColor(d.v) }}
                  title={`Day ${i+1}: ${Math.round(d.v * 100)}% activity`} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem', alignItems: 'center', fontSize: '0.65rem', color: 'var(--text3)' }}>
              <span>Less</span>
              {['rgba(255,255,255,0.05)','rgba(99,102,241,0.2)','#a78bfa','#6366f1','#38bdf8','#10b981'].map((c, i) => (
                <div key={i} style={{ width: 14, height: 14, borderRadius: 3, background: c }} />
              ))}
              <span>More</span>
            </div>
            <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              {[
                { label: 'Most Productive Day', val: 'Tuesday', icon: '🏆', color: '#10b981' },
                { label: 'Avg. Screen Time', val: '6.2h / day', icon: '⏱️', color: '#38bdf8' },
                { label: 'Longest Streak', val: '9 days focused', icon: '🔥', color: '#f59e0b' },
                { label: 'Peak Usage Hour', val: '10 AM – 12 PM', icon: '⚡', color: '#6366f1' },
              ].map((s, i) => (
                <div key={i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '0.7rem' }}>
                  <div style={{ fontSize: '1.1rem', marginBottom: '0.2rem' }}>{s.icon}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text2)', marginBottom: '0.15rem' }}>{s.label}</div>
                  <div style={{ fontWeight: 800, color: s.color, fontFamily: 'Space Grotesk', fontSize: '0.88rem' }}>{s.val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sites' && (
        <div className="px" style={{ paddingTop: '1rem', paddingBottom: '0.5rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)', marginBottom: '0.8rem' }}>🌐 Top Sites Visited Today</div>
          <div className="card">
            {topSites.map((s, i) => (
              <div key={i} className="activity-row">
                <div style={{ width: 28, fontWeight: 800, fontFamily: 'Space Grotesk', color: 'var(--text3)', fontSize: '0.82rem' }}>#{i+1}</div>
                <div className="activity-icon" style={{ background: `${s.color}15` }}>{s.icon}</div>
                <div className="activity-info">
                  <div className="activity-name">{s.name}</div>
                  <div style={{ marginTop: '3px' }}>
                    <div className="prog-bar" style={{ height: 4 }}>
                      <div className="prog-bar-fill" style={{ width: filled ? `${s.pct}%` : '0%', background: s.color, transitionDelay: `${i * 0.05}s` }} />
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="activity-time">{s.time}</div>
                  <div style={{ fontSize: '0.63rem', color: s.color, fontWeight: 700 }}>{s.cat}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
