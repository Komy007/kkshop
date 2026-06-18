# ---- Stage 1: Install dependencies ----
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install --legacy-peer-deps

# ---- Stage 2: Build the application ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time public env vars — baked into the client JS bundle by Next.js
ARG NEXT_PUBLIC_TELEGRAM_BOT_ID
ENV NEXT_PUBLIC_TELEGRAM_BOT_ID=$NEXT_PUBLIC_TELEGRAM_BOT_ID

# Ensure public directory exists
RUN mkdir -p public

# Generate Prisma Client
RUN npx prisma generate

# Force clear any cached built files and Build Next.js
# NODE_OPTIONS: PWA Workbox build requires extra heap (prevents WorkerError OOM crash)
RUN rm -rf .next && NODE_OPTIONS='--max-old-space-size=4096' npm run build

# ---- Stage 3: Production runner ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# libc6-compat: required for prebuilt native modules (sharp's libvips binary)
RUN apk add --no-cache libc6-compat

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets (created in builder stage)
COPY --from=builder /app/public ./public

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# sharp is marked as serverExternalPackages — copy its node_modules so it's loadable at runtime
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/sharp ./node_modules/sharp
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@img ./node_modules/@img

USER nextjs

EXPOSE 8080

CMD ["node", "server.js"]
