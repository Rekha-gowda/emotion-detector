import logging
logging.basicConfig(level=logging.INFO)
from transformers import pipeline
try:
    print("Loading emotion model...")
    emotion_classifier = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base", top_k=None)
    print("Loaded successfully")
except Exception as e:
    print("Error:", e)
