# Development stage
FROM node:20-alpine AS development

WORKDIR /app

# Copy root package files
COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/shared-types/package*.json ./packages/shared-types/ 2>/dev/null || true

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Build stage
FROM development AS builder

WORKDIR /app
RUN npm run build --workspace=web

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy only necessary files
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=builder /app/apps/web/package.json ./apps/web/
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "start", "--workspace=web"]
