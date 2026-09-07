# Development stage
FROM node:20-alpine AS development

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY packages/shared-types/package*.json ./packages/shared-types/ 2>/dev/null || true

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build stage
FROM development AS builder

WORKDIR /app
RUN npm run build --workspace=api

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy only necessary files
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3001

CMD ["node", "apps/api/dist/main"]
