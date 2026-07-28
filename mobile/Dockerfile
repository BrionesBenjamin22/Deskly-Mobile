FROM node:22-alpine@sha256:16e22a550f3863206a3f701448c45f7912c6896a62de43add43bb9c86130c3e2 AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN corepack enable

WORKDIR /app

FROM base AS dependencies

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-mobile,target=/pnpm/store \
    pnpm install --frozen-lockfile

FROM base AS development

ENV CI=1
ENV EXPO_NO_TELEMETRY=1
ENV HOME=/tmp/expo
ENV XDG_CACHE_HOME=/tmp/expo/.cache

RUN apk add --no-cache dumb-init \
    && addgroup -S -g 10001 nodejs \
    && adduser -S -D -H -u 10001 -G nodejs expo

COPY --from=dependencies --chown=expo:nodejs /app/node_modules ./node_modules
COPY --chown=expo:nodejs package.json pnpm-lock.yaml app.json tsconfig.json index.ts App.tsx ./
COPY --chown=expo:nodejs assets ./assets
COPY --chown=expo:nodejs src ./src

USER expo

EXPOSE 8081 19000 19001 19002

ENTRYPOINT ["dumb-init", "--"]
CMD ["./node_modules/.bin/expo", "start", "--lan"]
