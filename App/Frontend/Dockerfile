############################
# @author EliasDH Team     #
# @see https://eliasdh.com #
# @since 01/01/2025        #
############################
# Stage 1: build backend
FROM node:20-alpine AS builder

LABEL maintainer="EliasDH"
LABEL version="1.0"
LABEL description="This is the frontend image for the app."
LABEL org.opencontainers.image.description="This is the frontend image for the app."

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Run backend
FROM node:20-alpine

LABEL maintainer="EliasDH"
LABEL version="1.0"
LABEL description="This is the frontend image for the app."
LABEL org.opencontainers.image.description="This is the frontend image for the app."

WORKDIR /app
COPY --from=builder /app/dist /app/dist
COPY package*.json ./
RUN npm ci --omit=dev

ENV NODE_ENV=production
ENV PORT=4000

EXPOSE 4000
CMD ["node", "dist/frontend/server/server.mjs"]