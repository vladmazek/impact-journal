# ARCHITECTURE.md

## Overview

Impact Journal is a single-user private journaling monolith built with Next.js App Router.

Runtime shape:

```text
Browser
  │
  ▼
Caddy / reverse proxy
  │
  ▼
Next.js app
  ├── App Router pages and server actions
  ├── Auth/session logic
  ├── Prisma client
  ├── Private media route
  └── Location autocomplete route
          │
          ├── MariaDB
          └── Mounted host media path
```

## Why this shape

This product does not need a separate API service for MVP. The monolith keeps:

- fewer moving parts
- simpler deployment
- server-rendered reads close to the UI
- straightforward extension for future iterations

## Implemented route map

- `@app/(auth)/setup/page.tsx`
- `@app/(auth)/login/page.tsx`
- `@app/(journal)/today/page.tsx`
- `@app/(journal)/entry/[date]/page.tsx`
- `@app/(journal)/week/[year]/[week]/page.tsx`
- `@app/(journal)/settings/page.tsx`
- `@app/api/media/[...path]/route.ts`
- `@app/api/location-search/route.ts`

## Core modules

### Auth

- single-owner setup gate
- email/password login
- setup remains a first-run route, while login uses a single centered card over a full-page landscape background
- Argon2 password hashing
- signed HTTP-only cookie session
- session refresh after profile and theme changes

### Daily journal

- one daily entry per local calendar date
- autosave server action
- quote-only header with one random quote per request from `@quotes.json`
- mood picker that collapses after selection and reopens from a sidebar mood anchor
- morning and evening prompt accordions with permanent card-based form layouts and built-in morning/night header illustrations
- time-aware default accordion selection on today's page
- both prompt sections expanded by default on non-today entries
- relax list and long-form daily capture modal
- lightweight tag associations and parsed hashtags
- image attachment metadata plus mounted file storage

### Weekly reflection

- one reflection per ISO week
- timezone-aware current week resolution
- weekly mood, context, wins, hard moments, felt off, next intention
- life-area ratings with optional notes
- quick links back to the week's daily pages

### Settings

- display name, email, home location, derived timezone, avatar, theme, and daily prompt copy updates
- authenticated location autocomplete backed by the app's `/api/location-search` route
- password change
- owner-only account surface with no multi-user admin layer

### Media

- uploads validated server-side
- private media served through `@app/api/media/[...path]/route.ts`
- mounted filesystem storage
- normalized date-first filenames

## Persistence notes

MariaDB is the source of truth. Prisma owns the schema and migrations.

Key tables:

- `User`
- `DailyEntry`
- `RelaxItem`
- `Tag`
- `DailyEntryTag`
- `ImageAttachment`
- `WeeklyReflection`
- `WeeklyLifeAreaRating`

Notable behavior:

- `User` stores structured home location fields plus the derived timezone used across daily and weekly routing
- `User.journalPromptConfig` stores the single owner's editable morning/evening prompt copy as serialized JSON, with app defaults used when the field is `null`
- `DailyEntryTag.isManual` preserves picker-selected tags independently from hashtag-derived tags
- parsed tags are built from morning fields, evening fields, and the free-form writing space
- relax items do not generate parsed tags
- daily blank entries are pruned when all meaningful content, images, and tags disappear
- weekly reflections are suppressed until meaningful content exists

## Deployment shape

The repo still includes a standalone production stack:

- `@Dockerfile`
- `@docker-compose.production.yaml`
- `@docker/caddy/Caddyfile`

That stack assumes:

- host root: `/srv/impact-journal`
- persistent DB: `/srv/impact-journal/data/db`
- persistent media: `/srv/impact-journal/data/media`

The current live host for `impact.vlad.net` is organized differently:

- stack root: `/data/vlad-impact`
- mirrored app source: `/data/vlad-impact/app`
- compose file: `/data/vlad-impact/docker-compose.yaml`
- services: `impact-app`, `impact-db`
- DB storage: `/data/vlad-impact/mariadb`
- media storage: `/data/vlad-impact/media`
- public traffic handled by an already-running host-level Caddy stack

The live host is not a git checkout. Deployments sync the repo into `/data/vlad-impact/app` and rebuild `impact-app`.
