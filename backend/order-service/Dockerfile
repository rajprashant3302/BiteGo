# backend/order-service/Dockerfile
FROM node:20

WORKDIR /app

# 1. SETUP DATABASE
COPY packages/database ./packages/database
WORKDIR /app/packages/database
RUN rm -rf node_modules package-lock.json
RUN npm install
RUN npx prisma generate

# 2. SETUP ORDER SERVICE
WORKDIR /app/backend/order-service
COPY backend/order-service/package.json ./

RUN npm install
RUN npm install ../../packages/database

COPY backend/order-service .

# 3. GENERATE CLIENT
WORKDIR /app/packages/database
RUN npx prisma generate

# 4. START
WORKDIR /app/backend/order-service
EXPOSE 5001       
CMD ["npm", "start"]