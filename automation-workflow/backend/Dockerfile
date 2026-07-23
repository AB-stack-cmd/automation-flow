FROM node:20-alpine

WORKDIR /app

# Install openssl for prisma engine
RUN apk add --no-cache openssl

# Ensure database storage directory exists
RUN mkdir -p /app/database

# Copy dependency manifests
COPY backend/package*.json ./backend/
COPY prisma ./prisma/

# Install backend dependencies
RUN cd backend && npm ci

# Copy backend source code
COPY backend ./backend/

# Generate prisma client based on the copied schema
RUN cd backend && npx prisma generate --schema=../prisma/schema.prisma

WORKDIR /app/backend

EXPOSE 4000

# Push migrations/database push to SQLite, then start the Express server
CMD ["sh", "-c", "npx prisma db push --schema=../prisma/schema.prisma && node server.js"]
