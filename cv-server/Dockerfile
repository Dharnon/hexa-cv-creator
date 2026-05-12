FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY scripts/grant-admin.mjs ./scripts/grant-admin.mjs
RUN mkdir -p /app/data
ENV DATABASE_PATH=/app/data/cv.sqlite
EXPOSE 3847
CMD ["node", "dist/index.js"]
