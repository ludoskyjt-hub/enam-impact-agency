FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY . .

RUN pnpm install --no-frozen-lockfile

RUN pnpm --filter @workspace/api-server run build

ENV NODE_ENV=production
ENV NODE_PATH=/app/node_modules

EXPOSE 8080

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.cjs"]
