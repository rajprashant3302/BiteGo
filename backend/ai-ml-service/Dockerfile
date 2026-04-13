# FROM python:3.10

# WORKDIR /app

# # 1. Install Node.js & OpenSSL (Crucial for Prisma)
# RUN apt-get update && apt-get install -y \
#     nodejs \
#     npm \
#     openssl \
#     && rm -rf /var/lib/apt/lists/*

# # 2. Copy the entire project context
# COPY . .

# # 3. Install AI-ML dependencies
# RUN pip install -r backend/ai-ml-service/requirements.txt

# # 4. Generate Prisma Python client
# RUN cd packages/database && \
#     npx prisma@5.17.0 generate --schema=./prisma/schema.prisma

# # --- THE FIX: SET THE RIGHT WORKING DIRECTORY FOR PYTHON ---
# # This ensures that when we run uvicorn, it sees the 'src' folder as a root package
# WORKDIR /app/backend/ai-ml-service

# ENV PYTHONPATH=/app/backend/ai-ml-service
# ENV PYTHONUNBUFFERED=1

# EXPOSE 8000

# # Start the service using the internal 'src' path
# CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]


FROM python:3.10

WORKDIR /app

# 1. Install system deps (cached)
RUN apt-get update && apt-get install -y \
    nodejs \
    npm \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# 2. Copy ONLY requirements (important for caching)
COPY backend/ai-ml-service/requirements.txt ./requirements.txt

# 3. Install Python deps (runs ONLY if requirements change)
RUN pip install --no-cache-dir -r requirements.txt

# 4. Copy Prisma schema only (for caching)
COPY packages/database/prisma ./packages/database/prisma

# 5. Generate Prisma client (runs only if schema changes)
RUN cd packages/database && \
    npx prisma@5.17.0 generate --schema=./prisma/schema.prisma

# 6. NOW copy full project (frequent changes)
COPY . .

# 7. Set working dir
WORKDIR /app/backend/ai-ml-service

# 8. Environment
ENV PYTHONPATH=/app/backend/ai-ml-service
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]