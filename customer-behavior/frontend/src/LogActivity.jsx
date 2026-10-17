import { useState } from 'react';
import { X, CheckCircle2, AlertCircle } from 'lucide-react';

const categories = [
  { key: 'study',         label: 'Study / Work',   icon: '📚', color: '#10b981' },
  { key: 'entertainment', label: 'Entertainment',  icon: '🎬', color: '#38bdf8' },
  { key: 'social',        label: 'Social Media',   icon: '💬', color: '#a78bfa' },
  { key: 'shopping',      label: 'Shopping',       icon: '🛒', color: '#f59e0b' },
  { key: 'other',         label: 'Other',          icon: '🌐', color: '#475569' },
];

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function LogActivity({ userId = 'default', onSaved, onClose }) {
  const [values, setValues] = useState({ study: 0, entertainment: 0, social: 0, shopping: 0, other: 0 });
  const [screenTime, setScreenTime] = useState(0);
  const [sites, setSites]           = useState(0);
  const [notes, setNotes]           = useState('');
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [error, setError]           = useState('');

  const total = Object.values(values).reduce((a, b) => a + b, 0);
  const remaining = 100 - total;
  const isValid   = total === 100;

  const setVal = (key, v) => {
    const clamped = Math.max(0, Math.min(100, Number(v)));
    setValues(prev => ({ ...prev, [key]: clamped }));
  };

  // Distribute remaining to "other" automatically
  const autoBalance = () => {
    const mainTotal = values.study + values.entertainment + values.social + values.shopping;
    const autoOther = Math.max(0, 100 - mainTotal);
    setValues(prev => ({ ...prev, other: autoOther }));
  };

  const handleSave = async () => {
    if (!isValid) { setError(`Total must equal 100%. Currently ${total}%. Click "Auto-balance Other" to fix.`); return; }
    setSaving(true); setError('');
    try {
      const res = await fetch(`${API}/api/today`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          ...values,
          screen_time: parseFloat(screenTime) || 0,
          sites_visited: parseInt(sites) || 0,
          notes,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSaved(true);
      setTimeout(() => { onSaved(data); onClose(); }, 1200);
    } catch (e) {
      setError('Could not save. Make sure the backend is running.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
      <div style={{ width: '100%', maxWidth: 430, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: '24px 24px 0 0', maxHeight: '92vh', overflowY: 'auto', animation: 'fadeUp 0.35s cubic-bezier(.25,.46,.45,.94) both' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.2rem 1.2rem 0.6rem', position: 'sticky', top: 0, background: 'var(--bg2)', zIndex: 2, borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>📝 Log Today's Activity</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text2)' }}>Enter how you actually spent your time online today</div>
          </div>
          <button onClick={onClose} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text2)' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '1rem 1.2rem' }}>
          {/* Total indicator */}
          <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', borderRadius: 20, background: isValid ? 'rgba(16,185,129,0.12)' : total > 100 ? 'rgba(239,68,68,0.12)' : 'rgba(99,102,241,0.12)', border: `1px solid ${isValid ? 'rgba(16,185,129,0.3)' : total > 100 ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.3)'}` }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: isValid ? '#10b981' : total > 100 ? '#ef4444' : 'var(--accent)' }}>
                {total}% used
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>
                {isValid ? '✓ Total = 100%' : remaining > 0 ? `(${remaining}% remaining)` : `(${-remaining}% over!)`}
              </span>
            </div>
          </div>

          {/* Category sliders */}
          {categories.map(cat => (
            <div key={cat.key} style={{ marginBottom: '1.1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '1.1rem' }}>{cat.icon}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{cat.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <input type="number" min={0} max={100} value={values[cat.key]}
                    onChange={e => setVal(cat.key, e.target.value)}
                    style={{ width: 52, padding: '0.3rem 0.4rem', borderRadius: 8, background: 'var(--surface)', border: `1px solid ${cat.color}40`, color: cat.color, fontFamily: 'Space Grotesk', fontWeight: 800, fontSize: '0.9rem', textAlign: 'center', outline: 'none' }} />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>%</span>
                </div>
              </div>
              <input type="range" min={0} max={100} value={values[cat.key]}
                onChange={e => setVal(cat.key, e.target.value)}
                style={{ width: '100%', accentColor: cat.color, height: 4, cursor: 'pointer' }} />
              {/* Progress bar */}
              <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 2, marginTop: 4 }}>
                <div style={{ height: '100%', width: `${values[cat.key]}%`, background: cat.color, borderRadius: 2, transition: 'width 0.2s ease' }} />
              </div>
            </div>
          ))}

          {/* Auto-balance button */}
          <button onClick={autoBalance} style={{ width: '100%', padding: '0.55rem', borderRadius: 10, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: 'var(--accent)', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', marginBottom: '1rem' }}>
            ⚡ Auto-balance "Other" to reach 100%
          </button>

          {/* Screen time & sites */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
            {[
              { label: '⏱️ Total Screen Time (hrs)', val: screenTime, set: setScreenTime, step: 0.5, min: 0, max: 24 },
              { label: '🌐 Sites Visited', val: sites, set: setSites, step: 1, min: 0, max: 200 },
            ].map((f, i) => (
              <div key={i}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text2)', marginBottom: '0.3rem' }}>{f.label}</div>
                <input type="number" min={f.min} max={f.max} step={f.step} value={f.val}
                  onChange={e => f.set(e.target.value)}
                  style={{ width: '100%', padding: '0.5rem 0.6rem', borderRadius: 8, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.9rem', fontFamily: 'Space Grotesk', fontWeight: 700, outline: 'none' }} />
              </div>
            ))}
          </div>

          {/* Notes */}
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text2)', marginBottom: '0.3rem' }}>📝 Notes (optional)</div>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} maxLength={200}
              placeholder="e.g. Studied for exam, no shopping today..."
              style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: 10, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontSize: '0.82rem', resize: 'none', height: 70, outline: 'none', fontFamily: 'Inter, sans-serif' }} />
          </div>

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#ef4444', fontSize: '0.78rem', marginBottom: '0.8rem' }}>
              <AlertCircle size={14}/> {error}
            </div>
          )}

          {/* Save button */}
          <button onClick={handleSave} disabled={saving || saved}
            style={{ width: '100%', padding: '0.85rem', borderRadius: 14, background: saved ? 'rgba(16,185,129,0.2)' : 'linear-gradient(135deg, var(--accent), #818cf8)', border: saved ? '1px solid rgba(16,185,129,0.4)' : 'none', color: saved ? '#10b981' : 'white', fontWeight: 800, fontSize: '1rem', cursor: saving || saved ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', transition: 'all 0.3s', opacity: saving ? 0.7 : 1 }}>
            {saved ? <><CheckCircle2 size={18}/> Saved!</> : saving ? '⏳ Saving…' : '💾 Save Today\'s Activity'}
          </button>
          <div style={{ paddingBottom: '1rem' }} />
        </div>
      </div>
    </div>
  );
}
