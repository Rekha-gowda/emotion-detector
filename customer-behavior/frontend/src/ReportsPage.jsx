import { useState } from 'react';
import { Download, Calendar, Mail, FileText, BarChart2, PieChart, TrendingUp, Clock } from 'lucide-react';

const reportTemplates = [
  { icon: <BarChart2 size={22} color="#38bdf8" />, bg: 'rgba(56,189,248,0.1)', color: '#38bdf8', title: 'Daily Behaviour Summary', period: 'Last 24 hours', desc: 'Per-device mood classification, usage breakdown and fraud flags generated daily at midnight.', size: '~142 KB', format: 'CSV + PDF' },
  { icon: <TrendingUp size={22} color="#10b981" />, bg: 'rgba(16,185,129,0.1)', color: '#10b981', title: 'Weekly Trend Report', period: 'Last 7 days', desc: 'Aggregated usage trends, sentiment flow analysis and week-over-week comparison.', size: '~890 KB', format: 'CSV + PDF + JSON' },
  { icon: <PieChart size={22} color="#a78bfa" />, bg: 'rgba(167,139,250,0.1)', color: '#a78bfa', title: 'Monthly Segment Analysis', period: 'Last 30 days', desc: 'Full ML segment breakdown, cohort analysis and predictive next-action modelling.', size: '~3.2 MB', format: 'Full Bundle' },
  { icon: <FileText size={22} color="#f59e0b" />, bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', title: 'Fraud Risk Audit Log', period: 'Configurable', desc: 'Detailed forensics trail for all high-risk and suspicious device sessions with evidence chain.', size: '~560 KB', format: 'JSON + PDF' },
  { icon: <BarChart2 size={22} color="#34d399" />, bg: 'rgba(52,211,153,0.1)', color: '#34d399', title: 'Web Mining Digest', period: 'Last 7 days', desc: 'Top domains, clickstream patterns, association rules and session depth statistics.', size: '~720 KB', format: 'CSV + HTML' },
  { icon: <TrendingUp size={22} color="#f472b6" />, bg: 'rgba(244,114,182,0.1)', color: '#f472b6', title: 'Executive Dashboard PDF', period: 'Monthly', desc: 'High-level KPI snapshot designed for management presentations and stakeholder reviews.', size: '~1.8 MB', format: 'PDF Only' },
];

function downloadSample(name) {
  const csv = 'device_id,screen_time,app_category_logs,keyboard_sentiment,web_mining_flag\nDEV_001,7.2,"study:60,entertainment:30,shopping:10",0.45,0\nDEV_002,5.8,"study:20,entertainment:55,shopping:25",-0.12,1\nDEV_003,9.1,"study:10,entertainment:70,shopping:20",-0.62,2\nDEV_004,4.4,"study:50,entertainment:30,shopping:20",0.72,0\nDEV_005,6.3,"study:35,entertainment:45,shopping:20",0.18,1\n';
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name + '.csv'; a.click();
}

export default function ReportsPage() {
  const [scheduled, setScheduled] = useState(false);
  const [email, setEmail] = useState('');
  const [schedTime, setSchedTime] = useState('08:00');
  const [freq, setFreq] = useState('daily');
  const [downloading, setDownloading] = useState(null);

  const handleDownload = (idx, name) => {
    setDownloading(idx);
    setTimeout(() => { downloadSample(name); setDownloading(null); }, 1000);
  };

  return (
    <>
      <div className="board-header">
        <div>
          <h1>Reports & Data Export</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
            Download analytics reports, schedule automated delivery and export raw data
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => downloadSample('behavior_full_export')}>
          <Download size={16} /> Export All Data
        </button>
      </div>

      {/* Quick stats */}
      <div className="kpi-row" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: '1.5rem' }}>
        {[
          { l: 'Reports Generated', v: '1,284', c: '#38bdf8', t: 'This month' },
          { l: 'Scheduled Exports', v: '14', c: '#10b981', t: 'Active schedules' },
          { l: 'Data Points Exported', v: '2.4M', c: '#a78bfa', t: 'Total records' },
          { l: 'Last Export', v: '8m ago', c: '#f59e0b', t: 'Auto-scheduled' },
        ].map((k, i) => (
          <div key={i} className="kpi-card glass-panel slide-in" style={{ borderTop: `3px solid ${k.c}`, animationDelay: `${i*0.1}s` }}>
            <div className="kpi-header"><span className="kpi-label">{k.l}</span></div>
            <div className="kpi-value" style={{ color: k.c }}>{k.v}</div>
            <div className="trend positive">{k.t}</div>
          </div>
        ))}
      </div>

      {/* Report templates grid */}
      <div className="panel-title" style={{ marginBottom: '1rem', fontSize: '1rem' }}>Report Templates</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {reportTemplates.map((r, i) => (
          <div key={i} className="report-card slide-in" style={{ animationDelay: `${i*0.07}s` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="report-card-icon" style={{ background: r.bg }}>{r.icon}</div>
              <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-muted)', border: '1px solid var(--panel-border)', fontSize: '0.68rem' }}>{r.period}</span>
            </div>
            <div>
              <div className="report-card-title">{r.title}</div>
              <div className="report-card-desc">{r.desc}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: '0.4rem', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Format: <span style={{ color: r.color }}>{r.format}</span></span>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Size: <span style={{ color: 'var(--text-main)' }}>{r.size}</span></span>
              </div>
              <button className="btn btn-ghost" onClick={() => handleDownload(i, r.title.toLowerCase().replace(/\s+/g, '_'))}
                style={{ fontSize: '0.78rem', padding: '0.4rem 0.8rem', borderColor: `${r.color}40`, color: r.color, background: `${r.color}10` }}>
                {downloading === i ? <><span style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }}>↻</span>&nbsp;Generating...</> : <><Download size={13} />&nbsp;Download</>}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule form */}
      <div className="panel glass-panel slide-in" style={{ animationDelay: '0.5s' }}>
        <h2 className="panel-title">📅 Schedule Automated Reports</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Recipient Email</label>
            <input type="email" placeholder="analyst@company.com" value={email} onChange={e => setEmail(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '0.65rem 0.8rem', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Frequency</label>
            <select value={freq} onChange={e => setFreq(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-tertiary)', border: '1px solid var(--panel-border)', color: 'var(--text-main)', borderRadius: '8px', padding: '0.65rem 0.8rem', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Delivery Time</label>
            <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)}
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--panel-border)', borderRadius: '8px', padding: '0.65rem 0.8rem', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none', colorScheme: 'dark' }} />
          </div>
        </div>
        {scheduled ? (
          <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '8px', padding: '0.8rem 1rem', color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ✅ Schedule saved! Reports will be sent to <strong>{email || 'the configured address'}</strong> every {freq} at {schedTime}.
            <button onClick={() => setScheduled(false)} style={{ marginLeft: 'auto', background: 'transparent', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
          </div>
        ) : (
          <button className="btn btn-success" onClick={() => { if (email) setScheduled(true); else alert('Please enter an email address.'); }}>
            <Calendar size={16} /> Save Schedule
          </button>
        )}
      </div>

      {/* Sample CSV download note */}
      <div style={{ marginTop: '1.5rem', padding: '1rem 1.4rem', background: 'rgba(56,189,248,0.05)', border: '1px solid rgba(56,189,248,0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <FileText size={22} color="#38bdf8" />
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: 'var(--text-bright)', fontSize: '0.9rem' }}>Sample Dataset — Download & Test</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Use this sample CSV to test the Dashboard upload and analysis pipeline. Contains 5 user records with all required fields.</div>
        </div>
        <button className="btn btn-ghost" onClick={() => downloadSample('sample_behavior_data')} style={{ flexShrink: 0 }}>
          <Download size={14} /> Sample CSV
        </button>
      </div>
    </>
  );
}
