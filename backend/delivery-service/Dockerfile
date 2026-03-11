# backend/delivery-service/Dockerfile
FROM node:20

WORKDIR /app

# 1. SETUP DATABASE
COPY packages/database ./packages/database
WORKDIR /app/packages/database
RUN rm -rf node_modules package-lock.json
RUN npm install
RUN npx prisma generate

# Copy and setup redis 
WORKDIR /app
COPY packages/redis ./packages/redis

# 2. SETUP delivery SERVICE
WORKDIR /app/backend/delivery-service
COPY backend/delivery-service/package.json ./

RUN npm install
RUN npm install ../../packages/database
RUN npm install ../../packages/redis

COPY backend/delivery-service .

# 3. GENERATE CLIENT
WORKDIR /app/packages/database
RUN npx prisma generate

# 4. START
WORKDIR /app/backend/delivery-service
EXPOSE 5004       
CMD ["npm", "start"]