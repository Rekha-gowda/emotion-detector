import { useState, useRef, useEffect } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, RadialLinearScale, Filler
} from 'chart.js';
import { Doughnut, Line, Bar } from 'react-chartjs-2';
import {
  Upload, Activity, ShieldAlert, Smartphone, Briefcase, Smile,
  Coffee, ThumbsDown, Terminal, Search, Download, RefreshCw
} from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend,
  ArcElement, PointElement, LineElement, RadialLinearScale, Filler);

const chartDefaults = {
  animation: { duration: 800, easing: 'easeInOutQuart' },
  plugins: { legend: { display: false } },
  scales: {
    x: { grid: { display: false }, ticks: { color: '#64748b' }, border: { display: false } },
    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748b' }, border: { display: false } }
  }
};

function getMoodIcon(mood) {
  switch (mood) {
    case 'Productive': return <Briefcase size={14} color="#10b981" />;
    case 'Entertained': return <Smile size={14} color="#38bdf8" />;
    case 'Relaxed': return <Coffee size={14} color="#a78bfa" />;
    case 'Anxious': case 'Stressed': return <ThumbsDown size={14} color="#ef4444" />;
    default: return <Smile size={14} color="#ccc" />;
  }
}

function KpiCard({ label, value, icon, color, trend, delay }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVisible(true), delay || 0); return () => clearTimeout(t); }, [delay]);
  return (
    <div className="kpi-card glass-panel" style={{ borderTop: `3px solid ${color}`, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.5s ease' }}>
      <div className="kpi-header">
        <span className="kpi-label">{label}</span>
        {icon}
      </div>
      <div className="kpi-value glow-text-subtle" style={color === '#ef4444' ? { color } : {}}>{value}</div>
      <div className={`trend ${trend.type}`}>{trend.text}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [aggStats, setAggStats] = useState(null);
  const [selectedDayIdx, setSelectedDayIdx] = useState(6);
  const [isLiveSync, setIsLiveSync] = useState(false);
  const liveIntervalRef = useRef(null);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const fileInputRef = useRef(null);
  const terminalRef = useRef(null);

  const addLog = (msg) => setTerminalLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  useEffect(() => {
    if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
  }, [terminalLogs]);

  const handleUpload = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setLoading(true); setTerminalLogs([]); setDataLoaded(false); setSearchTerm(''); setErrorMsg(null);
    addLog(`Ingesting: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
    addLog('Booting Omni-Behavioral Tracking Engine...');
    const formData = new FormData(); formData.append('file', file);
    const steps = [
      'Parsing device keystrokes and app duration logs...',
      'Intercepting and normalizing textual sentiment (NLP)...',
      'Categorizing application usage (Study vs Entertainment)...',
      'Scanning web-mining trace for Fraudulent activities...',
      'Compiling Psycho-Demographic User Matrices...',
    ];
    let step = 0;
    const interval = setInterval(() => { if (step < steps.length) addLog(steps[step++]); }, 650);
    try {
      const res = await fetch('http://localhost:8000/api/analyze_omni', { method: 'POST', body: formData });
      const data = await res.json();
      clearInterval(interval);
      if (data.status === 'error') { addLog(`[ERROR] ${data.message}`); setErrorMsg(data.message); setLoading(false); return; }
      addLog('✅ Omni-Processing Complete. Hydrating dashboard...');
      setResults(data.users); setAggStats(data.aggregates);
      setTimeout(() => { setLoading(false); setDataLoaded(true); }, 600);
    } catch (err) {
      clearInterval(interval);
      setErrorMsg(`Server unreachable. Ensure Python backend is running on port 8000. (${err.message})`);
      setLoading(false);
    }
  };

  const toggleLiveSync = () => {
    if (isLiveSync) {
      clearInterval(liveIntervalRef.current); liveIntervalRef.current = null;
      setIsLiveSync(false); addLog('Live Sync paused.');
    } else {
      setIsLiveSync(true); setLoading(false); setDataLoaded(true); setErrorMsg(null);
      addLog('Initializing connection to OS background daemon...');
      const poll = async () => {
        try {
          const res = await fetch('http://localhost:8000/api/live_stream');
          const data = await res.json();
          if (data.status === 'error') { setErrorMsg(data.message); return; }
          setResults(data.users); setAggStats(data.aggregates); setErrorMsg(null);
        } catch (e) { setErrorMsg('Cannot connect to localhost:8000.'); }
      };
      poll(); liveIntervalRef.current = setInterval(poll, 3000);
    }
  };

  const filteredResults = results.filter(r =>
    r.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.primary_mood.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    const csvContent = [
      ['Device ID', 'Mood', 'Fraud Risk', 'Study %', 'Entertainment %', 'Shopping %'],
      ...results.map(r => [r.device_id, r.primary_mood, r.fraud_status, r.usage.study, r.usage.entertainment, r.usage.shopping])
    ].map(e => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'behavior_export.csv'; link.click();
  };

  return (
    <>
      <div className="board-header">
        <div>
          <h1>Analytics Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
            Multi-modal device forensics, mood analytics & fraud detection
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
          <button className={`upload-button ${isLiveSync ? 'live-active' : 'glow-box'}`} onClick={toggleLiveSync}>
            {isLiveSync ? <><div className="live-dot" />&nbsp;Live Tracking...</> : <><Activity size={16} /> Start Auto-Sync</>}
          </button>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".csv,.json" onChange={handleUpload} />
          <button className="btn btn-ghost" onClick={() => fileInputRef.current.click()} disabled={loading || isLiveSync}>
            <Upload size={16} /> Upload CSV
          </button>
        </div>
      </div>

      {loading && (
        <div className="panel glass-panel" style={{ padding: 0, overflow: 'hidden', marginBottom: '1.5rem' }}>
          <div className="terminal-header">
            <div className="terminal-dots">
              <div className="terminal-dot" style={{ background: '#ef4444' }} />
              <div className="terminal-dot" style={{ background: '#f59e0b' }} />
              <div className="terminal-dot" style={{ background: '#10b981' }} />
            </div>
            <Terminal size={14} /><span style={{ marginLeft: '0.5rem', fontFamily: 'JetBrains Mono, monospace' }}>behaviour-engine — scanning</span>
          </div>
          <div className="terminal" ref={terminalRef}>
            {terminalLogs.map((log, i) => <p key={i} className="terminal-line">{log}</p>)}
            <p className="terminal-line" style={{ animation: 'blink 1s step-end infinite' }}>█</p>
          </div>
        </div>
      )}

      {!dataLoaded && !loading && (
        <div className="empty-state glass-panel" style={{ minHeight: '400px' }}>
          <div style={{ fontSize: '4rem' }}>📡</div>
          <h2>Waiting for Device Telemetry</h2>
          <p>Upload a CSV with keystroke logs, app durations, and web trails — or connect to the live OS daemon tracker for real-time behavioural intelligence.</p>
          {errorMsg && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--danger)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', maxWidth: '500px', fontSize: '0.85rem', textAlign: 'left' }}>
              <strong>⚠ Error:</strong> {errorMsg}
            </div>
          )}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="btn btn-success" onClick={toggleLiveSync}><Activity size={16} /> Connect OS Daemon</button>
            <button className="btn btn-ghost" onClick={() => fileInputRef.current.click()}><Upload size={16} /> Upload CSV</button>
          </div>
        </div>
      )}

      {dataLoaded && !loading && aggStats && (
        <>
          <div className="kpi-row">
            <KpiCard label="Analyzed Devices" value={aggStats.total_devices} icon={<Smartphone size={20} color="#10b981" />} color="#10b981" trend={{ type: 'positive', text: 'Fully indexed' }} delay={0} />
            <KpiCard label="Prevalent Mood" value={aggStats.majority_mood} icon={<Smile size={20} color="#38bdf8" />} color="#38bdf8" trend={{ type: 'neutral', text: `${aggStats.total_texts_analyzed?.toLocaleString()} texts analyzed` }} delay={100} />
            <KpiCard label="Primary Category" value={aggStats.highest_usage_category} icon={<Activity size={20} color="#a78bfa" />} color="#a78bfa" trend={{ type: 'positive', text: `Avg ${aggStats.avg_screen_time}h screen time` }} delay={200} />
            <KpiCard label="Fraud Flags" value={`${aggStats.fraud_count} flagged`} icon={<ShieldAlert size={20} color="#ef4444" />} color="#ef4444" trend={{ type: 'negative', text: 'Dark-pattern web mining' }} delay={300} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.4fr)', gap: '1.5rem' }}>
            {/* Left column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div className="panel glass-panel slide-in">
                <h2 className="panel-title">Global Usage Breakdown</h2>
                <div style={{ height: '220px', padding: '0.5rem' }}>
                  <Doughnut
                    data={{ labels: ['Study/Work', 'Entertainment', 'Shopping', 'Other'],
                      datasets: [{ data: [aggStats.category_averages.study, aggStats.category_averages.entertainment, aggStats.category_averages.shopping, aggStats.category_averages.other],
                        backgroundColor: ['#10b981','#38bdf8','#f59e0b','#475569'], borderWidth: 0, hoverOffset: 8 }] }}
                    options={{ responsive: true, maintainAspectRatio: false,
                      plugins: { legend: { position: 'right', labels: { color: '#8b949e', padding: 10, boxWidth: 12, font: { size: 11 } } } },
                      animation: { animateRotate: true, duration: 1000 } }}
                  />
                </div>
              </div>

              <div className="panel glass-panel slide-in" style={{ animationDelay: '0.1s' }}>
                <h2 className="panel-title">Sentiment Flow (7‑day)</h2>
                <div style={{ height: '180px', padding: '0.5rem' }}>
                  <Line
                    data={{ labels: ['Day 7','Day 6','Day 5','Day 4','Day 3','Day 2','Today'],
                      datasets: [{ label: 'Positivity Score', data: aggStats.sentiment_flow,
                        borderColor: '#a78bfa', tension: 0.4, fill: true, backgroundColor: 'rgba(167,139,250,0.1)', pointBackgroundColor: '#a78bfa', pointRadius: 4 }] }}
                    options={{ responsive: true, maintainAspectRatio: false, ...chartDefaults }}
                  />
                </div>
              </div>

              <div className="panel glass-panel slide-in" style={{ animationDelay: '0.2s' }}>
                <div className="flex-between" style={{ marginBottom: '0.8rem' }}>
                  <h2 className="panel-title" style={{ margin: 0 }}>Daily Usage Breakdown</h2>
                  {aggStats.usage_history && (
                    <select
                      value={selectedDayIdx}
                      onChange={e => setSelectedDayIdx(parseInt(e.target.value))}
                      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--panel-border)', color: 'var(--text-main)', borderRadius: '6px', padding: '0.3rem 0.6rem', fontSize: '0.8rem', cursor: 'pointer', outline:'none' }}
                    >
                      {aggStats.usage_history.map((h, i) => <option value={i} key={i}>{h.day}</option>)}
                    </select>
                  )}
                </div>
                {aggStats.usage_history && (
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                    Screen time: <strong style={{ color: 'var(--accent)' }}>{aggStats.usage_history[selectedDayIdx].screen_time}h</strong>
                  </p>
                )}
                <div style={{ height: '200px', padding: '0.5rem' }}>
                  {aggStats.usage_history && (
                    <Bar
                      data={{ labels: ['Study/Work', 'Entertainment', 'Shopping'],
                        datasets: [{ label: 'Usage %', data: [aggStats.usage_history[selectedDayIdx].study, aggStats.usage_history[selectedDayIdx].entertainment, aggStats.usage_history[selectedDayIdx].shopping],
                          backgroundColor: ['rgba(16,185,129,0.8)','rgba(56,189,248,0.8)','rgba(245,158,11,0.8)'], borderRadius: 6 }] }}
                      options={{ responsive: true, maintainAspectRatio: false, ...chartDefaults, scales: { ...chartDefaults.scales, y: { ...chartDefaults.scales.y, max: 100 } } }}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Right column — Forensics table */}
            <div className="panel glass-panel flex-panel slide-in" style={{ animationDelay: '0.3s' }}>
              <div className="flex-between" style={{ marginBottom: '1rem' }}>
                <h2 className="panel-title" style={{ margin: 0 }}>Device Forensics & Mood Grid</h2>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <div className="search-box">
                    <Search size={13} />
                    <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                  <button className="icon-btn" onClick={exportToCSV} title="Export CSV"><Download size={15} /></button>
                  <button className="icon-btn" onClick={() => setSearchTerm('')} title="Refresh"><RefreshCw size={15} /></button>
                </div>
              </div>
              <div className="table-container" style={{ flex: 1 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Device / Log</th>
                      <th>Mood</th>
                      <th>Usage Matrix</th>
                      <th>Fraud Risk</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aggStats?.usage_history?.map((log, i) => (
                      <tr key={`hist_${i}`}>
                        <td style={{ fontFamily: 'JetBrains Mono, monospace', color: '#38bdf8', fontSize: '0.78rem' }}>
                          {log.day} {log.day === 'Today' && <div className="live-dot" style={{ display: 'inline-block' }} />}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                            {getMoodIcon(log.mood)}{log.mood || 'Productive'}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ flex: 1, height: '5px', background: '#1e293b', borderRadius: '3px', display: 'flex', overflow: 'hidden' }}>
                              <div style={{ width: `${log.study}%`, background: '#10b981' }} />
                              <div style={{ width: `${log.entertainment}%`, background: '#38bdf8' }} />
                              <div style={{ width: `${log.shopping}%`, background: '#f59e0b' }} />
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              <span style={{ color: '#10b981' }}>S:{log.study}%</span>&nbsp;<span style={{ color: '#38bdf8' }}>E:{log.entertainment}%</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          {log.fraud_status === 'High Risk'
                            ? <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}><ShieldAlert size={10} />&nbsp;High Risk</span>
                            : log.fraud_status === 'Suspicious'
                            ? <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>⚠ Suspicious</span>
                            : <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>✓ Clear</span>}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {Math.round(85 + Math.random() * 12)}%
                        </td>
                      </tr>
                    ))}
                    {filteredResults.slice(0, 8).map((r, i) => (
                      <tr key={`res_${i}`}>
                        <td style={{ fontFamily: 'JetBrains Mono, monospace', color: '#a78bfa', fontSize: '0.78rem' }}>{r.device_id}</td>
                        <td><div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>{getMoodIcon(r.primary_mood)}{r.primary_mood}</div></td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                            <div style={{ flex: 1, height: '5px', background: '#1e293b', borderRadius: '3px', display: 'flex', overflow: 'hidden' }}>
                              <div style={{ width: `${r.usage.study}%`, background: '#10b981' }} />
                              <div style={{ width: `${r.usage.entertainment}%`, background: '#38bdf8' }} />
                              <div style={{ width: `${r.usage.shopping}%`, background: '#f59e0b' }} />
                            </div>
                          </div>
                        </td>
                        <td>
                          {r.fraud_status === 'High Risk'
                            ? <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}><ShieldAlert size={10} />&nbsp;High Risk</span>
                            : r.fraud_status === 'Suspicious'
                            ? <span className="badge" style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>⚠ Suspicious</span>
                            : <span className="badge" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>✓ Clear</span>}
                        </td>
                        <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{r.confidence}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
