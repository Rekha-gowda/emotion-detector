# Stage 1: Build React frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Python Backend & Static files
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies for OpenCV/deepface
RUN apt-get update && apt-get install -y libgl1 libglib2.0-0 && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Pre-download ML models so they are cached in the Docker image (prevents Render request timeouts)
RUN python -c "\
import os; \
os.environ['HF_HUB_DISABLE_SYMLINKS_WARNING'] = '1'; \
from transformers import pipeline, TrOCRProcessor, VisionEncoderDecoderModel; \
pipeline('text-classification', model='j-hartmann/emotion-english-distilroberta-base', top_k=None); \
pipeline('text-classification', model='cardiffnlp/twitter-roberta-base-sentiment-latest'); \
pipeline('text-classification', model='mrm8488/bert-tiny-finetuned-sms-spam-detection'); \
pipeline('image-classification', model='google/vit-base-patch16-224'); \
TrOCRProcessor.from_pretrained('microsoft/trocr-base-handwritten'); \
VisionEncoderDecoderModel.from_pretrained('microsoft/trocr-base-handwritten'); \
from deepface import DeepFace; \
DeepFace.build_model('VGG-Face'); \
DeepFace.build_model('Emotion'); \
" || true

# Copy backend code
COPY backend/ ./backend/

# Copy built frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Expose port and run uvicorn
EXPOSE 8000
WORKDIR /app/backend
CMD sh -c "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"
