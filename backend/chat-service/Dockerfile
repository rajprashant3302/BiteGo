# backend/auth-service/Dockerfile
FROM node:20

WORKDIR /app

# --------------------------------------------------------
# 1. SETUP DATABASE PACKAGE
# --------------------------------------------------------
COPY packages/database ./packages/database

# Install database dependencies
WORKDIR /app/packages/database
RUN rm -rf node_modules package-lock.json
RUN npm install

# --------------------------------------------------------
# 2. SETUP AUTH SERVICE
# --------------------------------------------------------
WORKDIR /app/backend/chat-service
COPY backend/chat-service/package.json ./

# Install auth service dependencies
RUN npm install

# Link the database package
RUN npm install ../../packages/database

# Copy the rest of the auth service code
COPY backend/chat-service .

# --------------------------------------------------------
# 3. GENERATE PRISMA CLIENT (CRITICAL STEP)
# --------------------------------------------------------
# We run this AFTER all npm installs to ensure it doesn't get deleted
WORKDIR /app/packages/database
RUN npx prisma generate

# --------------------------------------------------------
# 4. START
# --------------------------------------------------------
WORKDIR /app/backend/chat-service
EXPOSE 5000
CMD ["npm", "start"]