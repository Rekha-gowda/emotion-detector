import React, { useRef, useState, useCallback } from 'react';
import { Camera, Upload, Loader2, Volume2, Wand2 } from 'lucide-react';
import AirCanvas from './AirCanvas';
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";

const EMOTION_COLORS = {
  joy: 'var(--emotion-joy)',
  happy: 'var(--emotion-joy)',
  sadness: 'var(--emotion-sadness)',
  sad: 'var(--emotion-sadness)',
  anger: 'var(--emotion-anger)',
  angry: 'var(--emotion-anger)',
  fear: 'var(--emotion-fear)',
  surprise: 'var(--emotion-surprise)',
  disgust: 'var(--emotion-disgust)',
  neutral: 'var(--emotion-neutral)',
};

export default function VisionPanel({ onNewAnalysis }) {
  const [mode, setMode] = useState('camera'); // 'camera', 'upload', or 'gestures'
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [streamActive, setStreamActive] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [autoAnalyze, setAutoAnalyze] = useState(false);
  const autoAnalyzeRef = useRef(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const faceDetectorRef = useRef(null);

  React.useEffect(() => {
    async function loadFaceModel() {
      try {
        const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm");
        faceDetectorRef.current = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
            delegate: "GPU"
          },
          runningMode: "IMAGE"
        });
      } catch (err) {
        console.error("Failed to load Face Detector", err);
      }
    }
    loadFaceModel();
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true 
      });
      setStreamActive(true); // Trigger re-render to mount the <video> element
      
      // We must wait until the DOM physically renders the video to attach the stream 
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = async () => {
             try { await videoRef.current.play(); } catch(e) {}
          };
        }
      }, 50);
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Camera access denied. Please allow permissions in Chrome.');
      } else {
        setError(`Hardware Camera Locked or Missing (${err.name}). Please use the 'Upload' tab above to test images instead!`);
      }
      console.error(err);
    }
  };

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setStreamActive(false);
    setAutoAnalyze(false);
  }, []);

  React.useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // Auto-analyze loop
  React.useEffect(() => {
    if (autoAnalyze && streamActive && mode === 'camera') {
      autoAnalyzeRef.current = setInterval(() => {
        // Only capture if we aren't currently waiting for a result
        setLoading(prev => {
           if (!prev) captureFrame();
           return prev; // keep same loading state until fetch finishes
        });
      }, 2500); // Analyze every 2.5 seconds
    } else {
      if (autoAnalyzeRef.current) clearInterval(autoAnalyzeRef.current);
    }
    return () => {
      if (autoAnalyzeRef.current) clearInterval(autoAnalyzeRef.current);
    };
  }, [autoAnalyze, streamActive, mode]); // removed captureFrame to avoid stale closures, wait captureFrame is useCallback

  const speakResult = (facesData, facesCount) => {
    if (!('speechSynthesis' in window)) return;
    
    let text = "";
    if (facesCount === 0) {
      text = "I couldn't detect any faces in this image.";
    } else if (facesCount === 1) {
      text = `I detect one face. The primary expression is ${facesData[0].dominant_emotion}.`;
    } else {
      text = `I detect ${facesCount} faces. `;
      const emotions = facesData.map(f => f.dominant_emotion);
      text += `The expressions are: ${emotions.join(', ')}.`;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 1;
    utterance.rate = 1;
    speechSynthesis.speak(utterance);
  };

  const analyzeImageBlob = async (blob) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const imageUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.src = imageUrl;
      await new Promise(r => img.onload = r);

      let detectedFaces = [];
      if (faceDetectorRef.current) {
         const faces = faceDetectorRef.current.detect(img);
         detectedFaces = faces.detections;
      }
      
      const { pipeline, env } = await import('@xenova/transformers');
      env.allowLocalModels = false;

      // Ensure model is cached
      const classifier = await pipeline('image-classification', 'Xenova/facial_emotions_image_detection');
      
      const faceDataList = [];

      if (detectedFaces.length > 0) {
         for (let detection of detectedFaces) {
             const bbox = detection.boundingBox;
             const cropCanvas = document.createElement('canvas');
             cropCanvas.width = bbox.width;
             cropCanvas.height = bbox.height;
             const cropCtx = cropCanvas.getContext('2d');
             cropCtx.drawImage(img, bbox.originX, bbox.originY, bbox.width, bbox.height, 0, 0, bbox.width, bbox.height);
             const cropUrl = cropCanvas.toDataURL('image/jpeg');
             
             let out = await classifier(cropUrl, { topk: null });
             let all_scores = Array.isArray(out) ? out : [out];
             const top_emotion = all_scores.reduce((max, obj) => obj.score > max.score ? obj : max, all_scores[0]);
             
             faceDataList.push({
               dominant_emotion: top_emotion.label,
               confidence: top_emotion.score * 100,
               all_scores: all_scores.map(r => ({ label: r.label, score: r.score }))
             });
         }
      }
      
      URL.revokeObjectURL(imageUrl);

      const resultData = {
        faces_count: detectedFaces.length,
        faces: faceDataList,
      };

      const topEm = faceDataList.length > 0 ? faceDataList[0].dominant_emotion : 'N/A';
      const topConf = faceDataList.length > 0 ? faceDataList[0].confidence / 100 : 0;

      // 2. Save log to backend
      const logPayload = {
        summary: `Image parsed: ${detectedFaces.length} face(s) counted. (Local Inference)`,
        dominant_emotion: topEm,
        confidence: topConf,
        faces_count: detectedFaces.length,
        faces: faceDataList
      };
      
      const res = await fetch('/api/analyze-image-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(logPayload)
      });

      if (!res.ok) {
        console.warn('Logging to backend failed, but local inference succeeded.');
      }

      setResult(resultData);
      onNewAnalysis();
      speakResult(resultData.faces, resultData.faces_count);
      
    } catch (err) {
      setError(err.message || 'Failed to connect to ML Engine.');
    } finally {
      setLoading(false);
    }
  };

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to blob and send
    canvas.toBlob((blob) => {
      setImagePreview(URL.createObjectURL(blob));
      analyzeImageBlob(blob);
    }, 'image/jpeg', 0.9);
  }, []);

  const handleFileUpload = (e) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    setImagePreview(URL.createObjectURL(file));
    analyzeImageBlob(file);
  };

  return (
    <div className="glass-panel animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', animationDelay: '0.1s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h2>Vision Engine</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => { setMode('camera'); setStreamActive(false); setImagePreview(null); setResult(null); }} 
            className="tab-btn" 
            style={{ padding: '0.5rem 1rem', background: mode === 'camera' ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)' }}>
            Camera
          </button>
          <button 
            onClick={() => { setMode('upload'); stopCamera(); setImagePreview(null); setResult(null); }} 
            className="tab-btn" 
            style={{ padding: '0.5rem 1rem', background: mode === 'upload' ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)' }}>
            Upload
          </button>
          <button 
            onClick={() => { setMode('gestures'); stopCamera(); setImagePreview(null); setResult(null); }} 
            className="tab-btn" 
            style={{ padding: '0.5rem 1rem', background: mode === 'gestures' ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Wand2 size={16} /> Air Canvas
          </button>
        </div>
      </div>

      {mode === 'camera' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
            Position your face clearly in the frame, then click <strong>Capture & Analyze</strong> to evaluate your facial expressions in real-time.
          </p>
          {!streamActive ? (
             <div style={{ 
               height: '240px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', 
               display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem',
               border: '1px dashed rgba(255,255,255,0.1)'
             }}>
               <Camera size={40} style={{ color: 'rgba(255,255,255,0.2)' }} />
               <button onClick={startCamera} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <Camera size={20} /> Enable Webcam
               </button>
               <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Browser camera permissions required</span>
             </div>
          ) : (
            <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#000' }}>
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted 
                style={{ width: '100%', borderRadius: '12px', transform: 'scaleX(-1)', display: 'block' }}
              />
              <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 10 }}>
                <button 
                  onClick={() => setAutoAnalyze(prev => !prev)}
                  style={{
                    background: autoAnalyze ? 'rgba(46, 213, 115, 0.2)' : 'rgba(0,0,0,0.5)',
                    border: `1px solid ${autoAnalyze ? '#2ed573' : 'rgba(255,255,255,0.2)'}`,
                    color: autoAnalyze ? '#2ed573' : 'white',
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.85rem',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  {autoAnalyze && <Loader2 size={14} style={{ animation: 'spin 1.5s linear infinite' }} />}
                  {autoAnalyze ? 'Live Analyzing' : 'Auto-Analyze'}
                </button>
              </div>
              {imagePreview && loading && !autoAnalyze && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 10, backdropFilter: 'blur(3px)' }}>
                   <img src={imagePreview} alt="Captured" style={{ maxWidth: '60%', maxHeight: '60%', borderRadius: '8px', border: '2px solid var(--accent-color)', marginBottom: '1rem', transform: 'scaleX(-1)' }} />
                   <div style={{ color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '500' }}>
                     <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Processing Image...
                   </div>
                </div>
              )}
              <button 
                onClick={captureFrame} 
                disabled={loading || autoAnalyze}
                style={{ position: 'absolute', bottom: '1rem', left: '50%', transform: 'translateX(-50%)', zIndex: 20, boxShadow: '0 4px 12px rgba(0,0,0,0.4)', padding: '0.75rem 1.5rem', opacity: autoAnalyze ? 0.3 : 1 }}>
                {loading && !autoAnalyze ? 'Analyzing...' : 'Capture Single Frame'}
              </button>
            </div>
          )}
        </div>
      )}

      {mode === 'upload' && (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <label style={{ 
              height: imagePreview ? 'auto' : '240px', 
              border: '2px dashed var(--border-color)', 
              borderRadius: '12px', 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              cursor: 'pointer',
              padding: imagePreview ? '1rem' : '0',
              background: 'rgba(0,0,0,0.2)'
            }}>
               <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileUpload} />
               {imagePreview ? (
                 <img src={imagePreview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', objectFit: 'contain' }} />
               ) : (
                 <>
                   <Upload size={32} style={{ marginBottom: '1rem', color: 'var(--text-muted)' }} />
                   <span style={{ color: 'var(--text-muted)' }}>Click to upload or drag an image here</span>
                 </>
               )}
            </label>
         </div>
      )}

      {mode === 'gestures' && (
        <AirCanvas />
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {error && <div style={{ color: 'var(--emotion-anger)' }}>{error}</div>}

      {result && (
        <div className="animate-in" style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Detected Faces: {result.faces_count}
            </h3>
            <Volume2 size={20} color="var(--accent-color)" />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {result.faces.map((f, i) => (
              <div key={i} style={{ 
                padding: '1rem', 
                background: 'rgba(255,255,255,0.05)', 
                borderRadius: '8px',
                borderLeft: `4px solid ${EMOTION_COLORS[f.dominant_emotion.toLowerCase()] || 'transparent'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: f.all_scores ? '1rem' : '0' }}>
                  <span style={{ fontWeight: '600', textTransform: 'capitalize' }}>
                    Face {i + 1}: {f.dominant_emotion}
                  </span>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Confidence: {f.confidence.toFixed(1)}%
                  </span>
                </div>
                
                {f.all_scores && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Score Breakdown</div>
                    {f.all_scores
                      .sort((a, b) => b.score - a.score)
                      .map((scoreObj) => (
                      <div key={scoreObj.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.3rem', color: 'var(--text-main)' }}>
                          <span style={{ textTransform: 'capitalize' }}>{scoreObj.label}</span>
                          <span>{(scoreObj.score * 100).toFixed(1)}%</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ 
                            height: '100%', 
                            width: `${scoreObj.score * 100}%`,
                            background: EMOTION_COLORS[scoreObj.label.toLowerCase()] || 'var(--accent-color)',
                            borderRadius: '3px',
                            transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)'
                          }} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {result.faces_count === 0 && (
              <p style={{ color: 'var(--text-muted)' }}>No faces were identified by the ML engine in this frame.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
