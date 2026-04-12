FROM python:3.10

WORKDIR /app

# 1. Install Node.js & OpenSSL (Crucial for Prisma)
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# 2. Copy the entire project context
COPY . .

# 3. Install AI-ML dependencies
RUN pip install -r backend/ai-ml-service/requirements.txt

# 4. Generate Prisma Python client
RUN cd packages/database && \
    npx prisma@5.17.0 generate --schema=./prisma/schema.prisma

# --- THE FIX: SET THE RIGHT WORKING DIRECTORY FOR PYTHON ---
# This ensures that when we run uvicorn, it sees the 'src' folder as a root package
WORKDIR /app/backend/ai-ml-service

ENV PYTHONPATH=/app/backend/ai-ml-service
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Start the service using the internal 'src' path
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]