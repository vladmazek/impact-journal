# PLAN.md

## Objective

Ship a polished single-user journaling MVP that is pleasant enough to use daily and practical to deploy on a small Docker host.

## Current state

Completed MVP areas:

1. Foundation, Docker-first local development, Prisma, MariaDB, and mounted media storage
2. Owner setup, login, logout, hashed passwords, secure session cookies, and protected journal routes
3. Daily entry persistence with one entry per date and autosave
4. Guided daily journaling UX with mood, prompts, relax list, and focused writing modal
5. Image attachments plus lightweight tags with picker reuse and `#tag` parsing
6. Weekly reflection with ISO-week routing, life-area ratings, long-form prompts, and day links
7. Settings, password change, production deployment artifacts, and refreshed handoff docs

## What the MVP now includes

- `/setup`, `/login`, `/today`, `/entry/[date]`, `/week/[year]/[week]`, and `/settings`
- private media serving through the app
- daily and weekly autosave surfaces
- reusable tag model behavior with normalized slugs and duplicate collapse
- timezone-aware day and week resolution
- production Docker + Caddy deployment for `impact.vlad.net`

## Validation baseline

The repo should stay green on:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:unit`
- `pnpm test:e2e`
- `pnpm build`
- `docker compose -f docker-compose.production.yaml config`

## Post-MVP candidates

These are intentionally deferred:

- export
- reminders
- richer browse/search
- analytics
- PWA installability
- multi-user features
- AI journaling features
