import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

function useCountUp(target, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime = null;
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

const features = [
  { icon: '🧠', color: '#38bdf8', bg: 'rgba(56,189,248,0.1)', title: 'Deep Behavioral Profiling', desc: 'Multi-modal analysis of keystrokes, app duration, scroll patterns and session depth to build rich psychographic profiles.' },
  { icon: '🌐', color: '#818cf8', bg: 'rgba(129,140,248,0.1)', title: 'Web Usage Mining', desc: 'Clickstream parsing, URL categorization, association rule mining and cookie-trail analysis to predict user intent.' },
  { icon: '🤖', color: '#10b981', bg: 'rgba(16,185,129,0.1)', title: 'ML Prediction Engine', desc: 'Scikit-learn models trained on behavioral features deliver real-time mood classification and next-action predictions.' },
  { icon: '🛡️', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', title: 'Fraud Detection', desc: 'Rule-based + ML hybrid engine flags suspicious web trails, dark-pattern interactions and anomalous session spikes.' },
  { icon: '📊', color: '#a78bfa', bg: 'rgba(167,139,250,0.1)', title: 'Real-time Analytics', desc: 'Live OS daemon with sub-3s polling pushes fresh device telemetry directly to the dashboard without a page refresh.' },
  { icon: '📁', color: '#34d399', bg: 'rgba(52,211,153,0.1)', title: 'Smart Report Export', desc: 'One-click CSV / JSON export with scheduled email reports and multi-format templates for stakeholder presentations.' },
];

const pipeline = [
  { n: '01', label: 'Data Collection', sub: 'OS daemon captures keystrokes, app logs & web trails' },
  { n: '02', label: 'Feature Extraction', sub: 'NLP sentiment + usage percentage normalization' },
  { n: '03', label: 'ML Classification', sub: 'Mood, intent & fraud scored by ensemble model' },
  { n: '04', label: 'Live Dashboard', sub: 'Results stream to React UI in < 3 seconds' },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [heroVisible, setHeroVisible] = useState(false);
  const statsRef = useRef(null);
  const [statsVisible, setStatsVisible] = useState(false);

  const devices = useCountUp(12400, 2200, statsVisible);
  const accuracy = useCountUp(97, 1800, statsVisible);
  const fraudSaved = useCountUp(3200, 2500, statsVisible);

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStatsVisible(true); }, { threshold: 0.4 });
    if (statsRef.current) obs.observe(statsRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div className="landing-page">
      {/* HERO */}
      <section className="hero-section">
        <div className="hero-bg" />
        <div className="hero-grid" />
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
        <div className="hero-orb hero-orb-3" />

        {/* Floating particles */}
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: `${Math.random() * 4 + 2}px`,
            height: `${Math.random() * 4 + 2}px`,
            borderRadius: '50%',
            background: ['#38bdf8','#818cf8','#10b981','#f59e0b'][i % 4],
            left: `${(i / 12) * 100}%`,
            animation: `particleFloat ${8 + i * 1.5}s linear infinite`,
            animationDelay: `${i * 0.8}s`,
            opacity: 0.5,
            pointerEvents: 'none',
          }} />
        ))}

        <div className="hero-content">
          <div className="hero-badge" style={{ animationDelay: '0.1s' }}>
            <span>🔬</span> AI-Powered Web Usage Mining
          </div>
          <h1 className="hero-title">
            Predict Customer<br />
            <span className="gradient-word">Behaviour</span> with<br />
            Deep Intelligence
          </h1>
          <p className="hero-subtitle">
            Advanced multi-modal analytics platform combining web usage mining, NLP sentiment analysis, and machine learning to forecast user intent, classify mood, and detect fraud — in real time.
          </p>
          <div className="hero-actions">
            <button className="hero-cta hero-cta-primary" onClick={() => navigate('/dashboard')}>
              🚀 Launch Dashboard
            </button>
            <button className="hero-cta hero-cta-secondary" onClick={() => navigate('/how-it-works')}>
              📚 How It Works
            </button>
          </div>
        </div>
      </section>

      {/* STATS */}
      <div ref={statsRef} style={{ background: 'rgba(56,189,248,0.04)', borderTop: '1px solid rgba(56,189,248,0.12)', borderBottom: '1px solid rgba(56,189,248,0.12)', padding: '3rem 2rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '2rem' }}>
          {[
            { value: devices.toLocaleString() + '+', label: 'Devices Analyzed', color: '#38bdf8' },
            { value: accuracy + '%', label: 'Prediction Accuracy', color: '#10b981' },
            { value: fraudSaved.toLocaleString() + '+', label: 'Fraud Cases Flagged', color: '#f59e0b' },
            { value: '<3s', label: 'Live Sync Latency', color: '#818cf8' },
          ].map((s, i) => (
            <div key={i} className="hero-stat" style={{ animation: statsVisible ? `slideInUp 0.5s ease both ${i * 0.1}s` : 'none' }}>
              <div className="hero-stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="hero-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURES */}
      <div className="section">
        <div className="section-header">
          <div className="section-tag">Core Capabilities</div>
          <h2 className="section-title">Everything You Need to<br />Understand Your Users</h2>
          <p className="section-desc">Six powerful modules working together to deliver the most complete picture of customer behaviour on the web.</p>
        </div>
        <div className="features-grid">
          {features.map((f, i) => (
            <div key={i} className="feature-card slide-in" style={{ animationDelay: `${i * 0.08}s` }}>
              <div className="feature-icon" style={{ background: f.bg }}>
                <span style={{ fontSize: '1.5rem' }}>{f.icon}</span>
              </div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* PIPELINE */}
      <div style={{ background: 'var(--bg-secondary)', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div className="section-header">
            <div className="section-tag">System Pipeline</div>
            <h2 className="section-title">From Raw Data to<br />Actionable Intelligence</h2>
          </div>
          <div className="pipeline">
            {pipeline.map((p, i) => (
              <div key={i} className="pipeline-step slide-in" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="pipeline-num">{p.n}</div>
                <div className="pipeline-label">{p.label}</div>
                <div className="pipeline-sub">{p.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA FOOTER */}
      <div style={{ padding: '5rem 2rem', textAlign: 'center', background: 'linear-gradient(135deg, rgba(56,189,248,0.05), rgba(129,140,248,0.05))' }}>
        <div className="section-tag">Get Started</div>
        <h2 className="section-title" style={{ marginTop: '1rem' }}>Ready to Analyse Behaviour?</h2>
        <p style={{ color: 'var(--text-muted)', margin: '1rem auto 2rem', maxWidth: '500px', fontSize: '0.95rem', lineHeight: '1.7' }}>
          Upload your CSV dataset or connect the live OS daemon tracker to begin real-time behavioural analysis instantly.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button className="hero-cta hero-cta-primary" onClick={() => navigate('/dashboard')}>
            📊 Open Dashboard
          </button>
          <button className="hero-cta hero-cta-secondary" onClick={() => navigate('/predictions')}>
            🤖 See Predictions
          </button>
        </div>
      </div>
    </div>
  );
}
