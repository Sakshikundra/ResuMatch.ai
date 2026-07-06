FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code
COPY backend/ ./backend/

# Create data directory for uploads
RUN mkdir -p data

# Expose port (Hugging Face Spaces uses port 7860 by default)
EXPOSE 7860

# Run the FastAPI server
CMD ["uvicorn", "backend.api:app", "--host", "0.0.0.0", "--port", "7860"]
