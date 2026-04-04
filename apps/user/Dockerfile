# Use Node LTS
FROM node:20-alpine

# Limit memory usage (IMPORTANT)
ENV NODE_OPTIONS="--max-old-space-size=1536"
ENV NEXT_TELEMETRY_DISABLED=1

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies (only once)
RUN npm install

# Copy rest of the app
COPY . .

# Build-time env (for Next.js)
ARG NEXT_PUBLIC_MAPBOX_TOKEN
ENV NEXT_PUBLIC_MAPBOX_TOKEN=$NEXT_PUBLIC_MAPBOX_TOKEN

# Build app (stable, low memory)
RUN NODE_OPTIONS="--max-old-space-size=1536" NEXT_PRIVATE_BUILD_WORKER=1 npm run build

# Expose frontend port
EXPOSE 3000

# Start production server
CMD ["npm", "start"]