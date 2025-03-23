# Sử dụng hình ảnh Node.js nhẹ làm cơ sở
FROM node:20-alpine

# Đặt thư mục làm việc bên trong container
WORKDIR /usr/src/app

# Sao chép tệp package.json và package-lock.json từ thư mục dịch vụ vào container
COPY package.json package-lock.json ./

# Cài đặt các phụ thuộc với --legacy-peer-deps để xử lý peer dependencies nếu cần
RUN npm install --legacy-peer-deps

# Sao chép toàn bộ mã nguồn của API Gateway vào container
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

# Mở cổng 3000 để API Gateway lắng nghe yêu cầu
EXPOSE 3000

# Lệnh khởi chạy ứng dụng khi container bắt đầu
CMD ["npm", "start"]
