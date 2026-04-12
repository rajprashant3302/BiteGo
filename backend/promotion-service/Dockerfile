# backend/promotion-service/Dockerfile
FROM node:20

WORKDIR /app

# 1. SETUP DATABASE
COPY packages/database ./packages/database
WORKDIR /app/packages/database
RUN rm -rf node_modules package-lock.json
RUN npm install
RUN npm install @prisma/client@5.21.0 && npx prisma@5.21.0 generate --generator client

# Copy and setup redis 
WORKDIR /app
COPY packages/redis ./packages/redis
WORKDIR /app/packages/redis
RUN npm install
# 2. SETUP promotion SERVICE
WORKDIR /app/backend/promotion-service
COPY backend/promotion-service/package.json ./

RUN npm install
RUN npm install ../../packages/database
RUN npm install ../../packages/redis

COPY backend/promotion-service .

# 3. GENERATE CLIENT
WORKDIR /app/packages/database
RUN npm install @prisma/client@5.21.0 && npx prisma@5.21.0 generate --generator client

# 4. BUILD THE TYPESCRIPT CODE
WORKDIR /app/backend/promotion-service
RUN npm run build

# 5. START
# WORKDIR /app/backend/promotion-service
EXPOSE 5006      
CMD ["npm", "start"]