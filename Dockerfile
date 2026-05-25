FROM node:20-alpine

# Installer pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copier tout le code source
COPY . .

# Installer TOUTES les dépendances (prod + dev requis pour le build)
RUN pnpm install --no-frozen-lockfile

# Builder uniquement api-server
RUN pnpm --filter @workspace/api-server run build

# NE PAS faire pnpm prune -- pg et autres modules runtime doivent rester
ENV NODE_ENV=production

# Railway injecte automatiquement PORT
EXPOSE 8080

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
