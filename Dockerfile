FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

COPY . .

# --shamefully-hoist force pg et tous les modules au niveau racine node_modules/
# Cela permet à Node.js de les trouver depuis n'importe quel sous-dossier
RUN pnpm install --no-frozen-lockfile --shamefully-hoist

RUN pnpm --filter @workspace/api-server run build

ENV NODE_ENV=production

EXPOSE 8080

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.cjs"]
