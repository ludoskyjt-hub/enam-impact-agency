FROM node:20-alpine

# Installer pnpm via corepack
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copier les fichiers de config workspace
COPY package.json pnpm-workspace.yaml ./
COPY tsconfig.base.json tsconfig.json ./

# Copier les libs
COPY lib/ ./lib/

# Copier lapi-server
COPY artifacts/api-server/ ./artifacts/api-server/

# Installer les dépendances
RUN pnpm install --no-frozen-lockfile

# Builder lapi-server
RUN pnpm --filter @workspace/api-server run build

# Variables runtime
ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
