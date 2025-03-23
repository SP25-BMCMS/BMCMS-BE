FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# Sao chép thư mục prisma từ Tasks vào container
COPY ./apps/Tasks/prisma ./prisma

# Sao chép toàn bộ mã nguồn từ Tasks vào container
COPY . .

# # Sao chép thư mục prisma từ dịch vụ vào container
# COPY ./apps/users/prisma ./apps/users/prisma
# COPY ./apps/Tasks/prisma ./apps/Tasks/prisma
# COPY ./apps/cracks/prisma ./apps/cracks/prisma
# COPY ./apps/buildings/prisma ./apps/buildings/prisma
# COPY ./apps/schedules/prisma ./apps/schedules/prisma

# # Tạo Prisma Client cho từng dịch vụ
# RUN npx prisma generate --schema=./apps/users/prisma/schema.prisma && \
#     npx prisma generate --schema=./apps/Tasks/prisma/schema.prisma && \
#     npx prisma generate --schema=./apps/cracks/prisma/schema.prisma && \
#     npx prisma generate --schema=./apps/buildings/prisma/schema.prisma && \
#     npx prisma generate --schema=./apps/schedules/prisma/schema.prisma

EXPOSE 3004

CMD ["npm", "start"]
