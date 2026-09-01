FROM node:20-alpine AS base
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-fund --no-audit

# --- development (used by docker-compose) ---
FROM base AS dev
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# --- production ---
FROM base AS build
COPY . .
RUN npm run build

FROM node:20-alpine AS prod
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
