# DEPLOYMENT.md

## Deployment shapes

Impact Journal currently has two production deployment shapes documented here:

1. the repo-contained standalone stack in `@docker-compose.production.yaml`
2. the current live host layout serving `impact.vlad.net`

## Repo-contained standalone stack

This is the checked-in production stack built from:

- `@Dockerfile`
- `@docker-compose.production.yaml`
- `@docker/caddy/Caddyfile`
- `@.env.production.example`

Default assumptions:

- domain: `impact.vlad.net`
- host root: `/srv/impact-journal`
- persistent data root: `/srv/impact-journal/data`

First-time setup:

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

Boot:

```sh
docker compose --env-file .env.production -f docker-compose.production.yaml up -d --build
```

This standalone stack boots:

- `db` for MariaDB
- `app` for the Next.js journal
- `caddy` for TLS termination and reverse proxying

The app container runs Prisma deploy migrations before starting the production server.

## Current live host: `impact.vlad.net`

The currently deployed host uses:

- server: `72.249.180.250`
- stack root: `/data/vlad-impact`
- app source mirror: `/data/vlad-impact/app`
- env file: `/data/vlad-impact/.env`
- compose file: `/data/vlad-impact/docker-compose.yaml`
- DB storage: `/data/vlad-impact/mariadb`
- media storage: `/data/vlad-impact/media`
- backups: `/data/vlad-impact/backups`

Live compose services:

- `impact-app`
- `impact-db`

Public HTTPS is handled by a separate already-running Caddy stack on the host. The `vlad-impact` stack joins that shared Docker network instead of running its own bundled Caddy service.

## Current live update flow

The live host is not a git checkout. Update it by syncing source, not by running `git pull`.

Recommended flow:

1. Push the validated local branch to GitHub.
2. Create a timestamped backup of `/data/vlad-impact/app`.
3. Create a MariaDB dump from the running `impact-db` container.
4. Mirror the local repo into `/data/vlad-impact/app` with `rsync -az --delete`.
5. From `/data/vlad-impact`, rebuild only the app service:

   ```sh
   docker compose up -d --build impact-app
   ```

6. Confirm `docker compose ps` shows `impact-app` up.
7. Confirm `docker compose logs --tail=120 impact-app` shows Prisma migrations and a successful Next startup.

Leave these files untouched unless intentionally rotating infra config:

- `/data/vlad-impact/.env`
- `/data/vlad-impact/docker-compose.yaml`

## Verification

After deploy:

1. open `https://impact.vlad.net`
2. confirm unauthenticated traffic redirects to `/login`
3. confirm login works
4. open a daily entry and verify autosave
5. confirm the quote-only daily header renders
6. confirm the right sidebar shows mood, images, and tags in the current minimal layout
7. upload an image and confirm it survives a container restart
8. open a weekly reflection and confirm save/load behavior
9. open settings and confirm home location, theme, avatar, and password updates persist

## Persistent storage expectations

Container paths:

- DB: `/var/lib/mysql`
- media: `/data/journal/media`

Image filenames remain date-first and human-browsable:

- `originals/YYYY/MM/YYYY-MM-DD-readable-slug[-suffix].ext`

Avatar files share the same mounted media root under:

- `avatars/`

## Backups

Back up both:

- the MariaDB database
- the mounted media directory
- the mirrored app source if you want a fast rollback of deploy-time code

Recommended restore order:

1. restore the database
2. restore media files
3. restore or re-sync the desired app tree
4. boot the stack
5. verify login, daily entries, weekly reflections, settings, and private media delivery
