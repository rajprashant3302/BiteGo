# FROM python:3.10

# WORKDIR /app

# COPY . .

# # Install Node.js (required for npx prisma)
# RUN apt-get update && \
#     apt-get install -y nodejs npm 

# # Install Python dependencies
# RUN pip install -r backend/search-service/requirements.txt

# # Generate Prisma Python client
# RUN cd packages/database && \
#     npx prisma@5.17.0 generate --generator py_client --schema=./prisma/schema.prisma

# RUN chmod +x backend/search-service/main.py
# RUN chmod +x backend/search-service/docker-entrypoint.sh

# EXPOSE 8001

# ENTRYPOINT ["backend/search-service/docker-entrypoint.sh"]



FROM python:3.10

WORKDIR /app

# ✅ 1. Install system deps first (cached)
RUN apt-get update && \
    apt-get install -y nodejs npm && \
    rm -rf /var/lib/apt/lists/*

# ✅ 2. Copy ONLY requirements (for caching)
COPY backend/search-service/requirements.txt ./requirements.txt

# ✅ 3. Install Python deps (cached unless requirements change)
RUN pip install --no-cache-dir -r requirements.txt

# ✅ 4. Copy Prisma schema only (for caching)
COPY packages/database/prisma ./packages/database/prisma

# ✅ 5. Generate Prisma client
RUN cd packages/database && \
    npx prisma@5.17.0 generate --generator py_client --schema=./prisma/schema.prisma

# ✅ 6. Now copy full project (this changes often)
COPY . .

# ✅ 7. Permissions
RUN chmod +x backend/search-service/main.py && \
    chmod +x backend/search-service/docker-entrypoint.sh

EXPOSE 8001

ENTRYPOINT ["backend/search-service/docker-entrypoint.sh"]
