from fastapi import FastAPI, Depends, HTTPException, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import database
import os
import logging
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.responses import JSONResponse
import traceback

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Initialize DB
database.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Emotion Detection API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

class EmotionResult(BaseModel):
    label: str
    score: float

class AnalyzeRequest(BaseModel):
    text: str
    dominant_emotion: str = "neutral"
    confidence: float = 1.0
    all_scores: List[EmotionResult] = []

class AnalyzeResponse(BaseModel):
    id: int
    text: str
    dominant_emotion: str
    confidence: float
    all_scores: List[EmotionResult]

# -------------------------------------------------------------
# THESE ENDPOINTS NOW ONLY ACT AS DATABASE LOGGERS
# Client-side Transformers.js does the actual heavy ML work.
# -------------------------------------------------------------

@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze_text(request: AnalyzeRequest, db: Session = Depends(get_db)):
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    db_log = database.EmotionLog(
        text=request.text,
        dominant_emotion=request.dominant_emotion,
        confidence=request.confidence
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    
    return {
        "id": db_log.id,
        "text": db_log.text,
        "dominant_emotion": request.dominant_emotion,
        "confidence": request.confidence,
        "all_scores": [{"label": r.label, "score": r.score} for r in request.all_scores]
    }

class ImageAnalyzeRequest(BaseModel):
    summary: str
    dominant_emotion: str
    confidence: float
    faces_count: int
    faces: List[Any]

@app.post("/api/analyze-image-log")
def log_image_analysis(req: ImageAnalyzeRequest, db: Session = Depends(get_db)):
    db_log = database.EmotionLog(
        text=req.summary,
        dominant_emotion=req.dominant_emotion,
        confidence=req.confidence
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return {"status": "ok"}

# Legacy /api/analyze-image endpoint removed because ML face processing is now 
# entirely securely processed client-side via WebAssembly in the browser.

class DrawingAnalyzeRequest(BaseModel):
    prediction: str

@app.post("/api/analyze-drawing-log")
def log_drawing_analysis(req: DrawingAnalyzeRequest, db: Session = Depends(get_db)):
    db_log = database.EmotionLog(
        text=f"Drawing recognized as: {req.prediction}",
        dominant_emotion="neutral",
        confidence=1.0
    )
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return {"status": "ok"}


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

# Serve React static files
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")

    @app.exception_handler(404)
    async def custom_404_handler(request, exc):
        index_path = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_path) and not request.url.path.startswith("/api/"):
            return FileResponse(index_path)
        return exc

    @app.exception_handler(Exception)
    async def global_exception_handler(request, exc):
        return JSONResponse(
            status_code=500,
            content={"detail": "Internal Server Error", "error": str(exc), "traceback": traceback.format_exc()}
        )
