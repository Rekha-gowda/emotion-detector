import React, { useState } from 'react';
import { Upload, Loader2, Image as ImageIcon } from 'lucide-react';

export default function ClassificationPanel() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const analyzeImageBlob = async (file) => {
    setLoading(true);
    setError(null);
    setResult(null);

    const url = URL.createObjectURL(file);

    try {
      const { pipeline, env } = await import('@xenova/transformers');
      env.allowLocalModels = false;
      const classifier = await pipeline('image-classification', 'Xenova/vit-base-patch16-224');
      const predictions = await classifier(url, { topk: 5 });
      setResult({ predictions });
    } catch (err) {
      setError(err.message || 'Failed to connect to ML Engine locally.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setImagePreview(URL.createObjectURL(file));
    analyzeImageBlob(file);
  };

  return (
    <div className="glass-panel animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animationDelay: '0.1s' }}>
      <h2>Object Classification Engine</h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        Upload an image of an object, animal, or scene. The Vision Transformer (ViT) model will attempt to classify what it sees.
      </p>

      <label style={{ 
        border: '2px dashed var(--border-color)', 
        borderRadius: '12px', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        cursor: 'pointer',
        padding: imagePreview ? '1rem' : '3rem 1rem',
        background: 'rgba(0,0,0,0.2)',
        transition: 'background 0.3s'
      }}>
         <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
         {imagePreview ? (
           <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', objectFit: 'contain' }} />
         ) : (
           <>
             <Upload size={32} style={{ marginBottom: '1rem', color: 'var(--accent-color)' }} />
             <span style={{ color: 'var(--text-muted)' }}>Click to upload an image to classify</span>
           </>
         )}
      </label>

      {error && <div style={{ color: 'var(--emotion-anger)' }}>{error}</div>}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center', padding: '1rem' }}>
          <Loader2 size={24} className="spin" style={{ color: 'var(--accent-color)' }} />
          <span>Extracting features & classifying...</span>
        </div>
      )}

      {result && result.predictions && !loading && (
        <div className="animate-in" style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px' }}>
          <h3 style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Top Predictions</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {result.predictions.map((pred, i) => (
              <div key={i} style={{ 
                padding: '1rem', 
                background: i === 0 ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)', 
                borderRadius: '8px',
                borderLeft: i === 0 ? '4px solid var(--accent-color)' : '4px solid transparent'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ fontWeight: i === 0 ? 'bold' : 'normal', textTransform: 'capitalize', fontSize: i === 0 ? '1.1rem' : '1rem' }}>
                    {pred.label}
                  </span>
                  <span style={{ color: i === 0 ? 'var(--accent-color)' : 'var(--text-muted)' }}>
                    {(pred.score * 100).toFixed(1)}%
                  </span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', 
                      width: `${pred.score * 100}%`,
                      background: i === 0 ? 'var(--accent-color)' : 'var(--text-muted)',
                      borderRadius: '3px'
                    }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <style>{`
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
