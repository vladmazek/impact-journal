# PLAN.md

## Objective

Ship a polished single-user journaling MVP that is pleasant enough to use daily and practical to deploy on a small Docker host.

## Current state

Completed MVP areas:

1. Foundation, Docker-first local development, Prisma, MariaDB, and mounted media storage
2. Owner setup, login, logout, hashed passwords, secure session cookies, and protected journal routes
3. Daily entry persistence with one entry per date and autosave
4. Guided daily journaling UX with mood, quote-first header, time-aware card-based prompt accordions, relax list, and focused writing modal
5. Image attachments plus lightweight tags with manual pinning and parsed hashtags from structured and free-form entry text
6. Weekly reflection with ISO-week routing, life-area ratings, long-form prompts, and day links
7. Settings, password change, theme, avatar, live journal-prompt customization, and home-location-driven timezone behavior
8. Production deployment for `impact.vlad.net` plus a documented sync-based live update flow

## What the app now includes

- `/setup`, `/login`, `/today`, `/entry/[date]`, `/week/[year]/[week]`, and `/settings`
- `/api/media/[...path]` for private media and `/api/location-search` for authenticated location autocomplete
- a full-page auth background treatment with a single centered login card, while setup remains first-run only
- a quote-only daily hero, permanent journal-style morning/evening prompt cards with ambient sunrise/night header illustrations, collapsible mood picker behavior, and a minimal sidebar for mood, images, and tags
- owner-editable morning/evening prompt titles, descriptions, and placeholders that apply globally across daily pages
- timezone-aware day and week resolution driven by the saved owner settings
- reusable tag behavior with normalized slugs, duplicate collapse, and `isManual` preservation
- mirrored-source production deployment currently hosted at `impact.vlad.net`

## Validation baseline

The repo should stay green on:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:unit`
- `pnpm test:e2e`
- `pnpm build`
- `docker compose -f docker-compose.production.yaml config`

For local interactive development, avoid `pnpm build` inside the shared dev container if that container persists `.next`.

## Post-MVP candidates

These are intentionally deferred:

- richer day/night theme cues with minimalist sun-up / moon-up visual backgrounds that signal time of day without distracting from writing, using stronger non-pastel color treatment
- local weather surfaced from the saved home location
- export
- reminders
- richer browse/search
- analytics
- PWA installability
- multi-user features
- AI journaling features
