FROM node:20-alpine
RUN apk add --no-cache openssl

WORKDIR /app

# Copy root monorepo files
COPY package*.json ./
COPY turbo.json ./

# Copy package manifests for monorepo caching
COPY apps/web/package*.json ./apps/web/
COPY packages/db/package*.json ./packages/db/
COPY packages/engine/package*.json ./packages/engine/
COPY packages/nodes/package*.json ./packages/nodes/
COPY packages/sdk/package*.json ./packages/sdk/

# Install workspace dependencies
RUN npm ci

# Copy all codebase source files
COPY . .

# Generate the database prisma client
RUN npm run db:generate

# Build the entire Turborepo workspace
RUN npm run build:prod

EXPOSE 3001

# Sync database, seed preset data, and start Next.js production server
CMD ["sh", "-c", "npm run db:push && npm run db:seed && npm --workspace=web run start"]
