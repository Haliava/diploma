# syntax=docker/dockerfile:1

FROM node:24-alpine AS backend-deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci

FROM backend-deps AS backend-build
WORKDIR /app/backend
COPY backend ./
RUN npm run build

FROM node:24-alpine AS backend-prod-deps
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

FROM node:24-alpine AS frontend-build
WORKDIR /app/frontend

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

COPY vite-app/package*.json ./
RUN npm ci

COPY vite-app ./
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN apk add --no-cache nginx \
  && mkdir -p /run/nginx

COPY --from=backend-prod-deps /app/backend/node_modules ./backend/node_modules
COPY --from=backend-build /app/backend/dist ./backend/dist
COPY --from=frontend-build /app/frontend/dist /usr/share/nginx/html
COPY nginx.all-in-one.conf /etc/nginx/http.d/default.conf

EXPOSE 80
CMD ["sh", "-c", "node /app/backend/dist/main.js & nginx -g 'daemon off;'"]
