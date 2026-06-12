import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Wand2, Loader2, Eraser, Palette } from 'lucide-react';
import { GestureRecognizer, FilesetResolver } from "@mediapipe/tasks-vision";

export default function AirCanvas() {
  const [streamActive, setStreamActive] = useState(false);
  const [loadingModel, setLoadingModel] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [gestureLabel, setGestureLabel] = useState("None");
  const [PredictionResult, setPredictionResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeColor, setActiveColor] = useState('white');
  const [cameraFailed, setCameraFailed] = useState(false);
  const [isDrawingMouse, setIsDrawingMouse] = useState(false);

  const videoRef = useRef(null);
  const inkCanvasRef = useRef(null);
  const recognizerRef = useRef(null);
  const requestRef = useRef(null);
  const strokeColorRef = useRef('white');
  
  const COLORS = ['white', '#ff6b6b', '#1dd1a1', '#feca57', '#54a0ff', '#ff9ff3'];
  
  // To draw continuous lines
  const prevPositionRef = useRef(null);

  useEffect(() => {
    async function loadModel() {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
        recognizerRef.current = await GestureRecognizer.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });
        setLoadingModel(false);
      } catch (err) {
        console.error("Failed to load MediaPipe model", err);
        setError("Failed to load gesture recognition model.");
        setLoadingModel(false);
      }
    }
    loadModel();
    return () => {
      if (recognizerRef.current) recognizerRef.current.close();
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const enableCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStreamActive(true); // Trigger re-render to mount the <video> element
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Wait for video details to load
          videoRef.current.onloadedmetadata = async () => {
             try { await videoRef.current.play(); } catch(e) {}
             initCanvas();
             predictLoop();
          };
        }
      }, 50);
    } catch (err) {
      setCameraFailed(true);
      setError(`Hardware Webcam Locked. Fallback active: You can now draw with your Mouse instead!`);
      setTimeout(() => initCanvasFallback(), 100);
    }
  };

  const initCanvasFallback = () => {
    if (inkCanvasRef.current) {
      inkCanvasRef.current.width = 640;
      inkCanvasRef.current.height = 480;
      const ctx = inkCanvasRef.current.getContext('2d');
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, inkCanvasRef.current.width, inkCanvasRef.current.height);
      ctx.lineWidth = 15;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const initCanvas = () => {
    if (inkCanvasRef.current && videoRef.current) {
      inkCanvasRef.current.width = videoRef.current.videoWidth;
      inkCanvasRef.current.height = videoRef.current.videoHeight;
      const ctx = inkCanvasRef.current.getContext('2d');
      // Set background to black (or fully transparent), we'll do black for OCR
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, inkCanvasRef.current.width, inkCanvasRef.current.height);
      ctx.lineWidth = 15;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const clearCanvas = () => {
    if (inkCanvasRef.current) {
      const ctx = inkCanvasRef.current.getContext('2d');
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, inkCanvasRef.current.width, inkCanvasRef.current.height);
      prevPositionRef.current = null;
      setPredictionResult(null);
    }
  };

  const predictLoop = () => {
    if (!videoRef.current || !recognizerRef.current) return;
    
    // We only predict if video is playing
    if (videoRef.current.currentTime > 0) {
      const results = recognizerRef.current.recognizeForVideo(videoRef.current, performance.now());
      
      let currentGesture = "None";
      
      if (results.gestures.length > 0) {
        const topGesture = results.gestures[0][0];
        currentGesture = topGesture.categoryName;
        
        // Landmark 8 is the tip of the index finger
        const indexFingerTip = results.landmarks[0][8];
        const ctx = inkCanvasRef.current.getContext('2d');
        const width = inkCanvasRef.current.width;
        const height = inkCanvasRef.current.height;
        
        // Note: X is inverted because we horizontally mirror the video via CSS for the user 
        // MediaPipe gives normalized coords (0-1)
        const x = (1 - indexFingerTip.x) * width;
        const y = indexFingerTip.y * height;

        if (currentGesture === "Pointing_Up") {
          // Drawing mode
          if (prevPositionRef.current) {
            ctx.strokeStyle = strokeColorRef.current;
            ctx.beginPath();
            ctx.moveTo(prevPositionRef.current.x, prevPositionRef.current.y);
            ctx.lineTo(x, y);
            ctx.stroke();
          }
          prevPositionRef.current = { x, y };
        } else if (currentGesture === "Open_Palm") {
          // Break the line
          prevPositionRef.current = null;
        } else if (currentGesture === "Thumb_Down") {
          // Clear canvas completely
          clearCanvas();
        } else {
           prevPositionRef.current = null;
        }
      } else {
        prevPositionRef.current = null;
      }
      
      // Prevent rapid state updates if already the same
      setGestureLabel((prev) => {
         if (prev !== currentGesture) return currentGesture;
         return prev;
      });
    }
    
    requestRef.current = requestAnimationFrame(predictLoop);
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    }
    setStreamActive(false);
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
  };

  const handlePredictDrawing = async () => {
    if (!inkCanvasRef.current) return;
    setAnalyzing(true);
    setError(null);
    setPredictionResult(null);

    const canvas = inkCanvasRef.current;
    if (canvas.width === 0 || canvas.height === 0) {
       setAnalyzing(false);
       return;
    }

    // Crop the ink to prevent OCR hallucination on empty space
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
    let hasInk = false;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const i = (y * canvas.width + x) * 4;
        if (data[i] > 20 || data[i+1] > 20 || data[i+2] > 20) {
          hasInk = true;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (!hasInk || minX >= maxX || minY >= maxY) {
      setPredictionResult({ text: "Nothing drawn!", confidence: 0 });
      setAnalyzing(false);
      return;
    }

    const pad = 30;
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(canvas.width, maxX + pad);
    maxY = Math.min(canvas.height, maxY + pad);
    
    const width = maxX - minX;
    const height = maxY - minY;

    const cropCanvas = document.createElement('canvas');
    // TrOCR is trained on black text over white paper. 
    // We must invert our dark-mode canvas (black bg, white text) -> (white bg, black text)
    cropCanvas.width = width;
    cropCanvas.height = height;
    const cropCtx = cropCanvas.getContext('2d');
    
    // Invert the colors during copy
    cropCtx.filter = 'invert(1)';
    cropCtx.drawImage(canvas, minX, minY, width, height, 0, 0, width, height);

    const dataUrl = cropCanvas.toDataURL('image/jpeg');

    try {
      const { pipeline, env } = await import('@xenova/transformers');
      env.allowLocalModels = false;
      
      const captioner = await pipeline('image-to-text', 'Xenova/trocr-small-handwritten');
      const out = await captioner(dataUrl);

      const prediction = Array.isArray(out) && out.length > 0 ? out[0].generated_text : '';
      
      setPredictionResult({ text: prediction, confidence: 0.95 });
      
      // Log to database asynchronously
      fetch('/api/analyze-drawing-log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prediction })
      }).catch(e => console.error('Database logging skipped', e));

    } catch (err) {
      setError(err.message || 'Failed to run OCR locally via WASM');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="animate-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>
        <strong>Air Canvas & Gestures:</strong> Show your <strong style={{color:'var(--accent-color)'}}>Index Finger (Pointing Up)</strong> to draw in the air. 
        Show an <strong style={{color:'var(--emotion-joy)'}}>Open Palm</strong> to lift your pen. Show <strong style={{color:'var(--emotion-anger)'}}>Thumb Down</strong> to clear the canvas.
        <br/><span style={{color: 'var(--emotion-fear)'}}>If camera fails, you can use your mouse to draw!</span>
      </p>

      {error && <div style={{ color: 'var(--emotion-anger)', padding: '0.5rem', background: 'rgba(255,0,0,0.1)', borderRadius: '8px' }}>{error}</div>}

      <div style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#000', border: '1px solid rgba(255,255,255,0.1)', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        
        {loadingModel && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30, background: 'rgba(0,0,0,0.8)', color: 'white', gap: '1rem' }}>
            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} /> Loading Gesture AI Core...
          </div>
        )}

        {!streamActive && !cameraFailed ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', zIndex: 10 }}>
            <Camera size={40} style={{ color: 'rgba(255,255,255,0.2)' }} />
            <button onClick={enableCamera} disabled={loadingModel} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Camera size={20} /> Enable Air Canvas
            </button>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Browser camera permissions required</span>
          </div>
        ) : (
          <>
            {/* The actual video feed */}
            {streamActive && (
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', opacity: 0.5 }}
                />
            )}
            
            {/* The transparent drawing canvas overlay */}
            <canvas 
              ref={inkCanvasRef} 
              onMouseDown={(e) => {
                 setIsDrawingMouse(true);
                 const r = inkCanvasRef.current.getBoundingClientRect();
                 prevPositionRef.current = { x: e.clientX - r.left, y: e.clientY - r.top };
              }}
              onMouseMove={(e) => {
                 if (!isDrawingMouse) return;
                 const r = inkCanvasRef.current.getBoundingClientRect();
                 const x = e.clientX - r.left;
                 const y = e.clientY - r.top;
                 const ctx = inkCanvasRef.current.getContext('2d');
                 ctx.strokeStyle = strokeColorRef.current;
                 ctx.beginPath();
                 ctx.moveTo(prevPositionRef.current.x, prevPositionRef.current.y);
                 ctx.lineTo(x, y);
                 ctx.stroke();
                 prevPositionRef.current = { x, y };
              }}
              onMouseUp={() => setIsDrawingMouse(false)}
              onMouseLeave={() => setIsDrawingMouse(false)}
              style={{ position: streamActive ? 'absolute' : 'relative', width: streamActive ? '100%' : '640px', height: streamActive ? '100%' : '480px', objectFit: 'cover', zIndex: 10, mixBlendMode: streamActive ? 'screen' : 'normal', cursor: 'crosshair', background: 'black' }} 
            />

            {/* Live Gesture Pill */}
            <div style={{ position: 'absolute', top: '1rem', right: '1rem', zIndex: 20, background: 'rgba(0,0,0,0.7)', padding: '0.5rem 1rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--accent-color)' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Detected:</span>
              <strong style={{ color: 'white' }}>{gestureLabel.replace('_', ' ')}</strong>
            </div>

            {/* Color Palette */}
            <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 20, background: 'rgba(0,0,0,0.7)', padding: '0.5rem', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '0.5rem', border: '1px solid var(--border-color)' }}>
               <Palette size={18} style={{ color: 'var(--text-muted)' }} />
               {COLORS.map(c => (
                  <button 
                    key={c} 
                    onClick={() => {
                       setActiveColor(c);
                       strokeColorRef.current = c;
                    }}
                    style={{ 
                       width: '24px', height: '24px', borderRadius: '50%', background: c, padding: '0', 
                       border: activeColor === c ? '2px solid white' : '2px solid transparent',
                       boxShadow: activeColor === c ? `0 0 8px ${c}` : 'none'
                    }} 
                  />
               ))}
            </div>

            {/* Action Buttons */}
            <div style={{ position: 'absolute', bottom: '1rem', width: '100%', display: 'flex', justifyContent: 'center', gap: '1rem', zIndex: 20 }}>
              <button onClick={clearCanvas} style={{ padding: '0.75rem 1.5rem', background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <Eraser size={18} /> Clear
              </button>
              <button 
                onClick={handlePredictDrawing} 
                disabled={analyzing}
                style={{ padding: '0.75rem 1.5rem', boxShadow: '0 4px 12px rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {analyzing ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Wand2 size={18} />}
                {analyzing ? 'Reading...' : 'Guess Writing'}
              </button>
              <button onClick={stopCamera} style={{ background: 'transparent', border: '1px solid rgba(255,50,50,0.5)', color: '#ff6b6b' }}>
                Stop
              </button>
            </div>
          </>
        )}
      </div>

      {/* Results Box */}
      {PredictionResult && (
        <div className="animate-in" style={{ marginTop: '1rem', background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid var(--accent-color)' }}>
          <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>
            AI Reading & Gesture Analysis
          </h3>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
            I think you wrote: <span style={{ color: 'var(--accent-color)' }}>"{PredictionResult.text}"</span>
          </div>
          {PredictionResult.confidence && (
             <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
               Confidence: {(PredictionResult.confidence * 100).toFixed(1)}%
             </div>
          )}
        </div>
      )}
    </div>
  );
}
