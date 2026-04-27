FROM python:3.10-slim

# Install build dependencies for confluent-kafka
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libc6-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend application code
COPY main.py .

# Copy static frontend files into the container
COPY static/ ./static/

# Create the data directory for messages.json and heartbeat.json
RUN mkdir -p /app/data

# Expose the internal port (mapped to 8080 in docker-compose)
EXPOSE 8000

# Run the Uvicorn server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
