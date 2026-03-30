# Impact Journal

Impact Journal is a private single-user journal built with Next.js, TypeScript, Tailwind, Prisma, MariaDB, and mounted filesystem media storage.

## MVP status

The current app is implemented, deployed, and in active polish:

- owner setup, login, logout, hashed password auth, and secure HTTP-only sessions
- protected daily journaling with autosave, mood selection, relax list, guided prompts, and a focused long-form writing modal
- a quote-first daily header with one random motivational quote per page load
- time-aware morning/evening prompt accordions on today's page, with permanent card-based prompt layouts, ambient morning/night header illustrations, and both prompt sections expanded on older entries
- a minimal right sidebar for mood anchor, images, and tags
- image uploads backed by mounted host storage with normalized filenames and DB metadata
- lightweight tags with manual pinning plus `#tag` parsing from morning, evening, and free-form writing fields
- weekly reflection with ISO-week routing, overall mood, life-area ratings, long-form prompts, and day links
- settings for owner profile, live daily prompt preset copy, home location autocomplete, derived timezone, avatar, theme, email, and password updates
- Docker-first local development plus a production deployment currently serving `impact.vlad.net`

## Product boundaries

Implemented MVP:

- single-user only
- journal-first UI
- image attachments only
- MariaDB + Prisma persistence
- mounted filesystem media storage
- mobile-friendly daily and weekly flows
- premium light and dark themes

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

For production-build verification, prefer an isolated image build or the production compose stack. The shared local dev container keeps a mounted `.next` directory, so running `pnpm build` there can poison the dev cache.

## Runtime and storage

Default local host mounts:

- DB: `/Users/vlad/impact-journal-data/db`
- media: `/Users/vlad/impact-journal-data/media`

Container paths:

- app media root: `/data/journal/media`
- MariaDB data dir: `/var/lib/mysql`

Images are stored under:

- `originals/YYYY/MM/YYYY-MM-DD-readable-slug[-suffix].ext`

Avatar files live under the same media root in:

- `avatars/`

Private media is served through `@app/api/media/[...path]/route.ts`, not from a public bucket.

## Production deployment

The repo still includes a standalone production stack in:

- `@Dockerfile`
- `@docker-compose.production.yaml`
- `@docker/caddy/Caddyfile`
- `@.env.production.example`
- `@DEPLOYMENT.md`

That standalone stack defaults to:

- app root: `/srv/impact-journal`
- persistent data root: `/srv/impact-journal/data`

The current live deployment for `impact.vlad.net` uses a mirrored app tree under:

- stack root: `/data/vlad-impact`
- app source mirror: `/data/vlad-impact/app`
- env file: `/data/vlad-impact/.env`
- DB storage: `/data/vlad-impact/mariadb`
- media storage: `/data/vlad-impact/media`

The live host deploy flow is:

1. back up `/data/vlad-impact/app`
2. create a MariaDB dump
3. mirror this repo into `/data/vlad-impact/app` with `rsync --delete`
4. rebuild `impact-app` from `/data/vlad-impact`

See `@DEPLOYMENT.md` for both the standalone stack notes and the live-host update flow.

## Repo guide

- `@PLAN.md` tracks the shipped MVP status and next optional work
- `@SETUP.md` covers local and hosted setup expectations
- `@ARCHITECTURE.md` describes the monolith, auth, media, and deployment shape
- `@prd/journal-mvp.md`, `@prd/ui-ux.md`, and `@prd/data-model.md` describe the current product intent and persistence model
