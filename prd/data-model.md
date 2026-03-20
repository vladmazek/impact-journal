# PRD: Data Model

## Goal

Define the current MVP persistence model for Impact Journal.

## Database

MariaDB is the source of truth.
Use Prisma as the ORM.

## Entities

### User

Represents the single authenticated user.

Current fields:

- `id`
- `email` (unique)
- `passwordHash`
- `displayName` (optional)
- `locationLabel` (optional)
- `locationCity` (optional)
- `locationRegion` (optional)
- `locationCountry` (optional)
- `locationLatitude` (optional)
- `locationLongitude` (optional)
- `timezone` (derived from saved home location or app default)
- `themePreference`
- avatar metadata fields
- `createdAt`
- `updatedAt`

Notes:

- MVP still assumes one real account
- `timezone` remains the internal source of truth for day and week logic
- location data is stored structurally so future weather can be added cleanly

### DailyEntry

Represents one journal record per local calendar date.

Current fields:

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

Fields:

- `id`
- `dailyEntryId`
- `sortOrder`
- `text`
- `createdAt`
- `updatedAt`

Constraints:

- max 5 enforced at the application layer

### Tag

Reusable tag label.

Fields:

- `id`
- `userId`
- `name`
- `slug`
- `color` (nullable, not currently emphasized in UI)
- `createdAt`
- `updatedAt`

Constraints:

- unique on (`userId`, `slug`)

### DailyEntryTag

Join table between entries and tags.

Fields:

- `dailyEntryId`
- `tagId`
- `isManual`
- `createdAt`

Constraints:

- unique on (`dailyEntryId`, `tagId`)

Notes:

- `isManual` preserves explicitly added tags even when parsed hashtags disappear

### ImageAttachment

Metadata for uploaded images.

Fields:

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
- `caption` (nullable, still optional)
- `sortOrder`
- `createdAt`
- `updatedAt`

### WeeklyReflection

One reflection per ISO week.

Fields:

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

Fields:

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

## File storage contract

Files live on disk; DB stores metadata.

Examples:

- DB `relativePath`: `originals/2026/03/2026-03-14-beach-sunrise.webp`
- host absolute path: `/data/journal/media/originals/2026/03/2026-03-14-beach-sunrise.webp`

Avatar files use the same media root under:

- `avatars/...`

Benefits:

- DB stays portable
- base media root can change by environment
- file serving is easier to reason about

## Tag parsing behavior

When parsing `#tag` tokens:

- build the parsed-text source from `gratitude1`, `gratitude2`, `gratitude3`, `todayGreat`, `affirmation`, `dailyCapture`, `eveningGood1`, `eveningGood2`, `eveningGood3`, and `improveTomorrow`
- normalize to lowercase slug
- preserve human-friendly display name
- deduplicate before insert
- do not allow pathological tag lengths

Explicit exclusions:

- `relaxItems`
- mood fields
- manual tags themselves

Suggested app-level rules:

- max 30 chars per tag
- letters, numbers, dashes, underscores only after normalization

## Entry completion heuristic

Current heuristic for `completed`:

- mood selected
- and meaningful content present

`in_progress` covers partial states.

Avoid overcomplicating this in the DB.

## Deletion behavior

### Images

- deleting an image attachment removes the DB record and deletes the file from disk

### Tags

- deleting a tag should remove join rows, not delete entries

### Daily entries

- blank daily entries can be pruned when they lose all meaningful content, images, and tags

## Indexing priorities

Add indexes for:

- `DailyEntry(userId, entryDate)`
- `WeeklyReflection(userId, isoYear, isoWeek)`
- `Tag(userId, slug)`
- `ImageAttachment(dailyEntryId, sortOrder)`

## Data migration notes

Because MariaDB is used from day one:

- create real Prisma migrations
- include seed/bootstrap workflow for the first user
- do not prototype on SQLite and “fix later”
