# ARCHITECTURE.md

## Overview

Impact Journal is a single-user private journaling monolith built with Next.js App Router.

Runtime shape:

```text
Browser
  │
  ▼
Caddy
  │
  ▼
Next.js app
  ├── App Router pages and server actions
  ├── Auth/session logic
  ├── Prisma client
  └── Private media route
          │
          ├── MariaDB
          └── Mounted host media path
```

## Why this shape

This product does not need a separate API service for MVP. The monolith keeps:

- fewer moving parts
- simpler deployment
- server-rendered reads close to the UI
- straightforward extension for future Codex sessions

## Implemented route map

- `@app/(auth)/setup/page.tsx`
- `@app/(auth)/login/page.tsx`
- `@app/(journal)/today/page.tsx`
- `@app/(journal)/entry/[date]/page.tsx`
- `@app/(journal)/week/[year]/[week]/page.tsx`
- `@app/(journal)/settings/page.tsx`
- `@app/api/media/[...path]/route.ts`

## Core modules

### Auth

- single-owner setup gate
- email/password login
- Argon2 password hashing
- signed HTTP-only cookie session
- session refresh after profile and theme changes

### Daily journal

- one daily entry per local calendar date
- autosave server action
- mood, prompts, relax list, long-form daily capture
- lightweight tag associations
- image attachment metadata + mounted file storage

### Weekly reflection

- one reflection per ISO week
- timezone-aware current week resolution
- weekly mood, context, wins, hard moments, felt off, next intention
- life-area ratings with optional notes
- quick links back to the week’s daily pages

### Settings

- display name, email, timezone, avatar, and theme updates
- password change with current-password verification
- owner-only account surface, no multi-user admin layer

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

- `DailyEntryTag.isManual` preserves picker-selected tags independently from hashtag-derived tags
- daily blank entries are pruned when all meaningful content, images, and tags disappear
- weekly reflections are suppressed until meaningful content exists

## Deployment shape

Production uses:

- multi-stage `@Dockerfile`
- `@docker-compose.production.yaml`
- `@docker/caddy/Caddyfile`

Default hosted target:

- domain: `impact.vlad.net`
- host storage root: `/srv/impact-journal/data`

Persistent mounts:

- DB: `/srv/impact-journal/data/db`
- media: `/srv/impact-journal/data/media`
