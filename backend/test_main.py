import pytest
from fastapi.testclient import TestClient
from main import app
from database import EmotionLog, Base, engine, SessionLocal

client = TestClient(app)

# Create a clean test database
Base.metadata.create_all(bind=engine)

def test_analyze_empty_text():
    response = client.post("/api/analyze", json={"text": "   "})
    assert response.status_code == 400
    assert response.json()["detail"] == "Text cannot be empty"

def test_analyze_valid_text():
    response = client.post("/api/analyze", json={"text": "I am so happy and joyful today!"})
    assert response.status_code == 200
    data = response.json()
    assert "dominant_emotion" in data
    assert data["dominant_emotion"] == "joy"
    assert "confidence" in data
    assert data["confidence"] > 0.5
    assert len(data["all_scores"]) > 0

def test_history_endpoint():
    response = client.get("/api/history?limit=1")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_stats_endpoint():
    response = client.get("/api/stats")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

# We mock images in full integration tests, but these basic tests ensure the API is structured correctly.
