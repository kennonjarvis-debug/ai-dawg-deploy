# Multi-stage build for AI DAW Web Application
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (needed for building)
RUN npm install

# Copy source code
COPY . .

# Build the UI
RUN npm run build:ui

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install OpenSSL 1.1 compatibility for Prisma and tsx for running TypeScript
RUN apk add --no-cache openssl1.1-compat && npm install -g tsx

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy built files and source from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/prisma ./prisma
COPY start.sh ./start.sh

# Make startup script executable
RUN chmod +x start.sh

# Generate Prisma client
RUN npx prisma generate

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start command - uses start.sh which checks SERVICE_TYPE env var
CMD ["sh", "start.sh"]
