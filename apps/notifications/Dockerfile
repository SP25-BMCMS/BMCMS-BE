# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Generate Prisma Client cho tất cả services và đảm bảo output vào thư mục node_modules gốc
# RUN find ./apps -name schema.prisma -exec dirname {} \; | xargs -I{} sh -c 'npx prisma generate --schema={}/schema.prisma --no-engine'
RUN find ./apps -path "./apps/" -prune -o -name schema.prisma -exec dirname {} \; | xargs -I{} sh -c 'cd {} && npx prisma generate'

# Build the application
RUN npm run build notifications

# Production stage
FROM node:20-alpine

WORKDIR /usr/src/app

# Copy package files and install production dependencies only
COPY package*.json ./
RUN npm install --omit=dev --only=production --legacy-peer-deps

# Copy build artifacts
COPY --from=builder /usr/src/app/dist ./dist

# Copy ALL Prisma generated clients from root node_modules
COPY --from=builder /usr/src/app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /usr/src/app/node_modules/@prisma ./node_modules/@prisma

# Copy proto files and contracts
COPY --from=builder /usr/src/app/libs/contracts ./libs/contracts

# Copy email templates from contracts
COPY --from=builder /usr/src/app/libs/contracts/src/notifications/templates ./libs/contracts/src/notifications/templates

# Copy .env file
COPY --from=builder /usr/src/app/.env .env

EXPOSE 3006
# Run the built application
CMD ["node", "dist/apps/notifications/main"]