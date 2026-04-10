# backend/campaign-service/Dockerfile
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
# 2. SETUP CAMPAIGN SERVICE
# --------------------------------------------------------
WORKDIR /app/backend/campaign-service
COPY backend/campaign-service/package.json ./

# Install campaign service dependencies
RUN npm install

# Link the database package
RUN npm install ../../packages/database

# Copy the rest of the campaign service code
COPY backend/campaign-service .

# --------------------------------------------------------
# 3. GENERATE PRISMA CLIENT (CRITICAL STEP)
# --------------------------------------------------------
# We run this AFTER all npm installs to ensure it doesn't get deleted
WORKDIR /app/packages/database
RUN npm install @prisma/client@5.21.0 && npx prisma@5.21.0 generate --generator client

# --------------------------------------------------------
# 4. START
# --------------------------------------------------------
WORKDIR /app/backend/campaign-service
EXPOSE 5006
CMD ["npm", "start"]