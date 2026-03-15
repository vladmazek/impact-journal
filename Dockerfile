FROM node:20-bookworm-slim AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable

FROM base AS dev

CMD ["sh", "-lc", "./docker/app/entrypoint.sh"]

FROM base AS deps

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS prod-deps

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

FROM deps AS builder

ARG BUILD_DATABASE_URL="mysql://build:build@127.0.0.1:3306/build"
ARG BUILD_AUTH_COOKIE_SECRET="build-time-cookie-secret"
ENV DATABASE_URL="$BUILD_DATABASE_URL"
ENV AUTH_COOKIE_SECRET="$BUILD_AUTH_COOKIE_SECRET"

COPY . .
RUN pnpm prisma generate && pnpm build

FROM base AS runner

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/docker/app/production-entrypoint.sh ./docker/app/production-entrypoint.sh

CMD ["sh", "-lc", "./docker/app/production-entrypoint.sh"]
