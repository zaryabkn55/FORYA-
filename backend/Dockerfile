FROM node:20-alpine

WORKDIR /app

# Install dependencies needed for native builds & prisma engines
RUN apk add --no-cache openssl libc6-compat

# Package files copy karein
COPY package*.json ./

# Sab dependencies install karein (devDependencies included for hot-reload tools)
RUN npm install

# Prisma schema copy karein taaki client generate ho sake
COPY prisma ./prisma/
RUN npx prisma generate

# Source code aur configuration files copy karein
COPY tsconfig.json ./
COPY src ./src

ENV NODE_ENV=development
ENV PORT=4000

EXPOSE 4000

# tsx watch direct typescript files ko observe karke instant auto-reload karta hai
CMD ["npx", "tsx", "watch", "src/index.ts"]