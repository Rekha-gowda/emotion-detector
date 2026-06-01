import React, { useState } from 'react';
import { Loader2, Shield, Heart } from 'lucide-react';

export default function SentimentSpamPanel() {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [mode, setMode] = useState(''); // 'analyze-sentiment' or 'detect-spam'
  const [error, setError] = useState('');

  const handleAnalyze = async (endpoint) => {
    if (!text.trim()) return;
    setLoading(true); setResult(null); setError(''); setMode(endpoint);
    
    try {
      const res = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      if (!res.ok) throw new Error(`${endpoint} failed`);
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to connect to ML Engine.');
    } finally {
      setLoading(false);
    }
  };

  // Convert HuggingFace typical labels like LABEL_1 to user-friendly text
  const formatLabel = (lbl) => {
    if (!lbl) return '';
    let val = lbl.toUpperCase();
    if (val === 'LABEL_1') return 'SPAM';
    if (val === 'LABEL_0') return 'NOT SPAM (HAM)';
    return val;
  };

  return (
    <div className="glass-panel animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animationDelay: '0.1s' }}>
      <h2>Deep NLP Diagnostics</h2>
      
      <textarea 
        placeholder="Type a message to analyze its sentiment or scan for spam content."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading}
      />
      
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button onClick={() => handleAnalyze('analyze-sentiment')} disabled={loading || !text.trim()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
          {loading && mode === 'analyze-sentiment' ? <Loader2 size={18} className="spin" /> : <Heart size={18} />}
          Deep Sentiment Analysis
        </button>
        <button onClick={() => handleAnalyze('detect-spam')} disabled={loading || !text.trim()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, background: 'linear-gradient(135deg, #ef4444, #b91c1c)' }}>
          {loading && mode === 'detect-spam' ? <Loader2 size={18} className="spin" /> : <Shield size={18} />}
          Check Spam Probability
        </button>
      </div>

      {error && <div style={{ color: 'var(--emotion-anger)' }}>{error}</div>}

      {loading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '2rem 0' }}>
          <Loader2 size={32} className="spin" style={{ color: 'var(--accent-color)' }} />
          <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Running advanced deep learning sequence models...</p>
        </div>
      )}

      {result && !loading && mode === 'analyze-sentiment' && (
        <div className="animate-in" style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px' }}>
          <h3 style={{ color: 'var(--text-muted)' }}>Sentiment Interpretation</h3>
          <div style={{ fontSize: '2.5rem', fontWeight: 'bold', textTransform: 'capitalize', color: 'var(--text-main)', marginTop: '0.5rem' }}>
            {formatLabel(result.sentiment)}
          </div>
          <div style={{ color: 'var(--accent-color)' }}>Model Confidence: {(result.confidence * 100).toFixed(1)}%</div>
        </div>
      )}

      {result && !loading && mode === 'detect-spam' && (
        <div className="animate-in" style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px' }}>
          <h3 style={{ color: 'var(--text-muted)' }}>Spam Evaluation</h3>
          <div style={{ 
            fontSize: '2.5rem', fontWeight: 'bold', marginTop: '0.5rem',
            color: formatLabel(result.label) === 'SPAM' ? 'var(--emotion-anger)' : 'var(--emotion-joy)' 
          }}>
            {formatLabel(result.label)}
          </div>
          <div style={{ color: 'var(--text-muted)' }}>Confidence Score: {(result.confidence * 100).toFixed(1)}%</div>
        </div>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
