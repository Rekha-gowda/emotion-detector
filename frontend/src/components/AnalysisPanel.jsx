import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

const COLORS = {
  joy: 'var(--emotion-joy)',
  sadness: 'var(--emotion-sadness)',
  anger: 'var(--emotion-anger)',
  fear: 'var(--emotion-fear)',
  surprise: 'var(--emotion-surprise)',
  disgust: 'var(--emotion-disgust)',
  neutral: 'var(--emotion-neutral)',
};

import { pipeline, env } from '@xenova/transformers';

// Disable local model paths to strictly use CDN
env.allowLocalModels = false;

export default function AnalysisPanel({ onNewAnalysis }) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    if (!text.trim()) return;
    
    setLoading(true);
    setResult(null);
    setError('');
    
    try {
      // 1. Run local browser ML inference
      const classifier = await pipeline('text-classification', 'Xenova/emotion-english-distilroberta-base');
      let out = await classifier(text, { topk: null });
      
      // Normalize array outputs
      let all_scores = Array.isArray(out) && Array.isArray(out[0]) ? out[0] : (Array.isArray(out) ? out : [out]);
      
      const top_emotion = all_scores.reduce((max, obj) => obj.score > max.score ? obj : max, all_scores[0]);
      
      const payload = {
        text: text,
        dominant_emotion: top_emotion.label,
        confidence: top_emotion.score,
        all_scores: all_scores.map(r => ({ label: r.label, score: r.score }))
      };

      // 2. Save log to backend
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        throw new Error('Database logging failed, but ML succeeded.');
      }
      
      setResult(payload);
      onNewAnalysis();
      setText(''); // clear after success
    } catch (err) {
      setError(err.message || 'Failed to analyze text using local ML Engine.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-panel animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animationDelay: '0.1s' }}>
      <h2>Text Analysis</h2>
      
      <textarea 
        placeholder="Type something to analyze its emotional undertone. E.g. 'I am so incredibly happy with this product!'"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={loading}
      />
      
      <button onClick={handleAnalyze} disabled={loading || !text.trim()} style={{ alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={18} />}
        {loading ? 'Running ML inference...' : 'Analyze Emotion'}
      </button>

      {error && (
        <div style={{ color: 'var(--emotion-anger)', marginTop: '0.5rem', fontSize: '0.9rem' }}>
          {error}
        </div>
      )}

      {loading && (
        <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', marginTop: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '12px' }}>
          <Loader2 size={32} style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-color)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--text-muted)' }}>Analyzing emotional undertones...</p>
        </div>
      )}

      {result && !loading && (
        <div className="animate-in" style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Dominant Emotion</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
            <span style={{ 
              fontSize: '2.5rem', 
              fontWeight: '700', 
              color: COLORS[result.dominant_emotion.toLowerCase()] || 'white',
              textTransform: 'capitalize',
              textShadow: `0 0 20px ${COLORS[result.dominant_emotion.toLowerCase()] || 'transparent'}`
            }}>
              {result.dominant_emotion}
            </span>
            <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>
              {(result.confidence * 100).toFixed(1)}% Confidence
            </span>
          </div>
          
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Model Score Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {result.all_scores
              .sort((a, b) => b.score - a.score)
              .map((scoreObj) => (
              <div key={scoreObj.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-main)' }}>
                  <span style={{ textTransform: 'capitalize' }}>{scoreObj.label}</span>
                  <span>{(scoreObj.score * 100).toFixed(1)}%</span>
                </div>
                <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${scoreObj.score * 100}%`,
                    background: COLORS[scoreObj.label.toLowerCase()] || 'var(--accent-color)',
                    borderRadius: '4px',
                    transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
