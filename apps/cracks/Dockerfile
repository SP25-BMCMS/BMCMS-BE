FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps


COPY ./apps/cracks/prisma ./prisma

COPY . .

RUN npx prisma generate

EXPOSE 3003

CMD ["npm", "start"]
