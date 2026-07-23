FROM node:20-alpine

WORKDIR /app

# Copy dependency files
COPY package*.json ./
RUN npm ci

# Copy root application code
COPY . .

# Build Next.js production bundles
RUN npm run build

EXPOSE 3000
EXPOSE 4001

# Run both Next.js frontend and root companion Express server concurrently
CMD ["npm", "run", "start:full"]
