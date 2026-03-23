FROM python:3.10-slim

WORKDIR /app

# 1. Install system dependencies (Node.js is required for Prisma)
RUN apt-get update && apt-get install -y \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# 2. Copy requirements first (better for Docker caching)
COPY backend/search-service/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install "elasticsearch>=8.0.0,<9.0.0" 

# 3. Copy the ENTIRE project (needed for the shared Prisma schema)
COPY . .

# 4. Set the environment variable to bypass Prisma version mismatches
ENV PRISMA_PY_DEBUG_GENERATOR=1

# 5. The "Prisma Fix" Sequence:
# Move the config file, generate the client, and move it back.
# We do this in the directory where the config lives.
RUN cd packages/database && \
    mv prisma.config.ts prisma.config.ts.build_bak && \
    npx prisma@5.17.0 generate --generator py_client --schema=./prisma/schema.prisma && \
    mv prisma.config.ts.build_bak prisma.config.ts

EXPOSE 8001

CMD ["python", "backend/search-service/main.py"]