#!/bin/sh
set -eu

mkdir -p "${MEDIA_ROOT:-/data/journal/media}/avatars" "${MEDIA_ROOT:-/data/journal/media}/originals"

pnpm install --no-frozen-lockfile
pnpm prisma generate

until pnpm prisma migrate deploy; do
  echo "Waiting for MariaDB to accept migrations..."
  sleep 3
done

exec pnpm dev
