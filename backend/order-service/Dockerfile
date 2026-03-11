FROM node:20

WORKDIR /app

# --------------------------------------------------------
# 1. SETUP DATABASE PACKAGE
# --------------------------------------------------------
COPY packages/database ./packages/database
WORKDIR /app/packages/database
RUN rm -rf node_modules package-lock.json
RUN npm install

# Generate all Prisma clients (JS + Python if configured)
RUN npx prisma generate

# --------------------------------------------------------
# 2. SETUP REDIS PACKAGE
# --------------------------------------------------------
WORKDIR /app
COPY packages/redis ./packages/redis

# --------------------------------------------------------
# 3. SETUP ORDER SERVICE
# --------------------------------------------------------
WORKDIR /app/backend/order-service
COPY backend/order-service/package.json ./

RUN npm install
# Link local packages
RUN npm install ../../packages/database
RUN npm install ../../packages/redis

COPY backend/order-service .

# --------------------------------------------------------
# 4. START
# --------------------------------------------------------
EXPOSE 5001        
CMD ["npm", "start"]