import { useState, useEffect } from 'react';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler } from 'chart.js';
ChartJS.register(CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const domains = [
  { name: 'youtube.com', category: 'Entertainment', visits: 1840, pct: 92 },
  { name: 'google.com', category: 'Search', visits: 1620, pct: 81 },
  { name: 'coursera.org', category: 'Education', visits: 980, pct: 49 },
  { name: 'amazon.in', category: 'Shopping', visits: 870, pct: 44 },
  { name: 'github.com', category: 'Study/Dev', visits: 760, pct: 38 },
  { name: 'instagram.com', category: 'Social', visits: 1100, pct: 55 },
  { name: 'flipkart.com', category: 'Shopping', visits: 540, pct: 27 },
  { name: 'stackoverflow.com', category: 'Study/Dev', visits: 680, pct: 34 },
  { name: 'netflix.com', category: 'Entertainment', visits: 920, pct: 46 },
  { name: 'docs.google.com', category: 'Productivity', visits: 430, pct: 22 },
];

const categoryColors = {
  'Entertainment': '#38bdf8', 'Search': '#a78bfa', 'Education': '#10b981',
  'Shopping': '#f59e0b', 'Study/Dev': '#34d399', 'Social': '#f472b6',
  'Productivity': '#60a5fa',
};

const heatmapData = Array.from({ length: 70 }, () => Math.random());
const sessionData = { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  datasets: [{ label: 'Pages/Session', data: [4.2, 5.8, 3.9, 6.1, 7.3, 9.1, 5.4], borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.12)', fill: true, tension: 0.4, pointBackgroundColor: '#38bdf8', pointRadius: 5 },
              { label: 'Bounce Rate %', data: [42, 35, 50, 30, 28, 20, 38], borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.08)', fill: true, tension: 0.4, pointBackgroundColor: '#f59e0b', pointRadius: 5 }]
};

const miningSteps = [
  { icon: '🍪', title: 'Cookie Extraction', desc: 'HTTP cookies and local storage tokens are parsed to establish persistent session identity across domains.' },
  { icon: '🖱️', title: 'Clickstream Analysis', desc: 'Sequences of page visits, dwell times and click coordinates are captured to model navigation patterns.' },
  { icon: '🔗', title: 'Association Rule Mining', desc: 'Apriori algorithm discovers frequent itemsets: e.g. users who visit coursera.org also visit stackoverflow.com.' },
  { icon: '📈', title: 'Sequential Pattern Mining', desc: 'PrefixSpan extracts ordered URL visit sequences to predict the next likely web destination.' },
];

export default function WebMiningPage() {
  const [activeCategory, setActiveCategory] = useState(null);

  const getHeatColor = (v) => {
    if (v > 0.8) return '#38bdf8';
    if (v > 0.6) return '#818cf8';
    if (v > 0.4) return '#10b981';
    if (v > 0.2) return '#f59e0b';
    return '#1e293b';
  };

  const filtered = activeCategory ? domains.filter(d => d.category === activeCategory) : domains;

  return (
    <>
      <div className="board-header">
        <div>
          <h1>Web Usage Mining</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
            Clickstream analysis, URL categorization, association rules & session depth analytics
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {['Entertainment','Education','Shopping','Study/Dev'].map(c => (
            <button key={c} className="badge" onClick={() => setActiveCategory(activeCategory === c ? null : c)}
              style={{ cursor: 'pointer', background: activeCategory === c ? `${categoryColors[c]}30` : 'rgba(255,255,255,0.05)', color: activeCategory === c ? categoryColors[c] : 'var(--text-muted)', border: `1px solid ${activeCategory === c ? categoryColors[c] : 'var(--panel-border)'}50`, transition: 'all 0.2s', padding: '0.35rem 0.7rem', fontSize: '0.75rem', fontWeight: 600 }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* KPI row */}
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        {[
          { l: 'Total Sessions', v: '24,891', c: '#38bdf8', t: '+18% vs last week' },
          { l: 'Avg Pages/Visit', v: '5.4', c: '#10b981', t: 'Session depth' },
          { l: 'Bounce Rate', v: '34.2%', c: '#f59e0b', t: '↓ 6% improvement' },
          { l: 'Unique Domains', v: '1,204', c: '#a78bfa', t: 'Crawled & indexed' },
        ].map((k, i) => (
          <div key={i} className="kpi-card glass-panel slide-in" style={{ borderTop: `3px solid ${k.c}`, animationDelay: `${i*0.1}s` }}>
            <div className="kpi-header"><span className="kpi-label">{k.l}</span></div>
            <div className="kpi-value" style={{ color: k.c }}>{k.v}</div>
            <div className="trend positive">{k.t}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Heatmap */}
        <div className="panel glass-panel slide-in">
          <h2 className="panel-title">URL Category Activity Heatmap</h2>
          <p className="panel-subtitle">Each cell = one minute interval (7×10 grid / last 70 min)</p>
          <div className="heatmap-grid">
            {heatmapData.map((v, i) => (
              <div key={i} className="heatmap-cell" style={{ background: getHeatColor(v) }} title={`Activity: ${(v*100).toFixed(0)}%`} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            <span>Low</span>
            {['#1e293b','#f59e0b','#10b981','#818cf8','#38bdf8'].map((c, i) => (
              <div key={i} style={{ width: '18px', height: '10px', borderRadius: '2px', background: c }} />
            ))}
            <span>High</span>
          </div>
        </div>

        {/* Session chart */}
        <div className="panel glass-panel slide-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="panel-title">Session Depth & Bounce Rate (Weekly)</h2>
          <div style={{ height: '240px', padding: '0.5rem' }}>
            <Line data={sessionData} options={{ responsive: true, maintainAspectRatio: false,
              plugins: { legend: { display: true, labels: { color: '#8b949e', boxWidth: 12 } } },
              scales: { x: { grid:{display:false}, ticks:{color:'#64748b'}, border:{display:false} }, y: { grid:{color:'rgba(255,255,255,0.04)'}, ticks:{color:'#64748b'}, border:{display:false} } } }} />
          </div>
        </div>

        {/* Top Domains table */}
        <div className="panel glass-panel slide-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="panel-title">Top Visited Domains {activeCategory && `— ${activeCategory}`}</h2>
          <div className="table-container" style={{ maxHeight: '300px' }}>
            <table className="table">
              <thead><tr><th>Domain</th><th>Category</th><th>Visits</th><th>Share</th></tr></thead>
              <tbody>
                {filtered.map((d, i) => (
                  <tr key={i}>
                    <td style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.8rem', color: '#38bdf8' }}>{d.name}</td>
                    <td><span className="badge" style={{ background: `${categoryColors[d.category]}18`, color: categoryColors[d.category], border: `1px solid ${categoryColors[d.category]}30` }}>{d.category}</span></td>
                    <td style={{ fontWeight: 700 }}>{d.visits.toLocaleString()}</td>
                    <td style={{ minWidth: '120px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div className="progress-bar-wrap" style={{ flex: 1 }}><div className="progress-bar-fill" style={{ width: `${d.pct}%`, background: categoryColors[d.category] }} /></div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mining Algorithm Steps */}
        <div className="panel glass-panel slide-in" style={{ animationDelay: '0.3s' }}>
          <h2 className="panel-title">Web Mining Algorithm Pipeline</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {miningSteps.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '1rem', padding: '0.8rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--panel-border)', transition: 'all 0.2s', cursor: 'default' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--panel-border)'}>
                <div style={{ fontSize: '1.5rem', flex: '0 0 36px' }}>{s.icon}</div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-bright)', fontSize: '0.87rem', marginBottom: '0.2rem' }}>{s.title}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
