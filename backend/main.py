from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any
from transformers import pipeline
import database
import os
import tempfile
import logging
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

# Initialize ML Model (Lazy Loading to save memory on startup)
emotion_classifier = None
ocr_processor = None
ocr_model = None
spam_classifier = None
sentiment_classifier = None
image_classifier = None

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
        
    global emotion_classifier
    if emotion_classifier is None:
        from transformers import pipeline
        logger.info("Loading Emotion Model...")
        os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"
        emotion_classifier = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base", top_k=None)

    results = emotion_classifier(request.text.strip())[0]
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
    # Save uploaded file to temp file
    fd, path = tempfile.mkstemp(suffix=".jpg")
    try:
        with os.fdopen(fd, 'wb') as f:
            f.write(await file.read())

        # Load image with PIL
        image = Image.open(path).convert("RGB")
        
        global ocr_processor, ocr_model
        if ocr_processor is None or ocr_model is None:
            from transformers import TrOCRProcessor, VisionEncoderDecoderModel
            logger.info("Loading OCR Model...")
            ocr_processor = TrOCRProcessor.from_pretrained("microsoft/trocr-base-handwritten")
            ocr_model = VisionEncoderDecoderModel.from_pretrained("microsoft/trocr-base-handwritten")

        # Run explicit TrOCR model
        pixel_values = ocr_processor(image, return_tensors="pt").pixel_values
        generated_ids = ocr_model.generate(pixel_values, max_new_tokens=30)
        prediction = ocr_processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
        
        # Save to database log just for history completeness
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
    finally:
        if os.path.exists(path):
            os.remove(path)

@app.post("/api/analyze-sentiment")
def analyze_sentiment(request: AnalyzeRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
    
    global sentiment_classifier
    if sentiment_classifier is None:
        from transformers import pipeline
        logger.info("Loading Sentiment Model...")
        sentiment_classifier = pipeline("text-classification", model="cardiffnlp/twitter-roberta-base-sentiment-latest")

    results = sentiment_classifier(request.text.strip())[0]
    return {"sentiment": results['label'], "confidence": results['score']}

@app.post("/api/detect-spam")
def detect_spam(request: AnalyzeRequest):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    global spam_classifier
    if spam_classifier is None:
        from transformers import pipeline
        logger.info("Loading Spam Classifier...")
        spam_classifier = pipeline("text-classification", model="mrm8488/bert-tiny-finetuned-sms-spam-detection")

    results = spam_classifier(request.text.strip())[0]
    return {"label": results['label'], "confidence": results['score']}

@app.post("/api/classify-image")
async def classify_image(file: UploadFile = File(...)):
    fd, path = tempfile.mkstemp(suffix=".jpg")
    try:
        with os.fdopen(fd, 'wb') as f:
            f.write(await file.read())
        image = Image.open(path).convert("RGB")
        
        global image_classifier
        if image_classifier is None:
            from transformers import pipeline
            logger.info("Loading Image Classifier...")
            image_classifier = pipeline("image-classification", model="google/vit-base-patch16-224")

        results = image_classifier(image)
        return {"predictions": results}
    finally:
        if os.path.exists(path):
            os.remove(path)

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

