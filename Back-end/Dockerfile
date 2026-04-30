FROM python:3.11-slim

WORKDIR /app

# Inštaluj systémové dependencies pre OpenCV a YOLO
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Inštaluj dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Skopíruj aplikáciu
COPY . .

# Expose port
EXPOSE 8000

# Najskôr inicializuj DB, potom spustí aplikáciu
CMD python init_db.py && uvicorn main:app --host 0.0.0.0 --port 8000
