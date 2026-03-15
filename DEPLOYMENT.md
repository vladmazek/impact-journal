# DEPLOYMENT.md

## Target

- domain: `impact.vlad.net`
- host root: `/srv/impact-journal`
- persistent data root: `/srv/impact-journal/data`

## Required files

- `@docker-compose.production.yaml`
- `@docker/caddy/Caddyfile`
- `@.env.production.example`
- `@Dockerfile`

## First-time host setup

```sh
mkdir -p /srv/impact-journal/data/db /srv/impact-journal/data/media
cd /srv/impact-journal
cp .env.production.example .env.production
```

Update `.env.production` with:

- `AUTH_COOKIE_SECRET`
- `MARIADB_PASSWORD`
- `MARIADB_ROOT_PASSWORD`
- any non-default app/domain values

## Production boot

```sh
docker compose --env-file .env.production -f docker-compose.production.yaml up -d --build
```

This boots:

- `db` for MariaDB
- `app` for the Next.js journal
- `caddy` for TLS termination and reverse proxying

The app container runs Prisma deploy migrations before starting `next start`.

## Update flow

```sh
git pull
docker compose --env-file .env.production -f docker-compose.production.yaml up -d --build
```

## Verification

After deploy:

1. open `https://impact.vlad.net`
2. confirm login works
3. open a daily entry and verify autosave
4. upload an image and confirm it survives a container restart
5. open a weekly reflection and confirm save/load behavior
6. open settings and confirm profile updates persist

## Persistent storage expectations

Host paths:

- DB: `/srv/impact-journal/data/db`
- media: `/srv/impact-journal/data/media`

Container paths:

- DB: `/var/lib/mysql`
- media: `/data/journal/media`

Image filenames remain date-first and human-browsable:

- `originals/YYYY/MM/YYYY-MM-DD-readable-slug[-suffix].ext`

## Backups

Back up both:

- the MariaDB database
- the mounted media directory

Recommended restore order:

1. restore the database
2. restore media files
3. boot the stack
4. verify login, daily entries, weekly reflections, and private media delivery
