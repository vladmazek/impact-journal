# PRD: Data Model

## Goal

Define the MVP persistence model for Impact Journal.

## Database

MariaDB is the source of truth.
Use Prisma as the ORM.

## Entities

### User
Represents the single authenticated user.

Suggested fields:
- `id`
- `email` (unique)
- `passwordHash`
- `displayName` (optional)
- `timezone` (default to user setting or app default)
- `createdAt`
- `updatedAt`

Notes:
- MVP assumes one real account, but keep the schema sane.

### DailyEntry
Represents one journal record per local calendar date.

Suggested fields:
- `id`
- `userId`
- `entryDate` (`DATE`)
- `status` (`not_started`, `in_progress`, `completed`)
- `moodValue`
- `moodEmoji`
- `moodLabel`
- `gratitude1`
- `gratitude2`
- `gratitude3`
- `todayGreat`
- `affirmation`
- `dailyCapture` (`LONGTEXT`)
- `eveningGood1`
- `eveningGood2`
- `eveningGood3`
- `improveTomorrow`
- `createdAt`
- `updatedAt`

Constraints:
- unique on (`userId`, `entryDate`)

### RelaxItem
Small unwind list items linked to a daily entry.

Suggested fields:
- `id`
- `dailyEntryId`
- `sortOrder`
- `text`
- `createdAt`
- `updatedAt`

Constraints:
- max 5 enforced at application layer for MVP

### Tag
Reusable tag label.

Suggested fields:
- `id`
- `userId`
- `name`
- `slug`
- `color` (optional, probably defer real use)
- `createdAt`
- `updatedAt`

Constraints:
- unique on (`userId`, `slug`)

### DailyEntryTag
Join table between entries and tags.

Suggested fields:
- `dailyEntryId`
- `tagId`
- `createdAt`

Constraints:
- unique on (`dailyEntryId`, `tagId`)

### ImageAttachment
Metadata for uploaded images.

Suggested fields:
- `id`
- `userId`
- `dailyEntryId`
- `originalFilename`
- `storedFilename`
- `relativePath`
- `mimeType`
- `extension`
- `byteSize`
- `width` (nullable)
- `height` (nullable)
- `caption` (nullable; optional MVP)
- `sortOrder`
- `createdAt`
- `updatedAt`

### WeeklyReflection
One reflection per ISO week.

Suggested fields:
- `id`
- `userId`
- `isoYear`
- `isoWeek`
- `overallMoodValue`
- `overallMoodEmoji`
- `overallMoodLabel`
- `energySummary`
- `wins`
- `hardMoments`
- `feltOff`
- `nextWeekIntention`
- `createdAt`
- `updatedAt`

Constraints:
- unique on (`userId`, `isoYear`, `isoWeek`)

### WeeklyLifeAreaRating
Life-area sub-records for a weekly reflection.

Suggested fields:
- `id`
- `weeklyReflectionId`
- `areaKey`
- `rating` (1–5)
- `note` (nullable)
- `createdAt`
- `updatedAt`

Suggested `areaKey` values:
- `work`
- `family_home`
- `health`
- `stress`
- `personal_fulfillment`

## Suggested Prisma modeling notes

- Use `DateTime` in Prisma for timestamps.
- Map `entryDate` to a date-only concept carefully.
- Store mood label data redundantly for simpler rendering/history.
- Keep weekly mood separate from derived daily rollups.

## File storage contract

Files live on disk; DB stores metadata.

Example:
- DB `relativePath`: `originals/2026/03/2026-03-14-beach-sunrise.webp`
- host absolute path: `/data/journal/media/originals/2026/03/2026-03-14-beach-sunrise.webp`

Benefits:
- DB stays portable
- base media root can change by environment
- file serving is easier to reason about

## Tag parsing behavior

When parsing `#tag` tokens from `dailyCapture`:
- normalize to lowercase slug
- preserve human-friendly display name
- deduplicate before insert
- do not allow pathological tag lengths

Suggested app-level rules:
- max 30 chars per tag
- letters, numbers, dashes, underscores only after normalization

## Entry completion heuristic

Suggested heuristic for `completed`:
- mood selected
- at least one meaningful text field completed
- or explicit user mark-complete action

Avoid overcomplicating this in the DB.

## Deletion behavior

### Images
Preferred MVP behavior:
- deleting image attachment removes DB record and deletes file from disk

### Tags
- deleting a tag should remove join rows, not delete entries

### Daily entries
- hard delete is acceptable for MVP if implemented carefully
- soft delete can wait unless Codex finds it cheap and clean

## Indexing priorities

Add indexes for:
- `DailyEntry(userId, entryDate)`
- `WeeklyReflection(userId, isoYear, isoWeek)`
- `Tag(userId, slug)`
- `ImageAttachment(dailyEntryId, sortOrder)`

## Data migration notes

Because MariaDB is used from day one:
- create proper initial migration
- include seed/bootstrap workflow for first user
- do not prototype on SQLite and “fix later”
