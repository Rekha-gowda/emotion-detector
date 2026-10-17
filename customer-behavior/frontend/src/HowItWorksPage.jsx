import { useState } from 'react';

const timelineSteps = [
  { color: '#38bdf8', icon: '📱', title: 'Data Collection Layer', desc: 'A lightweight Python daemon (live_tracker.py) runs in the background, recording app usage durations, keystroke event counts, scroll velocity, and web request traces from the OS network stack — all without storing any personally identifiable information.', tech: ['Python', 'psutil', 'OS Hooks'] },
  { color: '#818cf8', icon: '🧹', title: 'Preprocessing & Cleaning', desc: 'Raw telemetry is normalized, outliers removed, and missing fields imputed. App category logs are parsed from a JSON string into structured feature vectors. Sentiment scores are extracted using a pre-trained VADER NLP model.', tech: ['Pandas', 'VADER NLP', 'scikit-learn'] },
  { color: '#10b981', icon: '🔬', title: 'Web Mining Engine', desc: 'URL logs are categorized using a domain taxonomy database. Clickstream sequences are analyzed with PrefixSpan for sequential pattern mining. Apriori mining discovers co-visited domain associations with configurable support/confidence thresholds.', tech: ['PrefixSpan', 'Apriori', 'NetworkX'] },
  { color: '#f59e0b', icon: '🤖', title: 'ML Classification', desc: 'An ensemble of Random Forest, XGBoost and Logistic Regression classifiers votes on mood segment (Productive / Entertained / Stressed), fraud risk level (Clear / Suspicious / High Risk) and predicted next-action category.', tech: ['XGBoost', 'RandomForest', 'FastAPI'] },
  { color: '#a78bfa', icon: '📊', title: 'Real-time Dashboard', desc: 'The React frontend polls the FastAPI backend every 3 seconds via a RESTful live-stream endpoint, rendering updates to all charts, KPI cards, and the forensics table without a page reload — using Chart.js animations for smooth transitions.', tech: ['React', 'Chart.js', 'Vite', 'REST'] },
  { color: '#34d399', icon: '📋', title: 'Reports & Export', desc: 'Analysis results are serialised to CSV / JSON and optionally emailed on a configurable schedule. The executive PDF template is generated server-side, embedding all chart images and aggregated statistics for stakeholder presentations.', tech: ['CSV', 'JSON', 'PDF'] },
];

const techStack = [
  { name: 'React 18', icon: '⚛️', color: '#61dafb', role: 'Frontend UI' },
  { name: 'Vite', icon: '⚡', color: '#f59e0b', role: 'Build Tool' },
  { name: 'Chart.js', icon: '📈', color: '#ff6384', role: 'Visualisations' },
  { name: 'FastAPI', icon: '🚀', color: '#10b981', role: 'Backend API' },
  { name: 'Python 3.11', icon: '🐍', color: '#3b82f6', role: 'Runtime' },
  { name: 'scikit-learn', icon: '🤖', color: '#f97316', role: 'ML Models' },
  { name: 'Pandas', icon: '🐼', color: '#a78bfa', role: 'Data Processing' },
  { name: 'VADER NLP', icon: '🧠', color: '#38bdf8', role: 'Sentiment Analysis' },
  { name: 'React Router', icon: '🔗', color: '#ca3e47', role: 'Navigation' },
  { name: 'Lucide Icons', icon: '🎨', color: '#e879f9', role: 'UI Icons' },
];

const faqItems = [
  { q: 'What is Web Usage Mining?', a: 'Web Usage Mining (WUM) is a sub-field of Web Mining that uses data mining techniques to automatically discover and extract usage patterns from Web data, particularly from server-side logs, browser logs, and proxy server data. It analyzes clickstreams, session data, and user navigation patterns to understand and predict user behavior on websites.' },
  { q: 'How does the fraud detection work?', a: 'The fraud detection engine combines a rule-based system (web-mining flag count thresholds, suspicious keyword dictionaries, abnormal session duration spikes) with ML anomaly scoring from an Isolation Forest model. Any device exceeding two web-mining flags or exhibiting mass-form-submission patterns is classified as High Risk.' },
  { q: 'Is user data anonymized?', a: 'Yes. The collection daemon assigns random device IDs at startup. No names, login credentials, or message content is ever stored. Only behavioral metrics (app usage percentages, session durations, aggregate sentiment scores) are processed. Data is cleared after each analysis session.' },
  { q: 'What CSV format does the uploader expect?', a: 'The CSV must contain these columns: device_id, screen_time (numeric hours), app_category_logs (JSON string of category:percentage pairs), keyboard_sentiment (float, -1 to +1), and web_mining_flag (integer 0-3). Download the sample CSV from the Reports page to get started.' },
  { q: 'Can I run this on a production server?', a: 'Yes. The FastAPI backend can be deployed as a Docker container (Dockerfile included). The React frontend builds to a static bundle with `npm run build` and can be served via Nginx, Vercel, or any CDN. The daemon tracker runs as a systemd service on Linux-based systems.' },
];

export default function HowItWorksPage() {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <>
      <div className="board-header">
        <div>
          <h1>How It Works</h1>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.9rem' }}>
            System architecture, pipeline overview, tech stack & frequently asked questions
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>v2.4 Production</span>
          <span className="badge" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)' }}>MIT License</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Timeline */}
        <div className="panel glass-panel slide-in" style={{ gridColumn: '1 / -1' }}>
          <h2 className="panel-title">End-to-End System Pipeline</h2>
          <div className="timeline">
            {timelineSteps.map((s, i) => (
              <div key={i} className="timeline-item">
                <div className="timeline-dot" style={{ borderColor: s.color, boxShadow: `0 0 12px ${s.color}60` }}>
                  <div className="timeline-dot-inner" style={{ background: s.color }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1 }}>
                    <div className="timeline-title">
                      <span style={{ marginRight: '0.5rem' }}>{s.icon}</span>
                      <span style={{ color: s.color, fontFamily: 'Space Grotesk' }}>Step {i + 1}: </span>{s.title}
                    </div>
                    <div className="timeline-desc">{s.desc}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', flexShrink: 0, paddingTop: '0.1rem' }}>
                    {s.tech.map((t, j) => (
                      <span key={j} style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: `${s.color}15`, color: s.color, border: `1px solid ${s.color}30`, fontWeight: 600 }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div className="panel glass-panel slide-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="panel-title">🛠️ Technology Stack</h2>
          <div className="tech-grid">
            {techStack.map((t, i) => (
              <div key={i} className="tech-badge"
                style={{ transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = t.color; e.currentTarget.style.color = t.color; e.currentTarget.style.background = `${t.color}10`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.color = ''; e.currentTarget.style.background = ''; }}>
                <span>{t.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.8rem', color: 'inherit' }}>{t.name}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="panel glass-panel slide-in" style={{ animationDelay: '0.3s' }}>
          <h2 className="panel-title">❓ Frequently Asked Questions</h2>
          <div>
            {faqItems.map((item, i) => (
              <div key={i} className="accordion-item">
                <div className="accordion-header" onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                  {item.q}
                  <span style={{ color: 'var(--accent)', transition: 'transform 0.2s', transform: openFaq === i ? 'rotate(45deg)' : 'none', fontSize: '1.2rem' }}>+</span>
                </div>
                {openFaq === i && (
                  <div className="accordion-body fade-in">{item.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Author card */}
      <div className="panel glass-panel slide-in" style={{ animationDelay: '0.4s', marginTop: '1.5rem', background: 'linear-gradient(135deg, rgba(56,189,248,0.06), rgba(129,140,248,0.06))', border: '1px solid rgba(56,189,248,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #38bdf8, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', flexShrink: 0, boxShadow: '0 0 24px rgba(56,189,248,0.3)' }}>
            👩‍💻
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Space Grotesk', fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-bright)', marginBottom: '0.2rem' }}>
              Customer Behaviour Prediction Platform
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', lineHeight: '1.6' }}>
              An advanced, production-grade AI system for real-time web usage mining and behavioural prediction. Built with a full-stack ML pipeline from OS-level data collection to interactive React dashboard — ideal for enterprise analytics, academic research, and portfolio demonstration.
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {['Machine Learning','Web Mining','FastAPI','React','Data Analytics','Fraud Detection'].map((t, i) => (
                <span key={i} className="badge" style={{ background: 'rgba(56,189,248,0.1)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.25)' }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
