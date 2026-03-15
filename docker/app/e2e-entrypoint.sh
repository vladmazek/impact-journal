#!/bin/sh
set -eu

pnpm install --no-frozen-lockfile

until node -e "fetch(process.env.E2E_BASE_URL || 'http://app-test:3000/login').then((res) => { if (!res.ok && res.status !== 200 && res.status !== 307) process.exit(1); }).catch(() => process.exit(1));"; do
  echo "Waiting for app-test to become reachable..."
  sleep 2
done

pnpm exec playwright install --with-deps chromium
exec pnpm test:e2e
