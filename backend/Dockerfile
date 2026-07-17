# Use official Node.js runtime as base image
FROM node:18-alpine

# Set working directory in container
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production --silent

# Copy application source
COPY . .

# Build TypeScript
RUN npm run build

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sentinelx -u 1001

# Change ownership of app directory
RUN chown -R sentinelx:nodejs /app
USER sentinelx

# Expose port
EXPOSE 5000

# Add labels for container metadata
LABEL maintainer="SentinelX Team"
LABEL version="1.0.0"
LABEL description="SentinelX Trust Operating System - Backend API"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/health || exit 1

# Start the application
CMD ["npm", "start"]