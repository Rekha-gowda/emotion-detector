import React, { useState, useEffect } from 'react';
import AnalysisPanel from './components/AnalysisPanel';
import VisionPanel from './components/VisionPanel';
import Dashboard from './components/Dashboard';
import SentimentSpamPanel from './components/SentimentSpamPanel';
import ClassificationPanel from './components/ClassificationPanel';

function App() {
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState([]);
  const [view, setView] = useState('text');

  const fetchHistoryAndStats = async () => {
    try {
      const histRes = await fetch('/api/history');
      if (histRes.ok) {
        const data = await histRes.json();
        setHistory(data);
      }
      const statsRes = await fetch('/api/stats');
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch data", err);
    }
  };

  useEffect(() => {
    fetchHistoryAndStats();
  }, []);

  return (
    <>
      <header className="animate-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h1 className="text-gradient" style={{ fontSize: '3rem', margin: '0' }}>NeuroSentiment</h1>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
          Real-time Emotion Detection with Text Analysis & Facial Recognition
        </p>
        
        <div style={{ display: 'flex', gap: '1rem', background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <button 
            onClick={() => setView('text')} 
            style={{ 
              background: view === 'text' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'transparent',
              boxShadow: view === 'text' ? '0 4px 15px var(--accent-glow)' : 'none',
              color: view === 'text' ? 'white' : 'var(--text-muted)'
            }}>
            Emotion Text Mode
          </button>
          <button 
            onClick={() => setView('vision')} 
            style={{ 
              background: view === 'vision' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'transparent',
              boxShadow: view === 'vision' ? '0 4px 15px var(--accent-glow)' : 'none',
              color: view === 'vision' ? 'white' : 'var(--text-muted)'
            }}>
            Facial Vision Mode
          </button>
          <button 
            onClick={() => setView('sentiment')} 
            style={{ 
              background: view === 'sentiment' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'transparent',
              boxShadow: view === 'sentiment' ? '0 4px 15px var(--accent-glow)' : 'none',
              color: view === 'sentiment' ? 'white' : 'var(--text-muted)'
            }}>
            Deep NLP Mode
          </button>
          <button 
            onClick={() => setView('classify')} 
            style={{ 
              background: view === 'classify' ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'transparent',
              boxShadow: view === 'classify' ? '0 4px 15px var(--accent-glow)' : 'none',
              color: view === 'classify' ? 'white' : 'var(--text-muted)'
            }}>
            Object Classify Mode
          </button>
        </div>
      </header>
      
      <main className="grid-2" style={{ marginTop: '2rem' }}>
        {view === 'text' && <AnalysisPanel onNewAnalysis={fetchHistoryAndStats} />}
        {view === 'vision' && <VisionPanel onNewAnalysis={fetchHistoryAndStats} />}
        {view === 'sentiment' && <SentimentSpamPanel />}
        {view === 'classify' && <ClassificationPanel />}
        <Dashboard history={history} stats={stats} />
      </main>
    </>
  );
}

export default App;
