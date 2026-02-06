# Use Node LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of the app
COPY . .

# Expose frontend port
EXPOSE 3000

# Start dev server
CMD ["npm", "run", "dev"]
