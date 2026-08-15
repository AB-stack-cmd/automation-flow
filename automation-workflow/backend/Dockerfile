FROM node:20-alpine

WORKDIR /app

# Install openssl for prisma engine
RUN apk add --no-cache openssl

# Ensure database storage directory exists
RUN mkdir -p /app/database

ENV WORKFLOW_DATABASE_URL="file:/app/database/dev.db"
ENV DATABASE_URL="file:/app/database/dev.db"

# Copy root package config & env.js
COPY package*.json ./
COPY env.js ./

# Copy backend manifests and prisma
COPY automation-workflow/backend/package*.json ./automation-workflow/backend/
COPY automation-workflow/prisma ./automation-workflow/prisma/

# Install backend dependencies
RUN cd automation-workflow/backend && npm ci

# Copy backend source code
COPY automation-workflow/backend ./automation-workflow/backend/

# Generate prisma client based on the copied schema
RUN cd automation-workflow/backend && npx prisma generate --schema=../prisma/schema.prisma

WORKDIR /app/automation-workflow/backend

EXPOSE 4000

# Push migrations/database push to SQLite, then start the Express server
CMD ["sh", "-c", "npx prisma db push --schema=../prisma/schema.prisma && node server.js"]
