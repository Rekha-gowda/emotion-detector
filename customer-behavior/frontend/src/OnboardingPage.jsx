import { useState, useEffect } from 'react';

const slides = [
  {
    emoji: '🧠',
    title: <>Your Digital <span className="accent-word">Mind Mirror</span></>,
    desc: 'BehaviourAI silently tracks how you spend time online — then shows you exactly what your browsing says about your mood and mental state.',
    bg1: 'rgba(99,102,241,0.25)', bg2: 'rgba(168,85,247,0.15)',
  },
  {
    emoji: '🌐',
    title: <>Every Click <span className="accent-word">Reveals You</span></>,
    desc: 'Web Usage Mining analyses your URL patterns, app sessions, and scroll behaviour to classify what you\'re really doing — studying, entertaining yourself, or shopping.',
    bg1: 'rgba(56,189,248,0.2)', bg2: 'rgba(16,185,129,0.12)',
  },
  {
    emoji: '💡',
    title: <>Live Mood <span className="accent-word">Intelligence</span></>,
    desc: 'Every time you open the app, it reads your latest activity and shows your mood ring — Anxious, Focused, Relaxed, Stressed or Entertained — updated in real time.',
    bg1: 'rgba(245,158,11,0.18)', bg2: 'rgba(239,68,68,0.12)',
  },
];

export default function OnboardingPage({ onDone }) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState('forward');

  const next = () => {
    if (idx < slides.length - 1) { setDir('forward'); setIdx(i => i + 1); }
    else onDone();
  };
  const back = () => { if (idx > 0) { setDir('back'); setIdx(i => i - 1); } };
  const skip = () => onDone();

  const slide = slides[idx];

  return (
    <div className="onboarding">
      {/* Animated orb background */}
      <div className="onboarding-bg">
        <div className="onboarding-orb" style={{ width: 350, height: 350, background: slide.bg1, top: -80, right: -80, animationDelay: '0s' }} />
        <div className="onboarding-orb" style={{ width: 280, height: 280, background: slide.bg2, bottom: 80, left: -60, animationDelay: '3s' }} />
      </div>

      {/* Skip */}
      {idx < slides.length - 1 && (
        <div style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', zIndex: 10 }}>
          <button className="btn btn-ghost" style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }} onClick={skip}>Skip</button>
        </div>
      )}

      {/* Slide content */}
      <div
        className="onboarding-slide"
        key={idx}
        style={{ animation: `${dir === 'forward' ? 'onboardSlide' : 'onboardSlideBack'} 0.45s cubic-bezier(.25,.46,.45,.94) both` }}
      >
        <div className="onboarding-visual">{slide.emoji}</div>
        <h1 className="onboarding-title">{slide.title}</h1>
        <p className="onboarding-desc">{slide.desc}</p>

        {/* Progress dots */}
        <div className="onboarding-dots">
          {slides.map((_, i) => (
            <div key={i} className={`onboarding-dot ${i === idx ? 'active' : ''}`} onClick={() => setIdx(i)} style={{ cursor: 'pointer' }} />
          ))}
        </div>

        {/* Feature chips */}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.8rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            ['🔒', 'Privacy-first'],
            ['⚡', 'Real-time'],
            ['🤖', 'AI-Powered'],
          ][idx].map ? null : null}
          {[
            [['🔒 Privacy-first', '#10b981'], ['⚡ Real-time', '#38bdf8'], ['🎯 Accurate', '#a78bfa']],
            [['🌐 Web Mining', '#38bdf8'], ['📊 Usage Analysis', '#10b981'], ['🛒 Shopping AI', '#f59e0b']],
            [['😌 Mood Ring', '#6366f1'], ['📅 Daily Updates', '#a78bfa'], ['💡 Insights', '#f59e0b']],
          ][idx].map(([label, color], i) => (
            <span key={i} className="chip" style={{ background: `${color}18`, color, border: `1px solid ${color}30`, animationDelay: `${i * 0.08}s` }}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Footer buttons */}
      <div className="onboarding-footer">
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          {idx > 0 && (
            <button className="btn btn-ghost" onClick={back} style={{ flexShrink: 0 }}>← Back</button>
          )}
          <button className="btn btn-primary btn-lg btn-block" onClick={next}>
            {idx === slides.length - 1 ? '🚀 Start Tracking My Behaviour' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
}
