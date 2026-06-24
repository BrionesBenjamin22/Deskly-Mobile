FROM node:22-alpine AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

WORKDIR /app

FROM base AS dependencies

RUN apk add --no-cache libc6-compat openssl

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-backend,target=/pnpm/store \
    pnpm install --frozen-lockfile

FROM dependencies AS build

COPY nest-cli.json tsconfig.json tsconfig.build.json prisma.config.ts ./
COPY prisma ./prisma
COPY src ./src

RUN pnpm prisma:generate \
    && pnpm build \
    && pnpm prune --prod

FROM dependencies AS migration

ENV HOME=/tmp/migration

RUN apk add --no-cache dumb-init \
    && addgroup -S -g 10001 nodejs \
    && adduser -S -D -H -u 10001 -G nodejs migration

COPY --chown=migration:nodejs prisma.config.ts ./
COPY --chown=migration:nodejs prisma ./prisma

USER migration

ENTRYPOINT ["dumb-init", "--"]
CMD ["./node_modules/.bin/prisma", "migrate", "deploy"]

FROM node:22-alpine AS runtime

ENV NODE_ENV=production
ENV PORT=3000

RUN apk add --no-cache dumb-init libc6-compat openssl \
    && addgroup -S -g 10001 nodejs \
    && adduser -S -D -H -u 10001 -G nodejs deskly

WORKDIR /app

COPY --from=build --chown=deskly:nodejs /app/package.json ./package.json
COPY --from=build --chown=deskly:nodejs /app/node_modules ./node_modules
COPY --from=build --chown=deskly:nodejs /app/dist ./dist
COPY --from=build --chown=deskly:nodejs /app/prisma ./prisma

USER deskly

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/main.js"]
