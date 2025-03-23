FROM node:20-alpine

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

COPY ./apps/buildings/prisma ./prisma

COPY . .

RUN npx prisma generate

EXPOSE 3002

CMD ["npm", "start"]
