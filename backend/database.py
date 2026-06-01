from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from datetime import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./emotions.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class EmotionLog(Base):
    __tablename__ = "emotion_logs"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(String, index=True)
    dominant_emotion = Column(String, index=True)
    confidence = Column(Float)
    timestamp = Column(DateTime, default=datetime.utcnow)
