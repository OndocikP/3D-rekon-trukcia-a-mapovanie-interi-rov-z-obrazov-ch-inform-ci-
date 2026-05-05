# Frontend Dockerfile - Multi-stage build
# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Kopíruj package files
COPY package*.json ./
COPY tsconfig.json ./
COPY eslint.config.js ./

# Nainštaluj dependencies
RUN npm ci

# Kopíruj zdrojový kód
COPY . .

# Build Expo web app
RUN npm run build 2>/dev/null || npm run web:build 2>/dev/null || echo "Build skipped"

# Stage 2: Runtime
FROM node:18-alpine

WORKDIR /app

# Nainštaluj serve na serverovanie static súborov
RUN npm install -g serve

# Kopíruj built files z builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.expo ./expo 2>/dev/null || true
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Start app
CMD ["serve", "-s", "dist", "-l", "3000"]
