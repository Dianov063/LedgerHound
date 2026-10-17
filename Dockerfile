# LedgerHound web image for the AppPlatform host (see deploy/appplatform/README.md).
# Same layout as the other apps on that host (TowHub): standalone Next output,
# non-root runtime. No secrets enter the image: the build needs none (sitemap
# and S3-backed pages render at request time) and runtime config comes from
# the compose env_file.
FROM node:22-alpine AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Public build inputs only (the GA id is visible in every page).
ARG NEXT_PUBLIC_GA_ID=
ENV LEDGERHOUND_SELF_HOST=1 \
    NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID
# next/font downloads Inter and Manrope here and serves them from /_next/static.
RUN npm run build

FROM node:22-alpine AS runtime
ARG LEDGERHOUND_GIT_SHA=unknown
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1 \
    LEDGERHOUND_SELF_HOST=1 \
    NEXT_MANUAL_SIG_HANDLE=true \
    LEDGERHOUND_GIT_SHA=$LEDGERHOUND_GIT_SHA
WORKDIR /app
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# react-pdf loads Noto Sans from process.cwd()/lib/fonts (CDN only as fallback).
COPY --from=build --chown=node:node /app/lib/fonts ./lib/fonts
# The cron container runs this script from the same image.
COPY --from=build --chown=node:node /app/scripts/cron-runner.mjs ./scripts/cron-runner.mjs
RUN mkdir -p .next/cache && chown node:node .next/cache
USER node
EXPOSE 3000
CMD ["node", "server.js"]
