# API-only image for Fly.io (GitHub Pages serves the SPA).
FROM node:24-alpine AS server-build
WORKDIR /app/server
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@10.15.0 --activate
COPY server/package.json server/pnpm-lock.yaml server/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile
COPY server/tsconfig.json server/vitest.config.ts ./
COPY server/src ./src
RUN pnpm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080
ENV SERVE_STATIC=false
COPY --from=server-build /app/server/dist ./server/dist
COPY --from=server-build /app/server/node_modules ./server/node_modules
COPY --from=server-build /app/server/package.json ./server/package.json
EXPOSE 8080
CMD ["node", "server/dist/index.js"]
