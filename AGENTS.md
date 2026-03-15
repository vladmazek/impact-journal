# AGENTS.md

## Purpose

This repository builds **Impact Journal**, a private single-user journal with guided daily/weekly reflection and a premium notebook-style interface.

This file tells Codex and future contributors how to work in this repository.

## Primary goal

Ship a polished MVP that feels fast, calm, and trustworthy.

## Non-negotiable product truths

- This is a **single-user** application.
- The journal experience is the main product.
- The writing UI should feel elegant, minimal, and distraction-light.
- Image uploads are supported; general file attachments are not in MVP.
- Data durability matters. Mounted host storage is required for images.
- The UI should feel premium on both desktop and mobile web.

## Technical defaults

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Prisma ORM
- MariaDB
- Docker deployment behind Caddy
- filesystem media storage on a mounted host volume

## Working style

- Make the smallest correct change that moves the milestone forward.
- Prefer clean, readable code over clever abstractions.
- Reuse a few strong layout primitives instead of inventing many.
- Keep client-side state localized.
- Favor server-side reads/writes where practical.
- Minimize dependencies.

## Repository reference style

When referencing files in plans, reviews, and prompts, use repository paths with a leading `@`.

Examples:
- `@README.md`
- `@PLAN.md`
- `@ARCHITECTURE.md`
- `@prd/journal-mvp.md`
- `@prd/ui-ux.md`

Do **not** prefix references with `/docs`.

## UX rules

- Large text entry should open in an elegant focused modal/sheet that takes most of the viewport.
- Background content should dim/blur while long-form writing is active.
- A small top bar should hold date, theme, and settings.
- The app should hint at a journal page without becoming skeuomorphic clutter.
- Light and dark mode are both first-class.
- Use a blue highlight/accent color.
- Use subtle dividers, ruled spacing hints, and notebook-inspired rhythm.
- Motion should be restrained and calm.

## Data and storage rules

- Image files must live on a real mounted host path.
- Filenames must begin with `YYYY-MM-DD-`.
- Prefer slugified readable names.
- Avoid duplicate filenames by adding a short suffix only when needed.
- Store image metadata in the DB; do not infer everything from the filesystem.
- Never store secrets in the repo.

## Auth rules

- Email + password auth only for MVP.
- Hash passwords using a modern password hash.
- Use secure, HTTP-only cookies/sessions.
- All app routes except login/setup should require auth.

## What Codex should avoid

- Do not add multi-user assumptions.
- Do not add social auth.
- Do not add S3/cloud storage in MVP.
- Do not add background job infrastructure unless truly necessary.
- Do not add a complex dashboard before the core journal flow works.
- Do not add AI journaling features in MVP.
- Do not convert the app into a generic note-taking tool.

## Required implementation discipline

For each milestone:
1. Review the relevant specs in `@README.md`, `@PLAN.md`, `@ARCHITECTURE.md`, and the matching PRD files.
2. State what files will change.
3. Make the changes.
4. Run validation.
5. Summarize exactly what was completed and what remains.

## Validation expectations

At minimum, after each meaningful milestone:
- app builds
- lint passes
- database migrations are valid
- core happy-path UX can be manually verified
- media path assumptions are documented if touched

## When making architecture decisions

Choose the option that:
- reduces moving parts
- preserves data durability
- keeps future editing simple
- protects the writing experience
- fits a single-user product

## Output style for Codex

Be concrete. Be brief. Be implementation-oriented.

When giving handoffs or status summaries:
- group changed files by area
- explain why each area changed
- list validations run
- state remaining risk plainly
