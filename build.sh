#!/bin/bash
set -e
echo "=== Installing pnpm ==="
npm install -g pnpm@9
echo "=== Installing dependencies ==="
pnpm install
echo "=== Building API server ==="
pnpm --filter @workspace/api-server run build
echo "=== Build complete ==="

