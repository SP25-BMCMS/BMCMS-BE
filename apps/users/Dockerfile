# Sử dụng Node.js làm hình ảnh cơ sở
FROM node:20-alpine

# Đặt thư mục làm việc bên trong container
WORKDIR /usr/src/app

# Sao chép tệp package.json và package-lock.json để cài đặt phụ thuộc
COPY package.json package-lock.json ./

# Cài đặt các phụ thuộc
RUN npm install --legacy-peer-deps

COPY . .

# Sao chép thư mục prisma từ dịch vụ vào container
COPY ./apps/users/prisma ./apps/users/prisma
COPY ./apps/Tasks/prisma ./apps/Tasks/prisma
COPY ./apps/cracks/prisma ./apps/cracks/prisma
COPY ./apps/buildings/prisma ./apps/buildings/prisma
COPY ./apps/schedules/prisma ./apps/schedules/prisma

# Tạo Prisma Client cho từng dịch vụ
RUN npx prisma generate --schema=./apps/users/prisma/schema.prisma && \
    npx prisma generate --schema=./apps/Tasks/prisma/schema.prisma && \
    npx prisma generate --schema=./apps/cracks/prisma/schema.prisma && \
    npx prisma generate --schema=./apps/buildings/prisma/schema.prisma && \
    npx prisma generate --schema=./apps/schedules/prisma/schema.prisma

# Mở cổng 3001 cho gRPC service
EXPOSE 3001

# Lệnh khởi chạy ứng dụng khi container bắt đầu
CMD ["npm", "start"]
