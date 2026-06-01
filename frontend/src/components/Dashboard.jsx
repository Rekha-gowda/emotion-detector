import React from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Pie } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const EMOTION_COLORS = {
  joy: 'rgba(16, 185, 129, 0.8)',
  sadness: 'rgba(100, 116, 139, 0.8)',
  anger: 'rgba(239, 68, 68, 0.8)',
  fear: 'rgba(139, 92, 246, 0.8)',
  surprise: 'rgba(245, 158, 11, 0.8)',
  disgust: 'rgba(217, 119, 6, 0.8)',
  neutral: 'rgba(203, 213, 225, 0.8)'
};

export default function Dashboard({ history = [], stats = [] }) {
  const chartData = {
    labels: stats.map(s => s.emotion.charAt(0).toUpperCase() + s.emotion.slice(1)),
    datasets: [
      {
        label: 'Emotions Distribution',
        data: stats.map(s => s.count),
        backgroundColor: stats.map(s => EMOTION_COLORS[s.emotion.toLowerCase()] || 'rgba(59, 130, 246, 0.8)'),
        borderColor: 'rgba(255,255,255,0.05)',
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#f8fafc',
          font: { family: "'Outfit', sans-serif" },
          padding: 20
        }
      }
    }
  };

  return (
    <div className="glass-panel animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', animationDelay: '0.2s', maxHeight: '100%' }}>
      <h2>History & Insights</h2>
      
      {stats.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <p>No emotions analyzed yet. Type something to get started!</p>
        </div>
      ) : (
        <>
          <div style={{ height: '240px', width: '100%', marginBottom: '1rem' }}>
            <Pie data={chartData} options={chartOptions} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Recent Analysis Log</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', overflowY: 'auto', paddingRight: '0.5rem', flex: 1 }}>
              {history.map((item) => (
                <div key={item.id} style={{ 
                  background: 'rgba(0,0,0,0.2)', 
                  padding: '1rem', 
                  borderRadius: '8px',
                  borderLeft: `4px solid ${EMOTION_COLORS[item.dominant_emotion.toLowerCase()]?.replace('0.8)', '1)') || 'var(--accent-color)'}`
                }}>
                  <div style={{ fontSize: '0.95rem', marginBottom: '0.6rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                    "{item.text}"
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span style={{ fontWeight: '600', color: EMOTION_COLORS[item.dominant_emotion.toLowerCase()]?.replace('0.8)', '1)') || 'white', textTransform: 'capitalize' }}>
                      {item.dominant_emotion} ({(item.confidence * 100).toFixed(1)}%)
                    </span>
                    <span>
                      {new Date(item.timestamp).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
      
      <style>{`
        div::-webkit-scrollbar {
          width: 6px;
        }
        div::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.1);
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.2);
          border-radius: 4px;
        }
        div::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.3);
        }
      `}</style>
    </div>
  );
}
