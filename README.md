# Impact Journal

Impact Journal is a private single-user journal built with Next.js, TypeScript, Tailwind, Prisma, MariaDB, and mounted filesystem media storage.

## MVP status

The MVP is now implemented and deployment-ready:

- owner setup, login, hashed password auth, and secure HTTP-only sessions
- protected daily journaling with autosave, mood, guided prompts, relax list, and focused writing modal
- image uploads backed by mounted host storage with normalized filenames and DB metadata
- lightweight tags with picker-based selection plus `#tag` parsing from daily capture
- weekly reflection with ISO-week routing, overall mood, life-area ratings, long-form prompts, and day links
- settings for owner profile, avatar, timezone, theme, email, and password updates
- Docker-first local development plus a production Docker + Caddy deployment stack for `impact.vlad.net`

## Product boundaries

Implemented MVP:

- single-user only
- journal-first UI
- image attachments only
- MariaDB + Prisma persistence
- mounted filesystem media storage
- mobile-friendly notebook-style daily and weekly flows

Not in MVP:

- multi-user support
- social auth
- AI journaling features
- cloud object storage
- reminders, export, analytics, or generic note-taking features

## Local development

The repo is designed to run through Docker. No host Node or pnpm install is required.

1. Create the mounted storage root if needed:

   ```sh
   mkdir -p /Users/vlad/impact-journal-data/db /Users/vlad/impact-journal-data/media
   ```

2. Copy `@.env.example` to `.env` if you want to override defaults.

3. Start the app:

   ```sh
   docker compose up --build
   ```

4. Open [http://localhost:3000](http://localhost:3000).

First boot routes to `/setup`. After the owner account exists, `/setup` closes and `/login` becomes the entry point.

## Validation

Host validation is expected to run in Docker.

Local commands:

```sh
docker compose -f docker-compose.test.yaml --profile test up --build --abort-on-container-exit app-test
docker compose -f docker-compose.test.yaml --profile test up --build --abort-on-container-exit e2e
```

Inside the app container, the core validation commands are:

```sh
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:e2e
pnpm build
```

## Runtime and storage

Default local host mounts:

- DB: `/Users/vlad/impact-journal-data/db`
- media: `/Users/vlad/impact-journal-data/media`

Container paths:

- app media root: `/data/journal/media`
- MariaDB data dir: `/var/lib/mysql`

Images are stored under:

- `originals/YYYY/MM/YYYY-MM-DD-readable-slug[-suffix].ext`

Private media is served through `@app/api/media/[...path]/route.ts`, not from a public bucket.

## Production deployment

Production artifacts now live in:

- `@Dockerfile`
- `@docker-compose.production.yaml`
- `@docker/caddy/Caddyfile`
- `@.env.production.example`
- `@DEPLOYMENT.md`

Default hosted target:

- domain: `impact.vlad.net`
- host root: `/srv/impact-journal`
- persistent data root: `/srv/impact-journal/data`

Quick start:

```sh
cp .env.production.example .env.production
docker compose --env-file .env.production -f docker-compose.production.yaml up -d --build
```

See `@DEPLOYMENT.md` for the full runbook, update flow, and backup notes.

## Repo guide

- `@PLAN.md` tracks the shipped MVP status and next optional work
- `@SETUP.md` covers local and hosted setup expectations
- `@ARCHITECTURE.md` describes the monolith, auth, media, and deployment shape
- `@prd/journal-mvp.md`, `@prd/ui-ux.md`, and `@prd/data-model.md` remain the product source of truth
