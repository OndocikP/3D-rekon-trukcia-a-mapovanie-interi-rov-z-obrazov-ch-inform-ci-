FROM python:3.11-slim

WORKDIR /app

# Inštaluj dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Skopíruj aplikáciu
COPY . .

# Expose port
EXPOSE 8000

# Najskôr inicializuj DB, potom spustí aplikáciu
CMD python init_db.py && uvicorn main:app --host 0.0.0.0 --port 8000
