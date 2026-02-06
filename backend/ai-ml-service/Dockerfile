# Use Node LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application source
COPY . .

# Expose backend port (informational)
EXPOSE 4000

# Start backend service
CMD ["npm", "start"]
