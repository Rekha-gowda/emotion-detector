from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any
import httpx
import database
import os
import tempfile
import logging
import gc
from PIL import Image

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize DB
database.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Emotion Detection API & Computer Vision")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

# HF REST API Fallback Function (replaces heavy PyTorch execution)
def hf_inference(model_id, payload, is_image=False, retries=3):
    url = f"https://api-inference.huggingface.co/models/{model_id}"
    headers = {}
    if os.environ.get("HF_TOKEN"):
        headers["Authorization"] = f"Bearer {os.environ.get('HF_TOKEN')}"
        
    for i in range(retries):
        try:
            if is_image:
                res = httpx.post(url, headers=headers, content=payload, timeout=30.0)
            else:
                res = httpx.post(url, headers=headers, json=payload, timeout=30.0)
                
            if res.status_code == 200:
                return res.json()
            elif res.status_code == 503:
                import time
                time.sleep(2)
                continue
            else:
                raise Exception(f"HF API Error: {res.text}")
        except Exception as e:
            if i == retries - 1:
                raise e
            import time
            time.sleep(2)
    raise Exception(f"HF API timeout/error for {model_id}")

class AnalyzeRequest(BaseModel):
    text: str

class EmotionResult(BaseModel):
    label: str
    score: float

class AnalyzeResponse(BaseModel):
    id: int
    text: str
    dominant_emotion: str
    confidence: float
    all_scores: List[EmotionResult]

@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze_text(request: AnalyzeRequest, db: Session = Depends(get_db)):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    logger.info("Calling HF API for Emotion Model...")
    results = hf_inference("j-hartmann/emotion-english-distilroberta-base", {"inputs": request.text.strip()})
    
    if isinstance(results, list) and isinstance(results[0], list):
        results = results[0] # unwrap batch
        
    top_emotion = max(results, key=lambda x: x['score'])
    
    db_log = database.EmotionLog(
        text=request.text,
        dominant_emotion=top_emotion['label'],
        confidence=top_emotion['score']
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    
    return {
        "id": db_log.id,
        "text": db_log.text,
        "dominant_emotion": top_emotion['label'],
        "confidence": top_emotion['score'],
        "all_scores": [{"label": r["label"], "score": r["score"]} for r in results]
    }

@app.post("/api/analyze-image")
async def analyze_image(file: UploadFile = File(...), db: Session = Depends(get_db)):
    from deepface import DeepFace
    # Save uploaded file to temp file
    fd, path = tempfile.mkstemp(suffix=".jpg")
    try:
        with os.fdopen(fd, 'wb') as f:
            f.write(await file.read())

        # Extract features using deepface
        # enforce_detection=False allows returning no faces if none found instead of crash
        results = DeepFace.analyze(img_path=path, actions=['emotion'], enforce_detection=False)
        
        # deepface returns a list of dictionaries if multiple faces
        if isinstance(results, dict):
            results = [results]
            
        faces_data = []
        for face in results:
            if face.get('emotion'):
                # find dominant emotion
                emotions_dict = face['emotion']
                dom_emo = max(emotions_dict, key=emotions_dict.get)
                conf = float(emotions_dict[dom_emo])
                all_scores = [{"label": k, "score": float(v) / 100.0} for k, v in emotions_dict.items()]
                faces_data.append({
                    "dominant_emotion": dom_emo,
                    "confidence": conf,
                    "region": face.get('region'),
                    "all_scores": all_scores
                })
        
        # Save a summary string to the DB
        summary = f"Image parsed: {len(faces_data)} face(s) counted."
        if len(faces_data) > 0:
            avg_emo = faces_data[0]["dominant_emotion"]
            conf = float(faces_data[0]["confidence"]) / 100.0
        else:
            avg_emo = "neutral"
            conf = 1.0

        db_log = database.EmotionLog(
            text=summary,
            dominant_emotion=avg_emo,
            confidence=conf
        )
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        
        # Garbage collect Keras backend dynamically
        try:
            import tf_keras as keras
            keras.backend.clear_session()
        except:
            pass
        gc.collect()
        
        return {
            "faces_count": len(faces_data),
            "faces": faces_data
        }

    except Exception as e:
        logger.error(f"Error in image analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": "Image analysis failed", "message": str(e)})
    finally:
        if os.path.exists(path):
            os.remove(path)

@app.post("/api/analyze-drawing")
async def analyze_drawing(file: UploadFile = File(...), db: Session = Depends(get_db)):
    image_bytes = await file.read()
    try:
        logger.info("Calling HF API for OCR Model...")
        results = hf_inference("microsoft/trocr-base-handwritten", image_bytes, is_image=True)
        
        prediction = ""
        # HF image-to-text API mostly returns [{'generated_text': '...'}]
        if isinstance(results, list) and len(results) > 0:
            prediction = results[0].get("generated_text", "")
            
        db_log = database.EmotionLog(
            text=f"Drawing recognized as: {prediction}",
            dominant_emotion="neutral",
            confidence=1.0
        )
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        
        return {
            "text": prediction,
            "confidence": 0.95
        }
        
    except Exception as e:
        logger.error(f"Error in drawing analysis: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": "Drawing analysis failed", "message": str(e)})

@app.post("/api/analyze-sentiment")
def analyze_sentiment(request: AnalyzeRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    logger.info("Calling HF API for Sentiment Model...")
    results = hf_inference("cardiffnlp/twitter-roberta-base-sentiment-latest", {"inputs": request.text.strip()})
    
    if isinstance(results, list) and isinstance(results[0], list):
        results = results[0]
        
    top_sentiment = max(results, key=lambda x: x['score'])
    return {"sentiment": top_sentiment['label'], "confidence": top_sentiment['score']}

@app.post("/api/detect-spam")
def detect_spam(request: AnalyzeRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    logger.info("Calling HF API for Spam Classifier...")
    results = hf_inference("mrm8488/bert-tiny-finetuned-sms-spam-detection", {"inputs": request.text.strip()})
    
    if isinstance(results, list) and isinstance(results[0], list):
        results = results[0]
        
    top_spam = max(results, key=lambda x: x['score'])
    return {"label": top_spam['label'], "confidence": top_spam['score']}

@app.post("/api/classify-image")
async def classify_image(file: UploadFile = File(...)):
    image_bytes = await file.read()
    try:
        logger.info("Calling HF API for Image Classifier...")
        results = hf_inference("google/vit-base-patch16-224", image_bytes, is_image=True)
        return {"predictions": results}
    except Exception as e:
        logger.error(f"Error in image classification: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail={"error": "Classification failed", "message": str(e)})

@app.get("/api/history")
def get_history(limit: int = 20, db: Session = Depends(get_db)):
    logs = db.query(database.EmotionLog).order_by(database.EmotionLog.timestamp.desc()).limit(limit).all()
    return logs

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    from sqlalchemy import func
    stats = db.query(
        database.EmotionLog.dominant_emotion, 
        func.count(database.EmotionLog.id)
    ).group_by(database.EmotionLog.dominant_emotion).all()
    
    return [{"emotion": row[0], "count": row[1]} for row in stats]

# Serve React static files in unified deployment
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")

    @app.exception_handler(404)
    async def custom_404_handler(request, exc):
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_path) and not request.url.path.startswith("/api/"):
            return FileResponse(index_path)
        return exc

    import traceback
    from fastapi.responses import JSONResponse
    
    @app.exception_handler(Exception)
    async def global_exception_handler(request, exc):
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error", "error": str(exc), "traceback": traceback.format_exc()}
        )
