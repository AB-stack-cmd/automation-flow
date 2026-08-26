# ==============================================================================
# STANDALONE PRODUCTION DOCKERFILE FOR NEURON_FLOW APP & FILE VAULT
# Allows running the full app self-contained via `docker build` and `docker run`
# ==============================================================================

FROM node:20-alpine AS builder

# Install OpenSSL required by Prisma on Alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Copy root dependency configuration
COPY package*.json ./

# Install clean node modules
RUN npm ci

# Copy full application codebase
COPY . .

# Production Environment Default Variables
ENV NODE_ENV=production
ENV PORT=3000
ENV EXPRESS_PORT=4001
ENV WORKFLOW_DATABASE_URL="file:./dev.db"
ENV DATABASE_URL="file:./dev.db?connection_limit=1&socket_timeout=30"

# Generate Prisma Client & initialize database schema
RUN npx prisma generate --schema=automation-workflow/prisma/schema.prisma
RUN npx prisma db push --schema=automation-workflow/prisma/schema.prisma

# Build optimized production Next.js application
RUN npm run build

# Create dedicated directory for local uploads fallback
RUN mkdir -p public/uploads

# Expose Next.js frontend port (3000) and companion Express API port (4001)
EXPOSE 3000
EXPOSE 4001

# Self-contained startup script ensuring DB initialization & dual server execution
CMD ["sh", "-c", "npx prisma db push --schema=automation-workflow/prisma/schema.prisma && npm run start:full"]
