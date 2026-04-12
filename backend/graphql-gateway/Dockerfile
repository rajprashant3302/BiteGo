# # backend/auth-service/Dockerfile
# FROM node:20

# WORKDIR /app

# # --------------------------------------------------------
# # 1. SETUP DATABASE PACKAGE
# # --------------------------------------------------------
# COPY packages/database ./packages/database

# # Install database dependencies
# WORKDIR /app/packages/database
# RUN rm -rf node_modules package-lock.json
# RUN npm install
# RUN npm install @prisma/client@5.21.0 && npx prisma@5.21.0 generate --generator client


# # --------------------------------------------------------
# # 2. SETUP AUTH SERVICE
# # --------------------------------------------------------
# WORKDIR /app/backend/graphql-gateway
# COPY backend/graphql-gateway/package.json ./

# WORKDIR /app
# COPY packages/redis ./packages/redis
# WORKDIR /app/packages/redis

# # Install auth service dependencies
# RUN npm install

# # Link the database package
# RUN npm install ../../packages/database
# RUN npm install ../../packages/redis


# # Copy the rest of the auth service code
# COPY backend/graphql-gateway .

# # --------------------------------------------------------
# # 3. GENERATE PRISMA CLIENT (CRITICAL STEP)
# # --------------------------------------------------------
# # We run this AFTER all npm installs to ensure it doesn't get deleted
# WORKDIR /app/packages/database
# RUN npm install @prisma/client@5.21.0 && npx prisma@5.21.0 generate --generator client

# # --------------------------------------------------------
# # 4. START
# # --------------------------------------------------------
# WORKDIR /app/backend/graphql-gateway
# EXPOSE 4000
# CMD ["npm", "start"]


FROM node:20

# Set root working directory
WORKDIR /app

# -----------------------------------------
# 1. COPY FULL PROJECT
# -----------------------------------------
COPY . .

# -----------------------------------------
# 2. INSTALL DATABASE PACKAGE
# -----------------------------------------
WORKDIR /app/packages/database
RUN npm install
RUN npm install @prisma/client@5.21.0 && npx prisma@5.21.0 generate --generator client

# -----------------------------------------
# 3. INSTALL REDIS PACKAGE
# -----------------------------------------
WORKDIR /app/packages/redis
RUN npm install

# -----------------------------------------
# 4. INSTALL GRAPHQL GATEWAY
# -----------------------------------------
WORKDIR /app/backend/graphql-gateway
RUN npm install

# Link local packages
RUN npm install ../../packages/database
RUN npm install ../../packages/redis

# -----------------------------------------
# 5. START SERVER
# -----------------------------------------
EXPOSE 4000
CMD ["npm", "start"]