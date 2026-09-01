# Same base image family for both stages so the `canvas` native module
# (compiled against glibc + cairo/pango/jpeg/gif here) is ABI-compatible in
# the runner — mixing e.g. an alpine builder with a slim runner would ship a
# binary that fails to load at runtime.
FROM node:20-slim AS builder
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ pkg-config \
    libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev libpixman-1-dev \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
# Containers default to UTC regardless of the host's local time — Node's
# Date resolves "today" against this, so an unset TZ silently shifted every
# relative-date answer ("this month," calendar-day comparisons) by up to a
# full day depending on time of day. Acme Insurance is a single-org, single-
# timezone demo, so a fixed TZ (not real per-user timezone handling) matches
# the project's stated scope.
ENV TZ=America/Los_Angeles

# runtime-only shared libraries — no compiler/dev headers needed here, the
# native module was already built in the builder stage. tzdata provides the
# named-zone database TZ above resolves against.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libcairo2 libpango-1.0-0 libjpeg62-turbo libgif7 librsvg2-2 tzdata \
  && rm -rf /var/lib/apt/lists/*

# full node_modules copied as-is (not relying on Next's standalone output
# file-tracing, which has known gaps with native .node binaries loaded via
# dynamic path resolution rather than a static require())
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/assets ./assets
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts

EXPOSE 3000
CMD ["npx", "next", "start", "-H", "0.0.0.0", "-p", "3000"]
