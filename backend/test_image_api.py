import requests
import io
from PIL import Image

# Create dummy image
img = Image.new('RGB', (224, 224), color = 'red')
img_bytes = io.BytesIO()
img.save(img_bytes, format='JPEG')
img_bytes.seek(0)

# Submit to running uvicorn instance
files = {'file': ('test.jpg', img_bytes, 'image/jpeg')}
try:
    res = requests.post("http://localhost:8000/api/analyze-image", files=files)
    print("Analyze Image:", res.status_code, res.text)
except Exception as e:
    print("Error:", e)

