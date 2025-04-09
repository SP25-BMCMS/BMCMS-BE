# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Generate Prisma Client cho tất cả services và đảm bảo output vào thư mục node_modules gốc
RUN find ./apps -name schema.prisma -exec dirname {} \; | xargs -I{} sh -c 'npx prisma generate --schema={}/schema.prisma'

# Build the application
RUN npm run build tasks

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

# Copy font files - ensure they are available in production
COPY --from=builder /usr/src/app/apps/Tasks/fonts ./apps/Tasks/fonts
COPY --from=builder /usr/src/app/apps/Tasks/images ./apps/Tasks/images

# Create directories if they don't exist
RUN mkdir -p /usr/src/app/dist/apps/Tasks/fonts
RUN mkdir -p /usr/src/app/dist/apps/Tasks/images

# Copy font files to dist directory as well
COPY --from=builder /usr/src/app/apps/Tasks/fonts/* /usr/src/app/dist/apps/Tasks/fonts/
COPY --from=builder /usr/src/app/apps/Tasks/images/* /usr/src/app/dist/apps/Tasks/images/

# Copy .env file
COPY --from=builder /usr/src/app/.env .env

EXPOSE 3004

# Run the built application
CMD ["node", "dist/apps/Tasks/main"]