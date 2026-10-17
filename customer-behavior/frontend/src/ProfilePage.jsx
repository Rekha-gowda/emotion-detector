import { useState } from 'react';
import { Shield, Bell, Globe, Eye, EyeOff, ChevronRight, Download, LogOut, Info } from 'lucide-react';

export default function ProfilePage() {
  const [tracking, setTracking] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [privateMode, setPrivateMode] = useState(false);
  const [saved, setSaved] = useState(false);

  const Toggle = ({ value, onChange }) => (
    <div onClick={() => onChange(!value)} style={{
      width: 44, height: 24, borderRadius: 12, background: value ? 'var(--accent)' : 'var(--surface2)',
      border: `1px solid ${value ? 'var(--accent)' : 'var(--border)'}`, cursor: 'pointer',
      position: 'relative', transition: 'all 0.3s', flexShrink: 0,
      boxShadow: value ? '0 0 12px var(--accent-glow)' : 'none',
    }}>
      <div style={{
        position: 'absolute', top: 2, left: value ? 22 : 2, width: 18, height: 18,
        borderRadius: 9, background: 'white', transition: 'left 0.3s cubic-bezier(.34,1.56,.64,1)',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
      }} />
    </div>
  );

  return (
    <div className="page-content page-enter">
      {/* Header */}
      <div style={{ padding: '1.2rem 1.2rem 1.5rem', background: 'linear-gradient(180deg, rgba(99,102,241,0.1) 0%, transparent 100%)' }}>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.2rem' }}>
          👤 Profile & Settings
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>Manage your tracking, privacy and notification preferences</p>
      </div>

      {/* User card */}
      <div className="px pb">
        <div className="card card-glow" style={{ padding: '1.2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0, boxShadow: '0 0 24px var(--accent-glow)' }}>
            👩‍💻
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>Rekha Gowda</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text2)', marginBottom: '0.5rem' }}>rekha@behaviourmirror.ai</div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <span className="chip" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', fontSize: '0.62rem' }}>🔥 7-day streak</span>
              <span className="chip" style={{ background: 'rgba(99,102,241,0.12)', color: 'var(--accent)', border: '1px solid rgba(99,102,241,0.25)', fontSize: '0.62rem' }}>Pro Member</span>
            </div>
          </div>
        </div>
      </div>

      {/* Personal stats */}
      <div className="px pb">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem' }}>
          {[
            { label: 'Days Tracked', val: '42', icon: '📅', color: '#38bdf8' },
            { label: 'Avg Screen Time', val: '6.2h', icon: '⏱️', color: '#a78bfa' },
            { label: 'Insights Read', val: '89', icon: '💡', color: '#f59e0b' },
          ].map((s, i) => (
            <div key={i} className="card" style={{ padding: '0.8rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.3rem', marginBottom: '0.3rem' }}>{s.icon}</div>
              <div style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '1.2rem', color: s.color, lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: '0.63rem', color: 'var(--text2)', marginTop: '0.2rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tracking Settings */}
      <div className="section-head" style={{ paddingBottom: '0.5rem' }}>
        <span className="section-title">🔧 Tracking Settings</span>
      </div>
      <div className="px pb">
        <div className="card">
          {[
            { icon: <Globe size={18} color="#38bdf8" />, bg: 'rgba(56,189,248,0.1)', title: 'Web Usage Tracking', sub: 'Monitors URL visits and session durations', value: tracking, onChange: setTracking },
            { icon: <Bell size={18} color="#a78bfa" />, bg: 'rgba(167,139,250,0.1)', title: 'Behaviour Notifications', sub: 'Alerts for mood changes and milestones', value: notifications, onChange: setNotifications },
            { icon: <EyeOff size={18} color="#ef4444" />, bg: 'rgba(239,68,68,0.1)', title: 'Private Mode', sub: 'Pauses tracking temporarily', value: privateMode, onChange: setPrivateMode },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', padding: '0.9rem 1rem', borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: row.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{row.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)' }}>{row.title}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text2)' }}>{row.sub}</div>
              </div>
              <Toggle value={row.value} onChange={row.onChange} />
            </div>
          ))}
        </div>
      </div>

      {/* How data is collected */}
      <div className="px pb">
        <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 'var(--radius)', padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'flex-start' }}>
            <Info size={18} color="var(--accent)" style={{ marginTop: 2, flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)', marginBottom: '0.5rem' }}>How Your Data is Collected</div>
              {[
                '🌐 Browser extension silently logs visited URLs and dwell times',
                '⌨️ Keystroke frequency (not content) measured for sentiment signals',
                '📱 App switch patterns tracked for category classification',
                '🔒 All data stays local — nothing is sent to external servers',
                '🗑️ You can delete all data anytime from the settings below',
              ].map((item, i) => (
                <div key={i} style={{ fontSize: '0.74rem', color: 'var(--text2)', marginBottom: '0.3rem', lineHeight: 1.5 }}>{item}</div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Extension setup */}
      <div className="section-head" style={{ paddingBottom: '0.5rem' }}>
        <span className="section-title">🧩 Browser Extension</span>
      </div>
      <div className="px pb">
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', marginBottom: '0.8rem' }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg, var(--accent), var(--purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>🧩</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>BehaviourMirror Extension</div>
              <div style={{ fontSize: '0.72rem', color: '#10b981' }}>● Active — tracking web sessions</div>
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text2)', lineHeight: 1.6, marginBottom: '0.8rem' }}>
            The browser extension captures your URL trails, dwell times, and scroll patterns — giving the AI the raw data it needs to analyse your mood and behaviour patterns.
          </div>
          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button className="btn btn-ghost" style={{ flex: 1, fontSize: '0.8rem', padding: '0.6rem' }}>
              <Download size={14} /> Download for Chrome
            </button>
            <button className="btn btn-ghost" style={{ flex: 1, fontSize: '0.8rem', padding: '0.6rem' }}>
              <Download size={14} /> Download for Firefox
            </button>
          </div>
        </div>
      </div>

      {/* Privacy controls */}
      <div className="section-head" style={{ paddingBottom: '0.5rem' }}>
        <span className="section-title">🔐 Privacy & Data</span>
      </div>
      <div className="px pb">
        <div className="card">
          {[
            { icon: <Shield size={16} color="#10b981" />, label: 'Privacy Report', sub: 'See what data we hold about you', action: () => alert('Privacy report: All data is stored locally only.') },
            { icon: <Download size={16} color="#38bdf8" />, label: 'Export My Data', sub: 'Download all your behaviour logs as CSV', action: () => alert('Exporting your data...') },
            { icon: <LogOut size={16} color="#ef4444" />, label: 'Delete All Data', sub: 'Permanently erase your behavioural history', action: () => { if (confirm('Delete all data? This cannot be undone.')) alert('Data deleted.'); } },
          ].map((row, i) => (
            <div key={i} onClick={row.action} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.85rem 1rem', borderBottom: i < 2 ? '1px solid var(--border)' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{row.icon}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)' }}>{row.label}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text2)' }}>{row.sub}</div>
              </div>
              <ChevronRight size={16} color="var(--text3)" />
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <div className="px pb">
        <button className="btn btn-primary btn-block btn-lg" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>
          {saved ? '✅ Settings Saved!' : '💾 Save Preferences'}
        </button>
      </div>

      {/* App version info */}
      <div style={{ textAlign: 'center', padding: '0.5rem 1.2rem 1rem', fontSize: '0.68rem', color: 'var(--text3)' }}>
        BehaviourMirror v2.4.0 · Built with ❤️ by Rekha Gowda<br />
        Technologies: React · FastAPI · Python · NLP · Web Mining ML
      </div>
    </div>
  );
}
