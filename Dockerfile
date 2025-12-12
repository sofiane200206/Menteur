FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Build stage
FROM base AS builder
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Production - utiliser directement le serveur Nitro
FROM base AS runner
ENV NODE_ENV=production
ENV HOST=0.0.0.0

COPY --from=builder /app/.output ./.output

# Render définit PORT automatiquement
ENV PORT=10000
EXPOSE 10000

# Lancer le serveur Nitro directement
CMD ["node", ".output/server/index.mjs"]
