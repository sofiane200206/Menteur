FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

WORKDIR /app

# Build stage - installer toutes les deps (y compris devDeps pour le build)
FROM base AS builder
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Production
FROM base AS runner
ENV NODE_ENV=production

COPY --from=builder /app/.output ./.output
COPY --from=builder /app/server.mjs ./server.mjs
COPY --from=builder /app/package.json ./package.json

EXPOSE 8080
CMD ["node", "server.mjs"]
