#!/bin/sh
set -eu

mkdir -p "${MEDIA_ROOT:-/data/journal/media}/avatars" "${MEDIA_ROOT:-/data/journal/media}/originals"

until pnpm prisma migrate deploy; do
  echo "Waiting for MariaDB to accept production migrations..."
  sleep 3
done

exec pnpm start
