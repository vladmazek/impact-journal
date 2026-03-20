# SETUP.md

## Goal

Keep local development and hosted deployment simple, durable, and Docker-first.

## Local setup

### Expected services

- `app`
- `db`

### Local env

Copy `@.env.example` to `.env` if you want to override defaults.

Key variables:

```env
NODE_ENV=development
APP_URL=http://localhost:3000
DATABASE_URL=mysql://journal:journal_password@db:3306/journal
AUTH_COOKIE_SECRET=replace-this-before-production
MEDIA_ROOT=/data/journal/media
MAX_IMAGE_UPLOAD_MB=15
HOST_STORAGE_ROOT=/Users/vlad/impact-journal-data
```

### Mounted paths

Recommended local host paths:

- DB: `/Users/vlad/impact-journal-data/db`
- media: `/Users/vlad/impact-journal-data/media`

Inside containers:

- DB: `/var/lib/mysql`
- media: `/data/journal/media`

### Local run

```sh
mkdir -p /Users/vlad/impact-journal-data/db /Users/vlad/impact-journal-data/media
docker compose up --build
```

Open `http://localhost:3000`, complete `/setup` once, then use `/login`.

## Validation workflow

The host machine does not need Node installed. Run validation through Docker:

```sh
docker compose -f docker-compose.test.yaml --profile test up --build --abort-on-container-exit app-test
docker compose -f docker-compose.test.yaml --profile test up --build --abort-on-container-exit e2e
```

Inside the container, the validation commands are:

```sh
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:e2e
pnpm build
```

For local interactive development, avoid running `pnpm build` inside a shared dev container if that container persists `.next`.

## Production setup

### Repo-contained standalone stack

Use:

- `@docker-compose.production.yaml`
- `@docker/caddy/Caddyfile`
- `@.env.production.example`

Default standalone host layout:

- app root: `/srv/impact-journal`
- env file: `/srv/impact-journal/.env.production`
- persistent DB: `/srv/impact-journal/data/db`
- persistent media: `/srv/impact-journal/data/media`

Bring the standalone stack up with:

```sh
docker compose --env-file .env.production -f docker-compose.production.yaml up -d --build
```

### Current live host layout

The currently hosted `impact.vlad.net` deployment uses:

- stack root: `/data/vlad-impact`
- app mirror: `/data/vlad-impact/app`
- env file: `/data/vlad-impact/.env`
- compose file: `/data/vlad-impact/docker-compose.yaml`
- DB storage: `/data/vlad-impact/mariadb`
- media storage: `/data/vlad-impact/media`

That live stack is updated by syncing the repo into `/data/vlad-impact/app` and rebuilding `impact-app`.

## Media storage contract

Images live on real mounted storage and keep date-first filenames:

- directory: `originals/YYYY/MM`
- filename: `YYYY-MM-DD-readable-slug[-shortid].ext`

Avatar files use the `avatars/` bucket on the same mounted media root.

## Backup notes

At minimum, back up:

- MariaDB data or SQL dumps
- the full mounted media directory
- the mirrored app source on the live host if you want rollback-ready deploys

Restore order:

1. restore the DB
2. restore media files
3. restore or re-sync the app tree
4. boot the stack and verify private media access through the app
