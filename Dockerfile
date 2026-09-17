# ─── Stage 1: Build the React client ────────────────────────────────────────
FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# ─── Stage 2: Install server dependencies ───────────────────────────────────
FROM node:20-alpine AS server-deps
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --omit=dev

# ─── Stage 3: Final runtime image ───────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Server code + its node_modules
COPY server/ ./
COPY --from=server-deps /app/server/node_modules ./node_modules

# React build output, served as static files by Express (see server/index.js)
COPY --from=client-build /app/client/build ./public

ENV NODE_ENV=production
EXPOSE 5000

CMD ["node", "index.js"]
