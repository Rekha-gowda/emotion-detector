import { useState, useEffect } from 'react';
import { Zap, TrendingUp, AlertTriangle, Star, CheckCircle, ChevronRight, Heart } from 'lucide-react';

const allInsights = [
  { icon: '🧠', gradient: 'linear-gradient(135deg,#6366f1,#a78bfa)', title: 'Peak Focus Window', body: 'Your brain is sharpest between 10 AM–1 PM. You get 42% more done when you start study sessions before noon. Set a morning study alarm!', tag: 'Productivity', priority: 'high' },
  { icon: '🛍️', gradient: 'linear-gradient(135deg,#f59e0b,#ef4444)', title: 'Impulse Shopping Alert', body: 'You open e-commerce apps 3.2x more often after watching YouTube. This pattern has cost you money before. Bookmark instead of buying!', tag: 'Spend Guard', priority: 'high' },
  { icon: '😌', gradient: 'linear-gradient(135deg,#10b981,#38bdf8)', title: 'Digital Wellness Tip', body: 'Days where you take a 20-min break from screens at 3 PM show a 31% lower stress score. Your body already knows this works.', tag: 'Wellness', priority: 'medium' },
  { icon: '📱', gradient: 'linear-gradient(135deg,#38bdf8,#6366f1)', title: 'Social Media Loop', body: 'You visit Twitter → Reddit → Instagram in sequence 4x per day. This doom-scroll loop averages 47 minutes before you notice.', tag: 'Web Mining', priority: 'medium' },
  { icon: '⚡', gradient: 'linear-gradient(135deg,#a78bfa,#f43f5e)', title: 'Study Streak at Risk', body: 'Your 7-day study streak ends tonight unless you log 20 min. Last time you broke a streak, it took 11 days to restart. Don\'t break the chain!', tag: 'Streak Alert', priority: 'high' },
  { icon: '🌐', gradient: 'linear-gradient(135deg,#10b981,#6366f1)', title: 'Habit Pattern Found', body: 'You visit the same 12 websites 78% of the time. Your digital routine is highly predictable — great for building new habits intentionally!', tag: 'Pattern', priority: 'low' },
  { icon: '🎯', gradient: 'linear-gradient(135deg,#f472b6,#a78bfa)', title: 'Context Switching Cost', body: 'You switch browser tabs 127 times per hour on stressful days vs. 43 times on focused days. Fewer tabs = 28% higher output.', tag: 'Focus', priority: 'medium' },
  { icon: '🔋', gradient: 'linear-gradient(135deg,#f59e0b,#10b981)', title: 'Energy Pattern', body: 'Your productivity scores drop 40% after 6 PM. You\'re a morning person — front-load your hardest tasks before lunch!', tag: 'Bio-Rhythm', priority: 'low' },
];

const achievements = [
  { icon: '🔥', title: '7-Day Focus Streak', desc: 'Studied every day this week', earned: true, color: '#f59e0b' },
  { icon: '🕐', title: 'Early Bird', desc: 'Logged focus session before 9 AM', earned: true, color: '#10b981' },
  { icon: '🛡️', title: 'Spend Guard Hero', desc: 'Didn\'t buy from impulse-browse', earned: true, color: '#38bdf8' },
  { icon: '🧘', title: 'Digital Detox', desc: '2hr screen-free afternoon (not yet)', earned: false, color: '#a78bfa' },
  { icon: '📚', title: 'Knowledge Seeker', desc: 'Learn on 30 unique days', earned: false, color: '#6366f1' },
  { icon: '⚡', title: 'Speed Reader', desc: 'Read 5 long articles in one session', earned: false, color: '#f472b6' },
];

const goals = [
  { icon: '📚', label: 'Study ≥ 2h today', done: true, pct: 100 },
  { icon: '📵', label: 'Social media < 45 min', done: false, pct: 62 },
  { icon: '🛒', label: 'No impulse shopping', done: true, pct: 100 },
  { icon: '😌', label: 'Take 1 mindful break', done: false, pct: 0 },
];

export default function InsightsPage() {
  const [filter, setFilter] = useState('all');
  const [savedInsights, setSaved] = useState(new Set());
  const [streakDays] = useState(7);

  const toggleSave = (i) => setSaved(s => { const ns = new Set(s); ns.has(i) ? ns.delete(i) : ns.add(i); return ns; });

  const filtered = filter === 'all' ? allInsights : allInsights.filter(ins => ins.priority === filter);

  return (
    <div className="page-content page-enter">
      {/* Header */}
      <div style={{ padding: '1.2rem 1.2rem 0.5rem', background: 'linear-gradient(180deg, rgba(245,158,11,0.08) 0%, transparent 100%)' }}>
        <h1 style={{ fontFamily: 'Space Grotesk', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)', marginBottom: '0.2rem' }}>
          💡 AI Insights
        </h1>
        <p style={{ fontSize: '0.8rem', color: 'var(--text2)' }}>Personalised intelligence based on your web behaviour</p>
      </div>

      {/* Streak banner */}
      <div className="px pt pb" style={{ paddingTop: '0.8rem' }}>
        <div style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(239,68,68,0.1))', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 'var(--radius)', padding: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '3rem', lineHeight: 1 }}>🔥</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.3rem', fontWeight: 900, color: '#f59e0b' }}>{streakDays}-Day Streak!</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text2)', lineHeight: 1.5 }}>You've hit your daily study goal {streakDays} days in a row. Keep going — next milestone is 10 days! 🎯</div>
          </div>
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            <div style={{ fontFamily: 'Space Grotesk', fontWeight: 900, fontSize: '1.6rem', color: '#f59e0b' }}>{streakDays}</div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>days</div>
          </div>
        </div>
      </div>

      {/* Today's goals */}
      <div className="section-head" style={{ paddingBottom: '0.5rem' }}>
        <span className="section-title">✅ Today's Goals</span>
        <span className="chip" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', fontSize: '0.65rem' }}>
          {goals.filter(g => g.done).length}/{goals.length} done
        </span>
      </div>
      <div className="px pb">
        <div className="card">
          {goals.map((g, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.75rem 1rem', borderBottom: i < goals.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize: '1.1rem' }}>{g.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text)', marginBottom: 4, textDecoration: g.done ? 'line-through' : 'none', opacity: g.done ? 0.6 : 1 }}>{g.label}</div>
                <div className="prog-bar" style={{ height: 4 }}>
                  <div className="prog-bar-fill" style={{ width: `${g.pct}%`, background: g.done ? '#10b981' : 'var(--accent)' }} />
                </div>
              </div>
              <div style={{ width: 24, height: 24, borderRadius: 6, background: g.done ? '#10b981' : 'var(--surface2)', border: `1.5px solid ${g.done ? '#10b981' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {g.done && <CheckCircle size={14} color="white" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filter chips */}
      <div className="section-head" style={{ paddingBottom: '0.5rem' }}>
        <span className="section-title">🧠 Personalised Insights</span>
      </div>
      <div className="px" style={{ paddingBottom: '0.5rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {['all','high','medium','low'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '0.35rem 0.8rem', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, border: 'none', cursor: 'pointer', background: filter === f ? 'var(--accent)' : 'var(--surface2)', color: filter === f ? 'white' : 'var(--text2)', transition: 'all 0.2s' }}>
              {f === 'all' ? '🌐 All' : f === 'high' ? '🔴 High' : f === 'medium' ? '🟡 Medium' : '🟢 Low'}
            </button>
          ))}
        </div>
      </div>

      {/* Insight cards scroll */}
      <div className="insight-scroll" style={{ paddingLeft: '1.2rem', paddingRight: '1.2rem' }}>
        {filtered.map((c, i) => (
          <div key={i} className="insight-card" style={{ background: c.gradient, boxShadow: '0 12px 40px rgba(0,0,0,0.4)', flex: '0 0 260px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div className="insight-card-icon">{c.icon}</div>
              <button onClick={() => toggleSave(i)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: savedInsights.has(i) ? '#f43f5e' : 'rgba(255,255,255,0.5)', transition: 'all 0.2s', padding: 0 }}>
                <Heart size={18} fill={savedInsights.has(i) ? '#f43f5e' : 'none'} />
              </button>
            </div>
            <div className="insight-card-title">{c.title}</div>
            <div className="insight-card-body">{c.body}</div>
            <div className="insight-card-tag">{c.tag}</div>
          </div>
        ))}
      </div>

      {/* Achievements */}
      <div className="section-head" style={{ paddingBottom: '0.5rem', paddingTop: '0.8rem' }}>
        <span className="section-title">🏆 Achievements</span>
        <span className="section-more">{achievements.filter(a => a.earned).length}/{achievements.length} earned</span>
      </div>
      <div className="px pb">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
          {achievements.map((a, i) => (
            <div key={i} className="card" style={{ padding: '0.85rem', opacity: a.earned ? 1 : 0.45, border: a.earned ? `1px solid ${a.color}30` : '1px solid var(--border)', background: a.earned ? `${a.color}08` : 'var(--surface)', transition: 'all 0.2s' }}>
              <div style={{ fontSize: '1.6rem', marginBottom: '0.3rem' }}>{a.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '0.8rem', color: a.earned ? a.color : 'var(--text3)', marginBottom: '0.2rem' }}>{a.title}</div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text2)', lineHeight: 1.4 }}>{a.desc}</div>
              {a.earned && <div style={{ marginTop: '0.4rem', fontSize: '0.62rem', fontWeight: 700, color: a.color }}>✓ Earned!</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Weekly summary card */}
      <div className="px pb">
        <div className="card" style={{ padding: '1rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(167,139,250,0.08))', border: '1px solid rgba(99,102,241,0.2)' }}>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)', marginBottom: '0.8rem' }}>📋 This Week's Summary</div>
          {[
            { label: 'Total screen time', val: '43.2h', change: '-2.1h vs last week', up: false },
            { label: 'Study sessions', val: '9 sessions', change: '+3 vs last week', up: true },
            { label: 'Most-visited domain', val: 'youtube.com', change: '12.4h total', up: null },
            { label: 'Mood trend', val: 'Improving 📈', change: 'Stress ↓ 18%', up: true },
          ].map((row, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.45rem 0', borderBottom: i < 3 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text2)' }}>{row.label}</span>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>{row.val}</div>
                <div style={{ fontSize: '0.65rem', color: row.up === true ? '#10b981' : row.up === false ? '#ef4444' : 'var(--text3)' }}>{row.change}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
